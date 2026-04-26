const ReorderSuggestion = require('../models/ReorderSuggestion');
const Purchase          = require('../models/Purchase');
const Variant           = require('../models/Variant');
const User              = require('../models/User');
const asyncHandler      = require('../utils/asyncHandler');
const { log }           = require('../utils/auditLogger');
const { runWithOptionalTransaction } = require('../utils/mongoTransaction');
const { sendReorderNotificationEmail } = require('../config/mailer');

const getSuggestions = asyncHandler(async (req, res) => {
  const { status = 'pending', page = 1, limit = 50 } = req.query;
  const query = {};
  if (status !== 'all') query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [suggestions, total] = await Promise.all([
    ReorderSuggestion.find(query)
      .populate('variant',  'sku color size quantity lowStockThreshold reorderQuantity')
      .populate('product',  'name category')
      .populate('supplier', 'name email phone contactPerson')
      .populate('resolvedBy', 'username')
      .populate('purchaseOrder', 'purchaseNumber status totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ReorderSuggestion.countDocuments(query)
  ]);

  res.json({ suggestions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

const checkAndCreateSuggestions = asyncHandler(async (req, res) => {
  const variants = await Variant.find({ isActive: true })
    .populate('product', 'name category supplier')
    .populate('preferredSupplier', 'name email');

  const created = [];

  for (const v of variants) {
    if (v.quantity > v.lowStockThreshold) continue;

    const supplierId = v.preferredSupplier?._id || v.product?.supplier;
    if (!supplierId) continue;   

    const existing = await ReorderSuggestion.findOne({
      variant: v._id,
      status:  'pending'
    });
    if (existing) continue;

    const suggestion = await ReorderSuggestion.create({
      variant:           v._id,
      product:           v.product._id,
      supplier:          supplierId,
      currentStock:      v.quantity,
      threshold:         v.lowStockThreshold,
      suggestedQuantity: v.reorderQuantity || 50,
    });

    created.push(suggestion._id);
  }

  res.json({
    message:  `${created.length} new reorder suggestion(s) created`,
    created:  created.length,
    ids:      created
  });
});

const approveSuggestion = asyncHandler(async (req, res) => {
  const { quantity, notes } = req.body;

  const suggestion = await ReorderSuggestion.findById(req.params.id)
    .populate('variant',  'sku costPrice reorderQuantity')
    .populate('product',  'name')
    .populate('supplier', 'name email');

  if (!suggestion)              return res.status(404).json({ message: 'Suggestion not found' });
  if (suggestion.status !== 'pending') {
    return res.status(400).json({ message: `Suggestion is already ${suggestion.status}` });
  }

  const finalQty  = Number(quantity) || suggestion.suggestedQuantity;
  const unitCost  = suggestion.variant.costPrice || 0;
  const itemTotal = unitCost * finalQty;
  const purchase = await runWithOptionalTransaction(async ({ session }) => {
    const purchaseDoc = new Purchase({
      supplier:    suggestion.supplier._id,
      items: [{
        variant:  suggestion.variant._id,
        product:  suggestion.product._id,
        quantity: finalQty,
        unitCost,
        total:    itemTotal
      }],
      totalAmount:   itemTotal,
      status:        'pending',
      notes:         notes || `Auto-generated reorder for ${suggestion.product.name} (${suggestion.variant.sku})`,
      createdBy:     req.user._id
    });

    await purchaseDoc.save(session ? { session } : {});
    return purchaseDoc;
  });

  suggestion.status           = 'approved';
  suggestion.approvedQuantity = finalQty;
  suggestion.purchaseOrder    = purchase._id;
  suggestion.resolvedBy       = req.user._id;
  suggestion.resolvedAt       = new Date();
  suggestion.notes            = notes || '';
  await suggestion.save();

  await log({
    user:        req.user,
    action:      'REORDER_APPROVED',
    entity:      'ReorderSuggestion',
    entityId:    suggestion._id,
    description: `Approved reorder for ${suggestion.product.name} (${suggestion.variant.sku}) — qty ${finalQty} → PO ${purchase.purchaseNumber}`
  });

  try {
    const managers = await User.find({
      role:     { $in: ['admin', 'manager'] },
      isActive: true
    }).select('email username');

    for (const mgr of managers) {
      if (mgr.email) {
        await sendReorderNotificationEmail(
          mgr.email,
          mgr.username,
          {
            productName:    suggestion.product.name,
            sku:            suggestion.variant.sku,
            supplier:       suggestion.supplier.name,
            quantity:       finalQty,
            purchaseNumber: purchase.purchaseNumber,
            approvedBy:     req.user.username
          }
        );
      }
    }
  } catch (mailErr) {
    console.error('[Reorder] Email notification failed:', mailErr.message);
  }

  const populated = await Purchase.findById(purchase._id)
    .populate('supplier', 'name')
    .populate('items.variant', 'sku color size')
    .populate('items.product', 'name');

  res.status(201).json({
    message:    'Reorder approved and purchase order created',
    suggestion: { _id: suggestion._id, status: suggestion.status },
    purchase:   populated
  });
});

const cancelSuggestion = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const suggestion = await ReorderSuggestion.findById(req.params.id);
  if (!suggestion)              return res.status(404).json({ message: 'Suggestion not found' });
  if (suggestion.status !== 'pending') {
    return res.status(400).json({ message: `Suggestion is already ${suggestion.status}` });
  }

  suggestion.status      = 'cancelled';
  suggestion.resolvedBy  = req.user._id;
  suggestion.resolvedAt  = new Date();
  suggestion.notes       = notes || '';
  await suggestion.save();

  await log({
    user:        req.user,
    action:      'REORDER_CANCELLED',
    entity:      'ReorderSuggestion',
    entityId:    suggestion._id,
    description: `Cancelled reorder suggestion for variant ${suggestion.variant}`
  });

  res.json({ message: 'Reorder suggestion cancelled', suggestion });
});

const getPendingCount = asyncHandler(async (req, res) => {
  const count = await ReorderSuggestion.countDocuments({ status: 'pending' });
  res.json({ count });
});

module.exports = {
  getSuggestions,
  checkAndCreateSuggestions,
  approveSuggestion,
  cancelSuggestion,
  getPendingCount
};

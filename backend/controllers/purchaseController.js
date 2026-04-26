const Purchase     = require('../models/Purchase');
const Variant      = require('../models/Variant');
const asyncHandler = require('../utils/asyncHandler');
const { log }      = require('../utils/auditLogger');
const { runWithOptionalTransaction } = require('../utils/mongoTransaction');

const getPurchases = asyncHandler(async (req, res) => {
  const { startDate, endDate, status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate)   query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [purchases, total] = await Promise.all([
    Purchase.find(query)
      .populate('supplier', 'name')
      .populate('items.variant', 'sku color size')
      .populate('items.product', 'name')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Purchase.countDocuments(query)
  ]);

  res.json({ purchases, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

const getPurchase = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id)
    .populate('supplier', 'name email phone')
    .populate('items.variant', 'sku color size')
    .populate('items.product', 'name')
    .populate('createdBy', 'username');

  if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
  res.json(purchase);
});

const createPurchase = asyncHandler(async (req, res) => {
  const { supplier, items, invoiceNumber, notes, status } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'At least one item is required' });
  }

  const purchase = await runWithOptionalTransaction(async ({ session }) => {
    let totalAmount = 0;
    const processedItems = [];
    const variantUpdates = [];

    for (const item of items) {
      let q = Variant.findById(item.variant).populate('product');
      if (session) q = q.session(session);
      const variant = await q;

      if (!variant) throw new Error('Variant not found');

      const unitCost  = item.unitCost ?? variant.costPrice ?? 0;
      const itemTotal = unitCost * item.quantity;
      totalAmount    += itemTotal;

      processedItems.push({
        variant:  variant._id,
        product:  variant.product._id,
        quantity: item.quantity,
        unitCost,
        total:    itemTotal
      });
      variantUpdates.push({ variantId: variant._id, quantity: item.quantity });
    }

const purchaseStatus = status || 'received';
    if (purchaseStatus === 'received') {
      for (const u of variantUpdates) {
        const opts = session ? { session } : {};
        await Variant.findByIdAndUpdate(u.variantId, { $inc: { quantity: u.quantity } }, opts);
      }
    }

    const purchaseDoc = new Purchase({
      supplier,
      items:     processedItems,
      totalAmount,
      invoiceNumber,
      notes,
      status:    purchaseStatus,
      createdBy: req.user._id
    });

    await purchaseDoc.save(session ? { session } : {});
    return purchaseDoc;
  });

  await log({
    user:        req.user,
    action:      'PURCHASE_CREATE',
    entity:      'Purchase',
    entityId:    purchase._id,
    description: `Recorded purchase ${purchase.purchaseNumber} — ₹${purchase.totalAmount} (${purchase.items.length} item(s))`
  });

  const populated = await Purchase.findById(purchase._id)
    .populate('supplier', 'name')
    .populate('items.variant', 'sku color size')
    .populate('items.product', 'name');

  res.status(201).json(populated);
});

const updatePurchaseStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['received', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status update' });
  }

  const purchase = await runWithOptionalTransaction(async ({ session }) => {
    let q = Purchase.findById(req.params.id);
    if (session) q = q.session(session);
    const p = await q;

    if (!p) throw new Error('Purchase not found');
    if (p.status !== 'pending') throw new Error(`Cannot update purchase from status: ${p.status}`);

    p.status = status;
    await p.save(session ? { session } : {});

    if (status === 'received') {
      for (const item of p.items) {
        const opts = session ? { session } : {};
        await Variant.findByIdAndUpdate(item.variant, { $inc: { quantity: item.quantity } }, opts);
      }
    }

    return p;
  });

  await log({
    user:        req.user,
    action:      'PURCHASE_UPDATE',
    entity:      'Purchase',
    entityId:    purchase._id,
    description: `Updated purchase ${purchase.purchaseNumber} status to ${status}`
  });

  res.json(purchase);
});

module.exports = { getPurchases, getPurchase, createPurchase, updatePurchaseStatus };

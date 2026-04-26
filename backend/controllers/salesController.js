const Sale         = require('../models/Sale');
const Variant      = require('../models/Variant');
const asyncHandler = require('../utils/asyncHandler');
const { log }      = require('../utils/auditLogger');
const { runWithOptionalTransaction } = require('../utils/mongoTransaction');

const getSales = asyncHandler(async (req, res) => {
  const { startDate, endDate, status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate)   query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }
  if (status) query.status = status;

if (req.user.role === 'staff') {
    query.createdBy = req.user._id;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [sales, total] = await Promise.all([
    Sale.find(query)
      .populate('items.variant', 'sku color size')
      .populate('items.product', 'name')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Sale.countDocuments(query)
  ]);

  res.json({ sales, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

const getSale = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (req.user.role === 'staff') query.createdBy = req.user._id;

  const sale = await Sale.findOne(query)
    .populate('items.variant', 'sku color size price')
    .populate('items.product', 'name category')
    .populate('createdBy', 'username');

  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  res.json(sale);
});

const createSale = asyncHandler(async (req, res) => {
  const { items, customer, paymentMethod, notes } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'At least one item is required' });
  }

  const sale = await runWithOptionalTransaction(async ({ session }) => {
    let totalAmount = 0;
    const processedItems = [];
    const variantUpdates = [];

    for (const item of items) {
      let q = Variant.findById(item.variant).populate('product');
      if (session) q = q.session(session);
      const variant = await q;

      if (!variant)                      throw new Error('Variant not found');
      if (!variant.isActive)             throw new Error(`Variant ${variant.sku} is inactive`);
      if (variant.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${variant.sku} (${variant.color}/${variant.size}). Available: ${variant.quantity}`);
      }

      const unitPrice = variant.price ?? variant.product?.basePrice ?? 0;
      const itemTotal = unitPrice * item.quantity;
      totalAmount    += itemTotal;

      processedItems.push({
        variant:   variant._id,
        product:   variant.product._id,
        quantity:  item.quantity,
        unitPrice,
        total:     itemTotal
      });
      variantUpdates.push({ variantId: variant._id, quantity: item.quantity });
    }

    for (const u of variantUpdates) {
      const opts = session ? { session } : {};
      await Variant.findByIdAndUpdate(u.variantId, { $inc: { quantity: -u.quantity } }, opts);
    }

    const saleDoc = new Sale({
      items:         processedItems,
      totalAmount,
      customer:      customer || 'Walk-in Customer',
      paymentMethod: paymentMethod || 'cash',
      notes,
      createdBy:     req.user._id
    });

    await saleDoc.save(session ? { session } : {});
    return saleDoc;
  });

  await log({
    user:        req.user,
    action:      'SALE_CREATE',
    entity:      'Sale',
    entityId:    sale._id,
    description: `Recorded sale ${sale.saleNumber} — ₹${sale.totalAmount} (${sale.items.length} item(s))`
  });

  const populated = await Sale.findById(sale._id)
    .populate('items.variant', 'sku color size')
    .populate('items.product', 'name');

  res.status(201).json(populated);
});

module.exports = { getSales, getSale, createSale };

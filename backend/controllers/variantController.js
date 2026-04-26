const Variant      = require('../models/Variant');
const Product      = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { log }      = require('../utils/auditLogger');
const { getDuplicateKeyMessage } = require('../utils/mongoError');

const genSKU = (productName, color, size) => {
  const base = productName.replace(/\s+/g, '-').toUpperCase().slice(0, 8);
  const c    = (color || 'X').toUpperCase().slice(0, 3);
  const s    = (size  || 'X').toUpperCase().slice(0, 3);
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${base}-${c}-${s}-${rand}`;
};

const getVariants = asyncHandler(async (req, res) => {
  const { productId, lowStock } = req.query;
  const query = { isActive: true };
  if (productId) query.product = productId;

  let variants = await Variant.find(query).populate('product', 'name category basePrice');

  if (lowStock === 'true') {
    variants = variants.filter((v) => v.quantity <= v.lowStockThreshold);
  }

  res.json(variants);
});

const createVariant = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.body.product);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  if (!req.body.sku) req.body.sku = genSKU(product.name, req.body.color, req.body.size);

  const variant = await Variant.create(req.body);

  await log({
    user:        req.user,
    action:      'VARIANT_CREATE',
    entity:      'Variant',
    entityId:    variant._id,
    description: `Added variant ${variant.sku} (${variant.color || ''}/${variant.size || ''}) to "${product.name}"`
  });

  res.status(201).json(variant);
});

const updateVariant = asyncHandler(async (req, res) => {
  const variant = await Variant.findByIdAndUpdate(
    req.params.id, req.body,
    { new: true, runValidators: true }
  ).populate('product', 'name');

  if (!variant) return res.status(404).json({ message: 'Variant not found' });

  await log({
    user:        req.user,
    action:      'VARIANT_UPDATE',
    entity:      'Variant',
    entityId:    variant._id,
    description: `Updated variant ${variant.sku}`
  });

  res.json(variant);
});

const deleteVariant = asyncHandler(async (req, res) => {
  const variant = await Variant.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!variant) return res.status(404).json({ message: 'Variant not found' });

  await log({
    user:        req.user,
    action:      'VARIANT_DELETE',
    entity:      'Variant',
    entityId:    variant._id,
    description: `Deleted variant ${variant.sku}`
  });

  res.json({ message: 'Variant deleted' });
});

const adjustStock = asyncHandler(async (req, res) => {
  const { adjustment, reason } = req.body;
  const adj = Number(adjustment);

  if (isNaN(adj)) return res.status(400).json({ message: 'adjustment must be a number' });

  const variant = await Variant.findById(req.params.id).populate('product', 'name');
  if (!variant) return res.status(404).json({ message: 'Variant not found' });

  const oldQty = variant.quantity;
  const newQty = Math.max(0, oldQty + adj);
  variant.quantity = newQty;
  await variant.save();

  await log({
    user:        req.user,
    action:      'STOCK_ADJUST',
    entity:      'Variant',
    entityId:    variant._id,
    description: `Stock adjusted for ${variant.sku} (${variant.product?.name}): ${oldQty} → ${newQty}. Reason: ${reason || 'N/A'}`,
    meta:        { oldQty, newQty, adjustment: adj, reason }
  });

  res.json(variant);
});

module.exports = { getVariants, createVariant, updateVariant, deleteVariant, adjustStock };

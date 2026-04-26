const Product      = require('../models/Product');
const Variant      = require('../models/Variant');
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

const getProducts = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 20 } = req.query;
  const query = { isActive: true };

  if (search)   query.$or = [
    { name:     { $regex: search, $options: 'i' } },
    { category: { $regex: search, $options: 'i' } }
  ];
  if (category) query.category = category;

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(query).populate('supplier', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(query)
  ]);

  const withVariants = await Promise.all(products.map(async (product) => {
    const variants   = await Variant.find({ product: product._id, isActive: true });
    const totalQty   = variants.reduce((sum, v) => sum + v.quantity, 0);
    const hasLowStock = variants.some((v) => v.isLowStock);
    return { ...product.toJSON(), variants, totalQty, hasLowStock };
  }));

  res.json({ products: withVariants, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

const getCategories = asyncHandler(async (req, res) => {
  const cats = await Product.distinct('category', { isActive: true });
  res.json(cats);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('supplier', 'name email phone');
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const variants = await Variant.find({ product: product._id, isActive: true });
  res.json({ ...product.toJSON(), variants });
});

const createProduct = asyncHandler(async (req, res) => {
  const { variants: variantData, ...productData } = req.body;
  const product = await Product.create(productData);

  let variants = [];
  if (Array.isArray(variantData) && variantData.length) {
    const docs = variantData.map((v) => ({
      ...v,
      product: product._id,
      sku: v.sku || genSKU(product.name, v.color, v.size)
    }));
    variants = await Variant.insertMany(docs);
  }

  await log({
    user:        req.user,
    action:      'PRODUCT_CREATE',
    entity:      'Product',
    entityId:    product._id,
    description: `Created product "${product.name}" with ${variants.length} variant(s)`
  });

  res.status(201).json({ ...product.toJSON(), variants });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { variants: variantData, ...productData } = req.body;

  const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  let updatedVariantIds = [];
  if (Array.isArray(variantData)) {
    for (const v of variantData) {
      if (v._id) {
        await Variant.findByIdAndUpdate(v._id, { ...v, isActive: true });
        updatedVariantIds.push(v._id.toString());
      } else {
        const sku = v.sku || genSKU(product.name, v.color, v.size);
        const newVar = await Variant.create({ ...v, product: product._id, sku });
        updatedVariantIds.push(newVar._id.toString());
      }
    }

const existingVariants = await Variant.find({ product: product._id, isActive: true });
    for (const ex of existingVariants) {
      if (!updatedVariantIds.includes(ex._id.toString())) {
        await Variant.findByIdAndUpdate(ex._id, { isActive: false });
      }
    }
  }

  await log({
    user:        req.user,
    action:      'PRODUCT_UPDATE',
    entity:      'Product',
    entityId:    product._id,
    description: `Updated product "${product.name}"`
  });

  const finalVariants = await Variant.find({ product: product._id, isActive: true });
  res.json({ ...product.toJSON(), variants: finalVariants });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  await Variant.updateMany({ product: req.params.id }, { isActive: false });

  await log({
    user:        req.user,
    action:      'PRODUCT_DELETE',
    entity:      'Product',
    entityId:    product._id,
    description: `Deleted product "${product.name}"`
  });

  res.json({ message: 'Product deleted' });
});

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories };

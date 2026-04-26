const Sale         = require('../models/Sale');
const Purchase     = require('../models/Purchase');
const Variant      = require('../models/Variant');
const asyncHandler = require('../utils/asyncHandler');

const buildDateFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return {};
  const f = { createdAt: {} };
  if (startDate) f.createdAt.$gte = new Date(startDate);
  if (endDate)   f.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  return f;
};

const salesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = buildDateFilter(startDate, endDate);

  const sales = await Sale.find({ ...filter, status: 'completed' })
    .populate('items.product', 'name category')
    .populate('items.variant', 'sku color size');

  const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);

  const variantSales = {};
  sales.forEach((sale) => sale.items.forEach((item) => {
    const key = item.variant?._id?.toString();
    if (!key) return;
    if (!variantSales[key]) {
      variantSales[key] = {
        name:     item.product?.name,
        sku:      item.variant.sku,
        color:    item.variant.color,
        size:     item.variant.size,
        quantity: 0,
        revenue:  0
      };
    }
    variantSales[key].quantity += item.quantity;
    variantSales[key].revenue  += item.total;
  }));

  const dailySales = {};
  sales.forEach((s) => {
    const date = s.createdAt.toISOString().split('T')[0];
    if (!dailySales[date]) dailySales[date] = { date, total: 0, count: 0 };
    dailySales[date].total += s.totalAmount;
    dailySales[date].count++;
  });

  res.json({
    totalRevenue,
    totalTransactions: sales.length,
    topVariants: Object.values(variantSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    dailySales:  Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date))
  });
});

const purchasesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = buildDateFilter(startDate, endDate);

  const purchases = await Purchase.find({ ...filter, status: 'received' })
    .populate('supplier', 'name');

  const totalSpent = purchases.reduce((s, p) => s + p.totalAmount, 0);

  const bySupplier = {};
  purchases.forEach((p) => {
    const key = p.supplier?._id?.toString();
    if (!key) return;
    if (!bySupplier[key]) bySupplier[key] = { name: p.supplier.name, total: 0, count: 0 };
    bySupplier[key].total += p.totalAmount;
    bySupplier[key].count++;
  });

  res.json({
    totalSpent,
    totalOrders: purchases.length,
    bySupplier:  Object.values(bySupplier).sort((a, b) => b.total - a.total)
  });
});

const stockReport = asyncHandler(async (req, res) => {
  const variants = await Variant.find({ isActive: true })
    .populate('product', 'name category basePrice');

  const lowStock   = variants.filter((v) => v.quantity <= v.lowStockThreshold);
  const outOfStock = variants.filter((v) => v.quantity === 0);
  const totalValue = variants.reduce(
    (s, v) => s + ((v.price ?? v.product?.basePrice ?? 0) * v.quantity), 0
  );

  const byCategory = {};
  variants.forEach((v) => {
    const cat = v.product?.category || 'Unknown';
    if (!byCategory[cat]) byCategory[cat] = { category: cat, count: 0, value: 0 };
    byCategory[cat].count++;
    byCategory[cat].value += (v.price ?? v.product?.basePrice ?? 0) * v.quantity;
  });

  res.json({
    totalVariants:    variants.length,
    totalStockValue:  totalValue,
    lowStockCount:    lowStock.length,
    outOfStockCount:  outOfStock.length,
    lowStockVariants: lowStock,
    outOfStockVariants: outOfStock,
    byCategory:       Object.values(byCategory)
  });
});

module.exports = { salesReport, purchasesReport, stockReport };

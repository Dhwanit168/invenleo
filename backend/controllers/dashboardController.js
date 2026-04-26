const Sale         = require('../models/Sale');
const Purchase     = require('../models/Purchase');
const Product      = require('../models/Product');
const Variant      = require('../models/Variant');
const Supplier     = require('../models/Supplier');
const asyncHandler = require('../utils/asyncHandler');

const getDashboardStats = asyncHandler(async (req, res) => {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000; // UTC+5:30
  const nowIST = new Date(Date.now() + IST_OFFSET);
  const startOfDayIST = new Date(nowIST);
  startOfDayIST.setUTCHours(0, 0, 0, 0);
  const since = new Date(startOfDayIST.getTime() - IST_OFFSET);

  const startOfMonth = new Date(nowIST.getFullYear(), nowIST.getMonth(), 1);

  const [totalProducts, totalSuppliers, lowStockVariants, outOfStockVariants] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Supplier.countDocuments({ isActive: true }),
    Variant.countDocuments({ isActive: true, $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }),
    Variant.countDocuments({ isActive: true, quantity: 0 })
  ]);

  const [monthSales, todaySales] = await Promise.all([
    Sale.find({ status: 'completed', createdAt: { $gte: startOfMonth } }).populate('items.variant', 'costPrice'),
    Sale.find({ status: 'completed', createdAt: { $gte: since } }).populate('items.variant', 'costPrice')
  ]);

  const calcProfit = (sales) => sales.reduce((totalProfit, sale) => {
    const saleProfit = sale.items.reduce((p, item) => {
      const cost = (item.variant?.costPrice || 0) * item.quantity;
      return p + (item.total - cost);
    }, 0);
    return totalProfit + saleProfit;
  }, 0);

  const monthlyRevenue   = monthSales.reduce((s, x) => s + x.totalAmount, 0);
  const monthlyProfit    = calcProfit(monthSales);
  const todayRevenue     = todaySales.reduce((s, x) => s + x.totalAmount, 0);
  const todayProfit      = calcProfit(todaySales);
  const todayTransactions = todaySales.length;

  const [recentSales, recentPurchases, lowStockItems] = await Promise.all([
    Sale.find({ status: 'completed' })
      .populate('items.product', 'name')
      .populate('items.variant', 'color size sku')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(5),
    Purchase.find()
      .populate('supplier', 'name')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(5),
    Variant.find({ isActive: true, $expr: { $lte: ['$quantity', '$lowStockThreshold'] } })
      .populate('product', 'name')
      .select('sku color size quantity lowStockThreshold product')
      .limit(12)
  ]);

const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const monthlyChart = await Promise.all(last6Months.map(async ({ year, month }) => {
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 0, 23, 59, 59);
    const [sales] = await Promise.all([
      Sale.find({ status: 'completed', createdAt: { $gte: start, $lte: end } }).populate('items.variant', 'costPrice'),
    ]);
    const revenue = sales.reduce((s, x) => s + x.totalAmount, 0);
    const cost    = sales.reduce((totalCost, sale) => {
      return totalCost + sale.items.reduce((p, item) => p + (item.variant?.costPrice || 0) * item.quantity, 0);
    }, 0);
    const profit  = revenue - cost;
    return {
      month:   start.toLocaleString('default', { month: 'short' }),
      revenue,
      cost,
      profit,
      count:   sales.length
    };
  }));

  res.json({
    stats: {
      totalProducts,
      totalSuppliers,
      lowStockVariants,
      outOfStockVariants,
      monthlyRevenue,
      monthlyProfit,
      todayRevenue,
      todayProfit,
      todayTransactions
    },
    recentSales,
    recentPurchases,
    lowStockItems,
    monthlyChart
  });
});

module.exports = { getDashboardStats };

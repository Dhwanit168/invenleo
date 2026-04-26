const Sale         = require('../models/Sale');
const Variant      = require('../models/Variant');
const Product      = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

const lastNMonths = (n) => {
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return months;
};

const movingAverage = (values, window) => {
  if (values.length === 0) return 0;
  const slice = values.slice(-window);
  return slice.reduce((s, v) => s + v, 0) / slice.length;
};

const weightedMovingAverage = (values, window) => {
  if (values.length === 0) return 0;
  const slice = values.slice(-window);
  let weightSum = 0, valueSum = 0;
  slice.forEach((v, i) => {
    const w = i + 1;
    weightSum += w;
    valueSum  += v * w;
  });
  return weightSum === 0 ? 0 : valueSum / weightSum;
};

const monthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleString('default', { month: 'short', year: 'numeric' });

const getOverviewForecast = asyncHandler(async (req, res) => {
  const months = lastNMonths(6);

const monthData = await Promise.all(months.map(async ({ year, month }) => {
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 0, 23, 59, 59);
    const sales = await Sale.find({ status: 'completed', createdAt: { $gte: start, $lte: end } });

    const revenue = sales.reduce((s, x) => s + x.totalAmount, 0);
    const units   = sales.reduce((s, x) => s + x.items.reduce((ss, it) => ss + it.quantity, 0), 0);

    return { label: monthLabel(year, month), revenue, units, year, month };
  }));

const revenueHistory = monthData.map(m => m.revenue);
  const unitsHistory   = monthData.map(m => m.units);
  const forecast = [];

  for (let i = 1; i <= 3; i++) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    const yr = d.getFullYear(), mo = d.getMonth();

    const forecastRevenue = weightedMovingAverage(revenueHistory, 3);
    const forecastUnits   = weightedMovingAverage(unitsHistory, 3);

    forecast.push({
      label:   monthLabel(yr, mo),
      revenue: Math.round(forecastRevenue),
      units:   Math.round(forecastUnits),
      isForecast: true
    });

    revenueHistory.push(forecastRevenue);
    unitsHistory.push(forecastUnits);
  }

  res.json({
    history:  monthData.map(m => ({ label: m.label, revenue: m.revenue, units: m.units })),
    forecast,
    combined: [
      ...monthData.map(m => ({ label: m.label, revenue: m.revenue, units: m.units, isForecast: false })),
      ...forecast
    ]
  });
});

const getProductForecast = asyncHandler(async (req, res) => {
  const months = lastNMonths(3);

const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const sales = await Sale.find({
    status: 'completed',
    createdAt: { $gte: threeMonthsAgo }
  }).populate('items.product', 'name category').populate('items.variant', 'sku');

const productMap = {};

  sales.forEach(sale => {
    const saleMonth = sale.createdAt.getMonth();
    const saleYear  = sale.createdAt.getFullYear();
    const monthKey  = `${saleYear}-${saleMonth}`;

    sale.items.forEach(item => {
      const pid = item.product?._id?.toString();
      if (!pid) return;

      if (!productMap[pid]) {
        productMap[pid] = {
          productId:   pid,
          name:        item.product.name,
          category:    item.product.category,
          monthlyQty:  {},
        };
      }
      productMap[pid].monthlyQty[monthKey] =
        (productMap[pid].monthlyQty[monthKey] || 0) + item.quantity;
    });
  });

const productIds = Object.keys(productMap);
  const variants   = await Variant.find({
    product: { $in: productIds },
    isActive: true
  });

const stockByProduct = {};
  variants.forEach(v => {
    const pid = v.product.toString();
    stockByProduct[pid] = (stockByProduct[pid] || 0) + v.quantity;
  });

const results = productIds.map(pid => {
    const p = productMap[pid];

const monthlyValues = months.map(({ year, month }) =>
      p.monthlyQty[`${year}-${month}`] || 0
    );

    const avgMonthly   = movingAverage(monthlyValues, 3);
    const wmaMonthly   = weightedMovingAverage(monthlyValues, 3);
    const forecast30   = Math.round(wmaMonthly);         // next 30 days ≈ 1 month
    const avgDaily     = avgMonthly / 30;
    const currentStock = stockByProduct[pid] || 0;
    const daysLeft     = avgDaily > 0 ? Math.floor(currentStock / avgDaily) : null;
    const totalSold    = monthlyValues.reduce((s, v) => s + v, 0);

let urgency = 'ok';
    if (daysLeft !== null) {
      if (daysLeft <= 7)  urgency = 'critical';
      else if (daysLeft <= 30) urgency = 'warning';
    }

    return {
      productId:    pid,
      name:         p.name,
      category:     p.category,
      monthlyValues,
      monthLabels:  months.map(({ year, month }) => monthLabel(year, month)),
      totalSold,
      avgMonthly:   Math.round(avgMonthly),
      forecast30,
      currentStock,
      daysLeft,
      urgency,
    };
  });

results.sort((a, b) => b.totalSold - a.totalSold);

  res.json({
    products: results.slice(0, 20),
    generatedAt: new Date()
  });
});

const getCategoryForecast = asyncHandler(async (req, res) => {
  const months = lastNMonths(6);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 6);

  const sales = await Sale.find({
    status: 'completed',
    createdAt: { $gte: threeMonthsAgo }
  }).populate('items.product', 'category');

const catMap = {};

  sales.forEach(sale => {
    const mo = sale.createdAt.getMonth();
    const yr = sale.createdAt.getFullYear();
    const mk = `${yr}-${mo}`;

    sale.items.forEach(item => {
      const cat = item.product?.category || 'Unknown';
      if (!catMap[cat]) catMap[cat] = {};
      catMap[cat][mk] = (catMap[cat][mk] || 0) + item.quantity;
    });
  });

  const categories = Object.entries(catMap).map(([category, monthlyQty]) => {
    const history = months.map(({ year, month }) => ({
      label: monthLabel(year, month),
      units: monthlyQty[`${year}-${month}`] || 0
    }));

    const histValues = history.map(h => h.units);

const forecastArr = [];
    const rolling = [...histValues];
    for (let i = 1; i <= 3; i++) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + i);
      const predicted = Math.round(weightedMovingAverage(rolling, 3));
      forecastArr.push({ label: monthLabel(d.getFullYear(), d.getMonth()), units: predicted, isForecast: true });
      rolling.push(predicted);
    }

    return { category, history, forecast: forecastArr };
  });

categories.sort((a, b) => {
    const aTotal = a.history.reduce((s, h) => s + h.units, 0);
    const bTotal = b.history.reduce((s, h) => s + h.units, 0);
    return bTotal - aTotal;
  });

  res.json({ categories });
});

module.exports = { getOverviewForecast, getProductForecast, getCategoryForecast };

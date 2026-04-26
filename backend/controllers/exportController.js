const XLSX         = require('xlsx');
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

const todayStr = () => new Date().toISOString().split('T')[0];

const sendWorkbook = (res, wb, filename) => {
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Length', buf.length);
  res.send(buf);
};

const styleHeader = (ws, cols) => {

  ws['!cols'] = cols.map(w => ({ wch: w }));
};

const exportSales = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = buildDateFilter(startDate, endDate);
  const isFiltered = !!(startDate || endDate);

  const sales = await Sale.find({ ...filter, status: 'completed' })
    .populate('items.product', 'name category')
    .populate('items.variant', 'sku color size')
    .sort({ createdAt: -1 });

const rows = [];
  sales.forEach(sale => {
    sale.items.forEach(item => {
      rows.push({
        Date:     sale.createdAt.toISOString().split('T')[0],
        'Sale #': sale.saleNumber || '',
        Product:  item.product?.name || '—',
        SKU:      item.variant?.sku  || '—',
        Variant:  [item.variant?.color, item.variant?.size].filter(Boolean).join(' / ') || '—',
        Quantity: item.quantity,
        'Unit Price (₹)': item.unitPrice,
        'Revenue (₹)':    item.total,
        Customer: sale.customer || 'Walk-in Customer',
        Payment:  sale.paymentMethod || '—',
      });
    });
  });

const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const summary = [
    { Metric: 'Total Revenue (₹)',  Value: totalRevenue },
    { Metric: 'Total Transactions', Value: sales.length },
    { Metric: 'Avg Order Value (₹)', Value: sales.length ? (totalRevenue / sales.length).toFixed(2) : 0 },
    { Metric: 'Date Range', Value: startDate && endDate ? `${startDate} to ${endDate}` : 'All time' },
    { Metric: 'Exported On', Value: new Date().toLocaleString('en-IN') },
  ];

  const wb  = XLSX.utils.book_new();
  const ws  = XLSX.utils.json_to_sheet(rows);
  const wss = XLSX.utils.json_to_sheet(summary);

  styleHeader(ws,  [12, 14, 22, 14, 18, 10, 16, 14, 20, 14]);
  styleHeader(wss, [28, 28]);

  XLSX.utils.book_append_sheet(wb, ws,  'Sales Data');
  XLSX.utils.book_append_sheet(wb, wss, 'Summary');

  const filename = isFiltered
    ? `sales_report_filtered_${todayStr()}.xlsx`
    : `sales_report_${todayStr()}.xlsx`;

  sendWorkbook(res, wb, filename);
});

const exportPurchases = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = buildDateFilter(startDate, endDate);
  const isFiltered = !!(startDate || endDate);

  const purchases = await Purchase.find({ ...filter, status: 'received' })
    .populate('supplier', 'name')
    .populate('items.product', 'name category')
    .populate('items.variant', 'sku color size')
    .sort({ createdAt: -1 });

  const rows = [];
  purchases.forEach(purchase => {
    purchase.items.forEach(item => {
      rows.push({
        Date:         purchase.createdAt.toISOString().split('T')[0],
        'Purchase #': purchase.purchaseNumber || '',
        Supplier:     purchase.supplier?.name  || '—',
        Product:      item.product?.name       || '—',
        SKU:          item.variant?.sku        || '—',
        Variant:      [item.variant?.color, item.variant?.size].filter(Boolean).join(' / ') || '—',
        Quantity:     item.quantity,
        'Unit Cost (₹)': item.unitCost,
        'Total Cost (₹)': item.total,
        'Invoice #':  purchase.invoiceNumber  || '—',
      });
    });
  });

  const totalSpent = purchases.reduce((s, p) => s + p.totalAmount, 0);
  const summary = [
    { Metric: 'Total Spent (₹)',  Value: totalSpent },
    { Metric: 'Total Orders',     Value: purchases.length },
    { Metric: 'Avg Order (₹)',    Value: purchases.length ? (totalSpent / purchases.length).toFixed(2) : 0 },
    { Metric: 'Date Range', Value: startDate && endDate ? `${startDate} to ${endDate}` : 'All time' },
    { Metric: 'Exported On', Value: new Date().toLocaleString('en-IN') },
  ];

  const wb  = XLSX.utils.book_new();
  const ws  = XLSX.utils.json_to_sheet(rows);
  const wss = XLSX.utils.json_to_sheet(summary);

  styleHeader(ws,  [12, 14, 20, 22, 14, 18, 10, 16, 16, 14]);
  styleHeader(wss, [28, 28]);

  XLSX.utils.book_append_sheet(wb, ws,  'Purchases Data');
  XLSX.utils.book_append_sheet(wb, wss, 'Summary');

  const filename = isFiltered
    ? `purchases_report_filtered_${todayStr()}.xlsx`
    : `purchases_report_${todayStr()}.xlsx`;

  sendWorkbook(res, wb, filename);
});

const exportStock = asyncHandler(async (req, res) => {
  const variants = await Variant.find({ isActive: true })
    .populate('product', 'name category basePrice')
    .sort({ 'product.name': 1 });

  const rows = variants.map(v => {
    const price = v.price ?? v.product?.basePrice ?? 0;
    const stockValue = price * v.quantity;
    let status = 'In Stock';
    if (v.quantity === 0) status = 'Out of Stock';
    else if (v.quantity <= v.lowStockThreshold) status = 'Low Stock';

    return {
      Product:          v.product?.name    || '—',
      Category:         v.product?.category || '—',
      SKU:              v.sku,
      Color:            v.color || '—',
      Size:             v.size  || '—',
      Quantity:         v.quantity,
      'Low Stock Threshold': v.lowStockThreshold,
      'Unit Price (₹)': price,
      'Stock Value (₹)': stockValue,
      Status:           status,
    };
  });

  const totalValue   = variants.reduce((s, v) => s + ((v.price ?? v.product?.basePrice ?? 0) * v.quantity), 0);
  const lowCount     = variants.filter(v => v.quantity > 0 && v.quantity <= v.lowStockThreshold).length;
  const outCount     = variants.filter(v => v.quantity === 0).length;

  const summary = [
    { Metric: 'Total Variants',     Value: variants.length },
    { Metric: 'Total Stock Value (₹)', Value: totalValue.toFixed(2) },
    { Metric: 'Low Stock Items',    Value: lowCount },
    { Metric: 'Out of Stock Items', Value: outCount },
    { Metric: 'Exported On',        Value: new Date().toLocaleString('en-IN') },
  ];

  const wb  = XLSX.utils.book_new();
  const ws  = XLSX.utils.json_to_sheet(rows);
  const wss = XLSX.utils.json_to_sheet(summary);

  styleHeader(ws,  [22, 16, 14, 12, 10, 10, 20, 16, 16, 14]);
  styleHeader(wss, [28, 28]);

  XLSX.utils.book_append_sheet(wb, ws,  'Stock Data');
  XLSX.utils.book_append_sheet(wb, wss, 'Summary');

  const filename = `stock_report_${todayStr()}.xlsx`;
  sendWorkbook(res, wb, filename);
});

module.exports = { exportSales, exportPurchases, exportStock };

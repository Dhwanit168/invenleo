const Sale     = require('../models/Sale');
const Purchase = require('../models/Purchase');
const PDFDocument = require('pdfkit');
const asyncHandler = require('../utils/asyncHandler');

const fmt = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

const BRAND_PRIMARY = '#F97316'; // Matches UI Orange
const DARK   = '#111827';
const MUTED  = '#6B7280';
const LIGHT  = '#F9FAFB';
const LIGHT_BORDER = '#F3F4F6';
const WHITE  = '#FFFFFF';
const BORDER = '#E5E7EB';

function drawHeader(doc, title, number, date, meta = []) {
  const pageW  = doc.page.width;
  const margin = 50;

doc.rect(0, 0, pageW, 6).fill(BRAND_PRIMARY);

doc.fontSize(24).font('Helvetica-Bold').fillColor(BRAND_PRIMARY)
     .text('Leo Data Tech', margin, 35, { continued: false });

  doc.fontSize(10).font('Helvetica').fillColor(MUTED)
     .text('InvenLeo — Inventory Management System', margin, 62);

const badgeW = 180;
  const badgeX = pageW - margin - badgeW;

doc.roundedRect(badgeX, 35, badgeW, 26, 4).fill(LIGHT_BORDER);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(BRAND_PRIMARY)
     .text(title, badgeX, 42, { width: badgeW, align: 'center', characterSpacing: 1 });

let y = 85;
  doc.moveTo(margin, y).lineTo(pageW - margin, y).lineWidth(1).strokeColor(BORDER).stroke();
  y += 20;

doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK)
     .text('DOCUMENT NO.', margin, y);
  doc.fontSize(11).font('Helvetica').fillColor(DARK)
     .text(number, margin, y + 14);

  doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK)
     .text('DATE', margin + 180, y);
  doc.fontSize(11).font('Helvetica').fillColor(DARK)
     .text(date, margin + 180, y + 14);

if (meta.length) {
    let my = y;
    meta.forEach(({ label, value }) => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK)
         .text(label.toUpperCase(), badgeX, my, { width: badgeW, align: 'right' });
      doc.fontSize(11).font('Helvetica').fillColor(MUTED)
         .text(value || 'N/A', badgeX, my + 14, { width: badgeW, align: 'right' });
      my += 35;
    });
  }

  return y + 55;
}

function drawInfoRow(doc, leftBlock, rightBlock, startY) {
  const margin = 50;
  const colW   = 220;
  const rightX = doc.page.width - margin - colW;

  const drawBlock = (x, { heading, lines }) => {

    doc.fontSize(9).font('Helvetica-Bold').fillColor(BRAND_PRIMARY)
       .text(heading.toUpperCase(), x, startY, { width: colW, characterSpacing: 0.5 });
    
    doc.moveTo(x, startY + 12).lineTo(x + 40, startY + 12).lineWidth(2).strokeColor(BRAND_PRIMARY).stroke();
    
    let by = startY + 22;
    lines.forEach((line) => {
      if (!line) return;
      doc.fontSize(10).font('Helvetica').fillColor(DARK)
         .text(line, x, by, { width: colW, lineGap: 3 });
      by += 16;
    });
  };

  if (leftBlock)  drawBlock(margin, leftBlock);
  if (rightBlock) drawBlock(rightX, rightBlock);

  return startY + 100;
}

function drawTable(doc, cols, rows, startY) {
  const margin = 50;
  const pageW  = doc.page.width;
  const tableW = pageW - margin * 2;

doc.roundedRect(margin, startY, tableW, 28, 4).fill(BRAND_PRIMARY);
  let cx = margin + 12;
  cols.forEach(({ label, width, align }) => {
    doc.fontSize(9).font('Helvetica-Bold').fillColor(WHITE)
       .text(label.toUpperCase(), cx, startY + 10, { width: width - 12, align: align || 'left', characterSpacing: 0.5 });
    cx += width;
  });

  let y = startY + 32;
  let rowIdx = 0;

  rows.forEach((row) => {
    const rowH = 26;
    
    if (rowIdx % 2 === 0) {
      doc.rect(margin, y, tableW, rowH).fill(LIGHT);
    }
    cx = margin + 12;
    row.forEach((cell, ci) => {
      const { width, align } = cols[ci];
      let val = cell;
      if (val === undefined || val === null || val === '') val = '-';
      
      doc.fontSize(10).font('Helvetica').fillColor(DARK)
         .text(String(val), cx, y + 8, { 
           width: width - 12, 
           height: 12, // Force absolute strict height
           align: align || 'left',
           lineBreak: false, 
           ellipsis: true 
         });
      cx += width;
    });

doc.moveTo(margin, y + rowH).lineTo(pageW - margin, y + rowH)
       .lineWidth(0.5).strokeColor(BORDER).stroke();
       
    y += rowH;
    rowIdx++;
  });

  return y;
}

function drawTotals(doc, lines, startY) {
  const margin  = 50;
  const pageW   = doc.page.width;
  const labelW  = 140;
  const valueW  = 120;
  const labelX  = pageW - margin - labelW - valueW;
  const valueX  = pageW - margin - valueW;

  lines.forEach(({ label, value, bold, highlight }) => {
    if (highlight) {
      startY += 5; // Extra breathing room before total
      doc.roundedRect(labelX, startY - 6, labelW + valueW, 32, 4).fill(BRAND_PRIMARY);
      doc.fontSize(12).font('Helvetica-Bold').fillColor(WHITE)
         .text(label.toUpperCase(), labelX + 15, startY + 4, { width: labelW - 15, align: 'left', characterSpacing: 0.5 })
         .text(value, valueX, startY + 4, { width: valueW - 15, align: 'right' });
      startY += 36;
    } else {
      doc.fontSize(10)
         .font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor(bold ? DARK : MUTED)
         .text(label, labelX, startY + 2, { width: labelW, align: 'left' })
         .text(value, valueX, startY + 2, { width: valueW - 15, align: 'right' });

doc.moveTo(labelX, startY + 18).lineTo(pageW - margin, startY + 18).lineWidth(0.5).strokeColor(LIGHT_BORDER).stroke();
      startY += 24;
    }
  });

  return startY;
}

function drawFooter(doc, docNum) {
  const pageW  = doc.page.width;
  const margin = 50;
  const fy     = doc.page.height - 35; // Moved down slightly

  doc.moveTo(margin, fy - 15).lineTo(pageW - margin, fy - 15)
     .lineWidth(1).strokeColor(BRAND_PRIMARY).stroke();

  doc.fontSize(9).font('Helvetica').fillColor(MUTED)
     .text('Generated via InvenLeo.', margin, fy, { width: pageW - margin * 2, align: 'left' })
     .text(docNum, margin, fy, { width: pageW - margin * 2, align: 'right' });
}

const generateSaleInvoice = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (req.user.role === 'staff') query.createdBy = req.user._id;

  const sale = await Sale.findOne(query)
    .populate('items.variant', 'sku color size')
    .populate('items.product', 'name category')
    .populate('createdBy', 'username');

  if (!sale) return res.status(404).json({ message: 'Sale not found' });

  const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoice-${sale.saleNumber}.pdf"`
  );
  doc.pipe(res);

  let y = drawHeader(
    doc,
    'SALES INVOICE',
    sale.saleNumber,
    fmtDate(sale.createdAt),
    [{ label: 'Payment', value: (sale.paymentMethod || 'cash').replace('_', ' ').toUpperCase() }]
  );

  y = drawInfoRow(
    doc,
    {
      heading: 'Bill To',
      lines: [
        sale.customer || 'Walk-in Customer',
        '',
        `Status: ${sale.status.toUpperCase()}`
      ]
    },
    {
      heading: 'Recorded By',
      lines: [
        sale.createdBy?.username || 'System',
        `Ref: ${sale.saleNumber}`
      ]
    },
    y
  );

  const cols = [
    { label: '#',          width: 30  },
    { label: 'Product',    width: 130 },
    { label: 'SKU',        width: 70  },
    { label: 'Variant',    width: 75  },
    { label: 'Qty',        width: 40, align: 'right' },
    { label: 'Unit Price', width: 75, align: 'right' },
    { label: 'Total',      width: 75, align: 'right' },
  ];

  const rows = sale.items.map((item, i) => [
    i + 1,
    item.product?.name || '—',
    item.variant?.sku || '—',
    [item.variant?.color, item.variant?.size].filter(Boolean).join(' / ') || '—',
    item.quantity,
    fmt(item.unitPrice),
    fmt(item.total),
  ]);

  y = drawTable(doc, cols, rows, y);
  y += 24; // Extra space before totals

y = drawTotals(doc, [
    { label: 'Total Amount', value: fmt(sale.totalAmount), highlight: true },
  ], y);

  if (sale.notes) {
    y += 20;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(BRAND_PRIMARY)
       .text('NOTES', 50, y, { characterSpacing: 0.5 });
    doc.fontSize(10).font('Helvetica').fillColor(DARK)
       .text(sale.notes, 50, y + 16, { width: 400 });
  }

  drawFooter(doc, sale.saleNumber);
  doc.end();
});

const generatePurchaseInvoice = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id)
    .populate('supplier', 'name email phone address contactPerson')
    .populate('items.variant', 'sku color size')
    .populate('items.product', 'name category')
    .populate('createdBy', 'username');

  if (!purchase) return res.status(404).json({ message: 'Purchase not found' });

  const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="po-${purchase.purchaseNumber}.pdf"`
  );
  doc.pipe(res);

  let y = drawHeader(
    doc,
    'PURCHASE ORDER',
    purchase.purchaseNumber,
    fmtDate(purchase.createdAt),
    [{ label: 'Status', value: purchase.status.toUpperCase() }]
  );

  const sup  = purchase.supplier;
  const addr = sup?.address
    ? [sup.address.street, sup.address.city, sup.address.state, sup.address.country]
        .filter(Boolean).join(', ')
    : null;

  y = drawInfoRow(
    doc,
    {
      heading: 'Supplier',
      lines: [
        sup?.name || '—',
        sup?.contactPerson || '',
        sup?.phone || '',
        sup?.email || '',
        addr || '',
      ]
    },
    {
      heading: 'Order Details',
      lines: [
        `PO No: ${purchase.purchaseNumber}`,
        purchase.invoiceNumber ? `Inv No: ${purchase.invoiceNumber}` : '',
        `Created by: ${purchase.createdBy?.username || 'System'}`,
      ]
    },
    y
  );

  const cols = [
    { label: '#',         width: 30  },
    { label: 'Product',   width: 130 },
    { label: 'SKU',       width: 70  },
    { label: 'Variant',   width: 75  },
    { label: 'Qty',       width: 40, align: 'right' },
    { label: 'Unit Cost', width: 75, align: 'right' },
    { label: 'Total',     width: 75, align: 'right' },
  ];

  const rows = purchase.items.map((item, i) => [
    i + 1,
    item.product?.name || '—',
    item.variant?.sku || '—',
    [item.variant?.color, item.variant?.size].filter(Boolean).join(' / ') || '—',
    item.quantity,
    fmt(item.unitCost),
    fmt(item.total),
  ]);

  y = drawTable(doc, cols, rows, y);
  y += 24; // Extra space before totals

  y = drawTotals(doc, [
    { label: 'Total PO Amount',   value: fmt(purchase.totalAmount), highlight: true },
  ], y);

  if (purchase.notes) {
    y += 20;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(BRAND_PRIMARY)
       .text('NOTES', 50, y, { characterSpacing: 0.5 });
    doc.fontSize(10).font('Helvetica').fillColor(DARK)
       .text(purchase.notes, 50, y + 16, { width: 400 });
  }

  drawFooter(doc, purchase.purchaseNumber);
  doc.end();
});

module.exports = { generateSaleInvoice, generatePurchaseInvoice };

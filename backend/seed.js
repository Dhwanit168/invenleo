require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Product = require('./models/Product');
const Variant = require('./models/Variant');
const Supplier = require('./models/Supplier');
const Sale = require('./models/Sale');
const Purchase = require('./models/Purchase');
const Counter = require('./models/Counter');

const genSKU = (name, color, size) => {
  const b = name.replace(/\s+/g, '-').toUpperCase().slice(0, 6);
  const c = (color || 'X').toUpperCase().slice(0, 3);
  const s = (size || 'X').toUpperCase().slice(0, 3);
  const r = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${b}-${c}-${s}-${r}`;
};

// Returns a date N days ago, at a random time during that day
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 10) + 8); // 8am–6pm
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
};

// Today at a random time (for dashboard to show today's revenue)
const todayAt = () => {
  const d = new Date();
  d.setUTCHours(4, Math.floor(Math.random() * 60), 0, 0); // 4am UTC = 9:30am IST
  return d;
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── Users ──────────────────────────────────────────────
  const userDefs = [
    { username: 'admin', email: 'admin@invenleo.com', password: 'Admin@123', role: 'admin' },
    { username: 'manager', email: 'manager@invenleo.com', password: 'Manager@123', role: 'manager' },
    { username: 'staff1', email: 'staff1@invenleo.com', password: 'Staff@123', role: 'staff' },
    { username: 'staff2', email: 'staff2@invenleo.com', password: 'Staff@123', role: 'staff' },
  ];

  const users = [];
  for (const def of userDefs) {
    const existing = await User.findOne({ email: def.email });
    if (existing) {
      console.log(`👤 Skipping user ${def.email} — already exists`);
      users.push(existing);
    } else {
      const u = await User.create(def);
      console.log(`👤 Created user ${def.email}`);
      users.push(u);
    }
  }

  // ── Suppliers ──────────────────────────────────────────
  const supplierDefs = [
    {
      name: 'TechDistrib India', email: 'sales@techdistrib.in', phone: '+91 98765 43210',
      contactPerson: 'Rajesh Kumar',
      address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' }
    },
    {
      name: 'FashionWholesale Co', email: 'orders@fashionwh.com', phone: '+91 87654 32109',
      contactPerson: 'Priya Sharma',
      address: { city: 'Delhi', state: 'Delhi', country: 'India' }
    },
    {
      name: 'QuickParts Ltd.', email: 'info@quickparts.in', phone: '+91 76543 21098',
      contactPerson: 'Amit Patel',
      address: { city: 'Ahmedabad', state: 'Gujarat', country: 'India' }
    },
  ];

  const suppliers = [];
  for (const def of supplierDefs) {
    const existing = await Supplier.findOne({ email: def.email });
    if (existing) {
      console.log(`🏭 Skipping supplier ${def.name} — already exists`);
      suppliers.push(existing);
    } else {
      const s = await Supplier.create(def);
      console.log(`🏭 Created supplier ${def.name}`);
      suppliers.push(s);
    }
  }

  // ── Products & Variants ────────────────────────────────
  const productDefs = [
    {
      p: { name: 'Classic T-Shirt', category: 'Apparel', basePrice: 699, baseCostPrice: 350, supplier: suppliers[1]._id },
      v: [
        { color: 'Blue', size: 'S', quantity: 30, price: 699, lowStockThreshold: 10 },
        { color: 'Blue', size: 'M', quantity: 45, price: 699, lowStockThreshold: 10 },
        { color: 'Blue', size: 'L', quantity: 20, price: 699, lowStockThreshold: 10 },
        { color: 'Red', size: 'S', quantity: 15, price: 749, lowStockThreshold: 8 },
        { color: 'Red', size: 'M', quantity: 7, price: 749, lowStockThreshold: 8 },
        { color: 'Black', size: 'L', quantity: 5, price: 699, lowStockThreshold: 8 },
      ]
    },
    {
      p: { name: 'Denim Jeans', category: 'Apparel', basePrice: 1499, baseCostPrice: 900, supplier: suppliers[1]._id },
      v: [
        { color: 'Blue', size: '30', quantity: 20, price: 1499, lowStockThreshold: 5 },
        { color: 'Blue', size: '32', quantity: 18, price: 1499, lowStockThreshold: 5 },
        { color: 'Black', size: '30', quantity: 3, price: 1599, lowStockThreshold: 5 },
        { color: 'Black', size: '32', quantity: 12, price: 1599, lowStockThreshold: 5 },
      ]
    },
    {
      p: { name: 'Wireless Earbuds', category: 'Electronics', basePrice: 2499, baseCostPrice: 1200, supplier: suppliers[0]._id },
      v: [
        { color: 'White', size: 'One Size', quantity: 25, price: 2499, lowStockThreshold: 5 },
        { color: 'Black', size: 'One Size', quantity: 18, price: 2499, lowStockThreshold: 5 },
        { color: 'Blue', size: 'One Size', quantity: 4, price: 2699, lowStockThreshold: 5 },
      ]
    },
    {
      p: { name: 'Mechanical Keyboard', category: 'Electronics', basePrice: 3999, baseCostPrice: 2200, supplier: suppliers[0]._id },
      v: [
        { color: 'Black', size: 'TKL', quantity: 12, price: 3999, lowStockThreshold: 3 },
        { color: 'White', size: 'Full', quantity: 8, price: 4499, lowStockThreshold: 3 },
        { color: 'Gray', size: 'TKL', quantity: 0, price: 3999, lowStockThreshold: 3 },
      ]
    },
    {
      p: { name: 'Running Shoes', category: 'Footwear', basePrice: 2999, baseCostPrice: 1500, supplier: suppliers[2]._id },
      v: [
        { color: 'Black', size: '7', quantity: 10, price: 2999, lowStockThreshold: 3 },
        { color: 'Black', size: '8', quantity: 14, price: 2999, lowStockThreshold: 3 },
        { color: 'Black', size: '9', quantity: 9, price: 2999, lowStockThreshold: 3 },
        { color: 'White', size: '8', quantity: 6, price: 3199, lowStockThreshold: 3 },
        { color: 'White', size: '10', quantity: 2, price: 3199, lowStockThreshold: 3 },
      ]
    },
    {
      p: { name: 'USB-C Hub 7-Port', category: 'Electronics', basePrice: 1299, baseCostPrice: 650, supplier: suppliers[0]._id },
      v: [
        { color: 'Silver', size: 'One Size', quantity: 8, price: 1299, lowStockThreshold: 5 },
        { color: 'Black', size: 'One Size', quantity: 22, price: 1299, lowStockThreshold: 5 },
      ]
    },
  ];

  let allVariants = [];
  for (const { p, v } of productDefs) {
    const existing = await Product.findOne({ name: p.name });
    if (existing) {
      console.log(`📦 Skipping product ${p.name} — already exists`);
      const existingVariants = await Variant.find({ product: existing._id });
      allVariants = allVariants.concat(existingVariants);
    } else {
      const product = await Product.create(p);
      const varDocs = v.map((vd) => ({
        ...vd,
        product: product._id,
        sku: genSKU(product.name, vd.color, vd.size),
        costPrice: Math.round(p.baseCostPrice * (0.9 + Math.random() * 0.2))
      }));
      const variants = await Variant.insertMany(varDocs);
      allVariants = allVariants.concat(variants);
      console.log(`📦 Created product ${p.name} with ${variants.length} variants`);
    }
  }

  // ── Sales ──────────────────────────────────────────────
  // Check if sales already exist — if yes, skip entirely
  const existingSalesCount = await Sale.countDocuments();
  if (existingSalesCount > 0) {
    console.log(`🛒 Skipping sales — ${existingSalesCount} already exist`);
  } else {
    const staffUsers = users.filter((u) => u.role === 'staff');
    const sampleSales = [];
    const customers = ['Rahul S.', 'Priya M.', 'Amit K.', 'Sneha P.', 'Walk-in Customer'];
    const methods = ['cash', 'card', 'bank_transfer'];

    // Past 60 days of sales
    for (let i = 0; i < 80; i++) {
      const variant = allVariants[Math.floor(Math.random() * allVariants.length)];
      const qty = Math.floor(Math.random() * 5) + 1;
      const unitPrice = variant.price || 999;
      const seq = await Counter.nextSeq('sale');
      const saleNumber = `SALE-${String(seq).padStart(5, '0')}`;

      sampleSales.push({
        saleNumber,
        items: [{ variant: variant._id, product: variant.product, quantity: qty, unitPrice, total: unitPrice * qty }],
        totalAmount: unitPrice * qty,
        customer: customers[i % customers.length],
        paymentMethod: methods[i % methods.length],
        status: 'completed',
        createdBy: staffUsers[i % staffUsers.length]._id,
        createdAt: daysAgo(Math.floor(Math.random() * 60) + 1)
      });
    }

    // Today's sales — so dashboard revenue is not 0
    for (let i = 0; i < 8; i++) {
      const variant = allVariants[Math.floor(Math.random() * allVariants.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const unitPrice = variant.price || 999;
      const seq = await Counter.nextSeq('sale');
      const saleNumber = `SALE-${String(seq).padStart(5, '0')}`;

      sampleSales.push({
        saleNumber,
        items: [{ variant: variant._id, product: variant.product, quantity: qty, unitPrice, total: unitPrice * qty }],
        totalAmount: unitPrice * qty,
        customer: customers[i % customers.length],
        paymentMethod: methods[i % methods.length],
        status: 'completed',
        createdBy: staffUsers[i % staffUsers.length]._id,
        createdAt: todayAt()
      });
    }

    await Sale.insertMany(sampleSales);
    console.log(`🛒 ${sampleSales.length} sales created (includes 8 for today)`);
  }

  // ── Purchases ──────────────────────────────────────────
  const existingPurchasesCount = await Purchase.countDocuments();
  if (existingPurchasesCount > 0) {
    console.log(`📥 Skipping purchases — ${existingPurchasesCount} already exist`);
  } else {
    const samplePurchases = [];

    for (let i = 0; i < 50; i++) {
      const variant = allVariants[Math.floor(Math.random() * allVariants.length)];
      const qty = Math.floor(Math.random() * 5) + 2;
      const unitCost = variant.costPrice || 500;
      const seq = await Counter.nextSeq('purchase');
      const poNumber = `PO-${String(seq).padStart(5, '0')}`;

      samplePurchases.push({
        purchaseNumber: poNumber,
        supplier: suppliers[i % suppliers.length]._id,
        items: [{ variant: variant._id, product: variant.product, quantity: qty, unitCost, total: unitCost * qty }],
        totalAmount: unitCost * qty,
        status: 'received',
        createdBy: users[0]._id,
        createdAt: daysAgo(Math.floor(Math.random() * 30))
      });
    }

    await Purchase.insertMany(samplePurchases);
    console.log(`📥 ${samplePurchases.length} purchases created`);
  }

  // ── Force some low-stock variants for alerts ───────────
  if (allVariants.length >= 3) {
    await Variant.findByIdAndUpdate(allVariants[0]._id, { quantity: 0 });
    await Variant.findByIdAndUpdate(allVariants[1]._id, { quantity: 1 });
    await Variant.findByIdAndUpdate(allVariants[2]._id, { quantity: 2 });
    console.log(`⚠️  Forced 3 variants into low/out-of-stock for alerts`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('  Login credentials:');
  console.log('  admin@invenleo.com    / Admin@123');
  console.log('  manager@invenleo.com  / Manager@123');
  console.log('  staff1@invenleo.com   / Staff@123');
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
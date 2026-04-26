const mongoose = require('mongoose');
const Counter  = require('./Counter');

const purchaseItemSchema = new mongoose.Schema({
  variant:  { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
  total:    { type: Number, required: true }
});

const purchaseSchema = new mongoose.Schema({
  purchaseNumber: { type: String, unique: true },
  supplier:       { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items:          [purchaseItemSchema],
  totalAmount:    { type: Number, required: true, min: 0 },
  status:         { type: String, enum: ['received', 'pending', 'cancelled'], default: 'received' },
  invoiceNumber:  { type: String, trim: true },
  notes:          String,
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

purchaseSchema.pre('save', async function (next) {
  if (!this.purchaseNumber) {
    const seq = await Counter.nextSeq('purchase');
    this.purchaseNumber = `PO-${String(seq).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);

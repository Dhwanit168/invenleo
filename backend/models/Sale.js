const mongoose = require('mongoose');
const Counter  = require('./Counter');

const saleItemSchema = new mongoose.Schema({
  variant:   { type: mongoose.Schema.Types.ObjectId, ref: 'Variant',  required: true },
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product',  required: true },
  quantity:  { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total:     { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  saleNumber:    { type: String, unique: true },
  items:         [saleItemSchema],
  totalAmount:   { type: Number, required: true, min: 0 },
  customer:      { type: String, trim: true, default: 'Walk-in Customer' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'bank_transfer', 'other'], default: 'cash' },
  status:        { type: String, enum: ['completed', 'pending', 'cancelled'], default: 'completed' },
  notes:         String,
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

saleSchema.pre('save', async function (next) {
  if (!this.saleNumber) {
    const seq = await Counter.nextSeq('sale');
    this.saleNumber = `SALE-${String(seq).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);

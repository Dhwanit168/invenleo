const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  category:    { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  basePrice:   { type: Number, required: true, min: 0 },
  baseCostPrice: { type: Number, default: 0, min: 0 },
  supplier:    { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

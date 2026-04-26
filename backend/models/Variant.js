const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  color: { type: String, trim: true, default: '' },
  size: { type: String, trim: true, default: '' },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  price: { type: Number, min: 0 },
  costPrice: { type: Number, min: 0, default: 0 },
  quantity: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  reorderQuantity: { type: Number, default: 50 },
  preferredSupplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

variantSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.lowStockThreshold;
});
variantSchema.virtual('effectivePrice').get(function () {
  return this.price != null ? this.price : undefined;
});
variantSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Variant', variantSchema);

const mongoose = require('mongoose');

const reorderSuggestionSchema = new mongoose.Schema({
  variant:           { type: mongoose.Schema.Types.ObjectId, ref: 'Variant',  required: true },
  product:           { type: mongoose.Schema.Types.ObjectId, ref: 'Product',  required: true },
  supplier:          { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },

  currentStock:      { type: Number, required: true },
  threshold:         { type: Number, required: true },
  suggestedQuantity: { type: Number, required: true },   
  approvedQuantity:  { type: Number },                   

  status: {
    type:    String,
    enum:    ['pending', 'approved', 'cancelled', 'dismissed'],
    default: 'pending'
  },

  purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', default: null },
  resolvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',     default: null },
  resolvedAt:    { type: Date,   default: null },
  notes:         { type: String, default: '' },

  triggeredAt: { type: Date, default: Date.now }
}, { timestamps: true });

reorderSuggestionSchema.index({ variant: 1, status: 1 });

module.exports = mongoose.model('ReorderSuggestion', reorderSuggestionSchema);

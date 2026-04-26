const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username:   { type: String },
  action:     { type: String, required: true },   // e.g. 'STOCK_UPDATE'
  entity:     { type: String },                   // e.g. 'Variant', 'Sale'
  entityId:   { type: mongoose.Schema.Types.ObjectId },
  description:{ type: String, required: true },   // human-readable
  meta:       { type: mongoose.Schema.Types.Mixed }, // extra data
  ip:         { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);

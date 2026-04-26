const AuditLog = require('../models/AuditLog');

const log = async ({ user, action, entity, entityId, description, meta, ip }) => {
  try {
    await AuditLog.create({
      user:        user?._id || user?.id || user,
      username:    user?.username || 'system',
      action,
      entity,
      entityId,
      description,
      meta,
      ip
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write log entry:', err.message);
  }
};

module.exports = { log };

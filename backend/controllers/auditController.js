const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

const getLogs = asyncHandler(async (req, res) => {
  const { action, user, startDate, endDate, limit = 50, page = 1 } = req.query;
  const query = {};

  if (action) query.action = action;
  if (user) query.username = { $regex: user, $options: 'i' };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('user', 'username role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AuditLog.countDocuments(query)
  ]);

  res.json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

const getActions = asyncHandler(async (req, res) => {
  const actions = await AuditLog.distinct('action');
  res.json(actions);
});

module.exports = { getLogs, getActions };

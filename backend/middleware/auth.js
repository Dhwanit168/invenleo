const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {

  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authorised — please log in' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated. Contact your administrator.' });
    if (user.isBlocked) return res.status(403).json({ message: 'Account is blocked. Contact your administrator.' });

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      role: user.role,
      email: user.email,
      username: user.username
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired — please log in again' });
    }
    return res.status(401).json({ message: 'Invalid session' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied — admin only' });
};

const adminOrManager = (req, res, next) => {
  if (['admin', 'manager'].includes(req.user?.role)) return next();
  return res.status(403).json({ message: 'Access denied — manager or admin only' });
};

module.exports = { protect, adminOnly, adminOrManager };
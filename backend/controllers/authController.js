const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../config/mailer');

const COOKIE_NAME = 'token';

const cookieOptions = () => ({
  httpOnly: true,                                      // JS cannot read it
  secure: process.env.NODE_ENV === 'production',       // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,                   // 7 days in ms
  path: '/'
});

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

const userPayload = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  isActive: user.isActive
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated. Contact your administrator.' });
  if (user.isBlocked) return res.status(403).json({ message: 'Account is blocked. Contact your administrator.' });

  const token = signToken(user._id);

  res
    .cookie(COOKIE_NAME, token, cookieOptions())
    .json({ user: userPayload(user) });
});

const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) {
    const field = exists.email === email ? 'Email' : 'Username';
    return res.status(400).json({ message: `${field} already in use` });
  }

  // Restrict self-registration roles to 'manager' and 'staff'
  const allowedRoles = ['manager', 'staff'];
  const finalRole = allowedRoles.includes(role) ? role : 'staff';

  const user = await User.create({ username, email, password, role: finalRole });

  res.status(201).json({ user: userPayload(user) });
});

const logout = asyncHandler(async (req, res) => {
  res
    .cookie(COOKIE_NAME, '', { ...cookieOptions(), maxAge: 0 })
    .json({ message: 'Logged out successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(userPayload(user));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { username, email, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (username) user.username = username;
  if (email) user.email = email;

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required to set a new one' });
    }
    const ok = await user.matchPassword(currentPassword);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    user.password = newPassword;
  }

  await user.save();
  res.json({ message: 'Profile updated', user: userPayload(user) });
});

const getUsers = asyncHandler(async (req, res) => {
  const { role, isActive, search, page = 1, limit = 20 } = req.query;
  const query = {};

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) query.$or = [
    { username: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ];

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(query)
  ]);

  res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

const adminCreateUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) {
    const field = exists.email === email ? 'Email' : 'Username';
    return res.status(400).json({ message: `${field} already in use` });
  }

  const validRoles = ['admin', 'manager', 'staff'];
  const user = await User.create({
    username, email, password,
    role: validRoles.includes(role) ? role : 'staff'
  });

  res.status(201).json({ message: 'User created', user: userPayload(user) });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role, isActive, isBlocked } = req.body;
  const update = {};

  const validRoles = ['admin', 'manager', 'staff'];
  if (role && validRoles.includes(role)) update.role = role;
  if (isActive !== undefined) update.isActive = Boolean(isActive);
  if (isBlocked !== undefined) update.isBlocked = Boolean(isBlocked);

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json({ message: 'User updated', user: userPayload(user) });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const genericMsg = 'If that email exists in our system, a reset link has been sent.';

  const user = await User.findOne({ email });
  if (!user || !user.isActive) return res.json({ message: genericMsg });

  const plainToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${plainToken}`;

  try {
    await sendPasswordResetEmail(user.email, user.username, resetURL);
    res.json({ message: genericMsg });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('Email send error:', err.message);
    return res.status(500).json({ message: 'Could not send reset email. Please try again later.' });
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    return res.status(400).json({ message: 'Reset link is invalid or has expired' });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  try {
    await sendPasswordChangedEmail(user.email, user.username);
  } catch (err) {
    console.error('Password changed email failed:', err.message);
  }

  res.json({ message: 'Password reset successful. Please log in with your new password.' });
});

module.exports = {
  login,
  register,
  logout,
  getMe,
  updateProfile,
  getUsers,
  adminCreateUser,
  updateUserRole,
  forgotPassword,
  resetPassword
};
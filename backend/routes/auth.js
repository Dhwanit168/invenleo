const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const router = express.Router();

const {
  login, register, logout,
  getMe, updateProfile,
  getUsers, adminCreateUser, updateUserRole,
  forgotPassword, resetPassword
} = require('../controllers/authController');

const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' }
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { message: 'Too many password reset requests. Try again in 1 hour.' }
});

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const registerRules = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const forgotRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail()
];

const resetRules = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

router.post('/login', authLimiter, loginRules, validate, login);
router.post('/register', authLimiter, registerRules, validate, register);

router.post('/forgot-password', forgotLimiter, forgotRules, validate, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetRules, validate, resetPassword);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

router.get('/users', protect, adminOnly, getUsers);
router.post('/users', protect, adminOnly, adminCreateUser);
router.patch('/users/:id/role', protect, adminOnly, updateUserRole);

module.exports = router;
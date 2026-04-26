const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true,
    trim: true, minlength: 3, maxlength: 30
  },
  email: {
    type: String, required: true, unique: true,
    trim: true, lowercase: true
  },
  password: {
    type: String, required: true, minlength: 6, select: false
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'staff'],
    default: 'staff'
  },
  isActive:  { type: Boolean, default: true  },
  isBlocked: { type: Boolean, default: false },

resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date,   select: false },

}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const plain = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken   = crypto.createHash('sha256').update(plain).digest('hex');
  const minutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES) || 15;
  this.resetPasswordExpires = Date.now() + minutes * 60 * 1000;
  return plain;
};

module.exports = mongoose.model('User', userSchema);

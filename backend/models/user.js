const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    role: { type: String, required: true, enum: ['Merchandiser'], default: 'Merchandiser' },
    avatar: { type: String },
    password: { type: String, required: true, minlength: 6 },
    // New granular permissions for Merchandiser UI
    isLeadAccess: { type: Boolean, default: false },
    isCatalogAccess: { type: Boolean, default: false },
    isTemplateAccess: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

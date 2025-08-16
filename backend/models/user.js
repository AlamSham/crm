const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    role: { type: String, required: true, enum: ['Admin', 'Merchandiser'], default: 'Merchandiser' },
    avatar: { type: String },
    password: { type: String, required: true, minlength: 6 },
    isFollowUpPerson: { type: Boolean, default: false },
    isEmailAccess: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;

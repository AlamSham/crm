const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/generateTokens');

// Register new admin
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }
    const newAdmin = await Admin.create({ name, email, password });
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    next(err);
  }
};

// Admin login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const accessToken = generateAccessToken(admin._id, admin.role || 'admin');
    const refreshToken = generateRefreshToken(admin._id, admin.role || 'admin');

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken,
      adminId: admin._id,
    });
  } catch (err) {
    next(err);
  }
};

// Refresh access token
exports.refreshToken = async (req, res, next) => {
  try {
    const token =
      req.cookies?.refreshToken ||
      req.body?.token ||
      req.headers['x-refresh-token'];

    if (!token) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = generateAccessToken(decoded.userId);

    return res.status(200).json({ accessToken });
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

// Get admin profile
exports.getProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.userId).select('-password').lean();

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json(admin);
  } catch (err) {
    next(err);
  }
};

// Logout admin
exports.logout = async (req, res, next) => {
  try {
    const token =
      req.headers?.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : req.body?.token || req.query?.token || req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ message: 'Access token missing' });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    res.status(200).json({
      message: 'Logged out successfully',
      adminId: decoded.userId,
    });
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired access token' });
  }
};

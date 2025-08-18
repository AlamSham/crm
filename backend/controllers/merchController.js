const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens')

// Merchandiser login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const ok = await bcrypt.compare(String(password), user.password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    // Optional: update lastLogin
    user.lastLogin = new Date()
    await user.save()

    // Issue tokens with role flag for merch
    const role = 'merch'
    const accessToken = generateAccessToken(user._id, role)
    const refreshToken = generateRefreshToken(user._id, role)

    res.cookie('merchRefreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    const safe = user.toObject()
    delete safe.password

    return res.status(200).json({ accessToken, user: safe })
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message })
  }
}

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.merchRefreshToken || req.headers['x-refresh-token'] || req.body?.token
    if (!token) return res.status(401).json({ message: 'Refresh token required' })

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
    const accessToken = generateAccessToken(decoded.userId, decoded.role || 'merch')
    return res.status(200).json({ accessToken })
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired refresh token' })
  }
}

// Get profile (requires merch auth)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password').lean()
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.status(200).json(user)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load profile', error: err.message })
  }
}

// Logout
exports.logout = async (req, res) => {
  try {
    res.clearCookie('merchRefreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    })
    return res.status(200).json({ message: 'Logged out' })
  } catch (err) {
    return res.status(500).json({ message: 'Logout failed' })
  }
}

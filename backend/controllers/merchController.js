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

    const lookupEmail = String(email).toLowerCase()
    console.log('[merch.login] Attempt with email:', lookupEmail)
    const user = await User.findOne({ email: lookupEmail })
    if (!user) {
      console.log('[merch.login] User not found for email:', lookupEmail)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const rawPwd = String(password)
    let ok = await bcrypt.compare(rawPwd, user.password)
    if (!ok && rawPwd.trim() !== rawPwd) {
      // Retry with trimmed password to handle accidental spaces
      ok = await bcrypt.compare(rawPwd.trim(), user.password)
    }
    console.log('[merch.login] Password compare:', ok, 'userId:', user._id.toString())
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    // Block inactive users
    if (!user.active) {
      console.log('[merch.login] Inactive account for userId:', user._id.toString())
      return res.status(403).json({ message: 'Account inactive. Please contact admin.' })
    }

    // Optional: update lastLogin
    user.lastLogin = new Date()
    await user.save()

    // Issue tokens with role flag for merch
    const role = 'merch'
    const accessToken = generateAccessToken(user._id, role)
    const refreshToken = generateRefreshToken(user._id, role)
    console.log('[merch.login] Issued tokens for userId:', user._id.toString())

    res.cookie('merchRefreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    const safe = user.toObject()
    delete safe.password

    // Also return refreshToken in body so frontend can store and send via header for cross-site refresh flows
    return res.status(200).json({ accessToken, refreshToken, user: safe })
  } catch (err) {
    console.log('[merch.login] Error:', err?.message)
    return res.status(500).json({ message: 'Login failed', error: err.message })
  }
}

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const cookieToken = req.cookies?.merchRefreshToken
    const headerToken = req.headers['x-refresh-token']
    const bodyToken = req.body?.token
    console.log('[merch.refresh] sources:', { hasCookie: !!cookieToken, hasHeader: !!headerToken, hasBody: !!bodyToken })
    const token = cookieToken || headerToken || bodyToken
    if (!token) return res.status(401).json({ message: 'Refresh token required' })

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
    console.log('[merch.refresh] Decoded:', { userId: decoded?.userId, role: decoded?.role })
    const accessToken = generateAccessToken(decoded.userId, decoded.role || 'merch')
    return res.status(200).json({ accessToken })
  } catch (err) {
    console.log('[merch.refresh] Verify error:', err?.name, err?.message)
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
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    })
    return res.status(200).json({ message: 'Logged out' })
  } catch (err) {
    return res.status(500).json({ message: 'Logout failed' })
  }
}

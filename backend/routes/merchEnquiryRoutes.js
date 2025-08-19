const express = require('express')
const router = express.Router()
const { verifyMerchAccessToken } = require('../middleware/merchAuthMiddleware')
const CustomerEnquiry = require('../models/enquiry')

// All routes require merch access token
router.use(verifyMerchAccessToken)

// Helper: build search query
function buildQuery(userId, query) {
  const { page = 1, limit = 10, search = '', status, priority } = query
  const q = { createdBy: userId }
  if (status) q.status = status
  if (priority) q.priority = priority
  if (search) {
    q.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
      { products: { $elemMatch: { $regex: search, $options: 'i' } } },
    ]
  }
  return { q, page: Number(page), limit: Number(limit) }
}

// List (only own enquiries)
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId
    const { q, page, limit } = buildQuery(userId, req.query)
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      CustomerEnquiry.find(q)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email'),
      CustomerEnquiry.countDocuments(q),
    ])

    res.json({ items, total, page, limit })
  } catch (err) {
    next(err)
  }
})

// Create (sets creator as merch user)
router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId
    const data = req.body || {}

    const created = await CustomerEnquiry.create({
      ...data,
      createdBy: userId,
      createdByModel: 'User',
    })
    const populated = await CustomerEnquiry.findById(created._id).populate('createdBy', 'name email')
    res.status(201).json(populated)
  } catch (err) {
    next(err)
  }
})

// Update (only own enquiries)
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.userId
    const { id } = req.params
    const data = req.body || {}

    const existing = await CustomerEnquiry.findOne({ _id: id, createdBy: userId })
    if (!existing) return res.status(404).json({ message: 'Enquiry not found' })

    const updated = await CustomerEnquiry.findByIdAndUpdate(id, data, { new: true })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// Delete (only own enquiries)
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId
    const { id } = req.params

    const existing = await CustomerEnquiry.findOne({ _id: id, createdBy: userId })
    if (!existing) return res.status(404).json({ message: 'Enquiry not found' })

    await CustomerEnquiry.findByIdAndDelete(id)
    res.json({ message: 'Enquiry deleted' })
  } catch (err) {
    next(err)
  }
})

module.exports = router

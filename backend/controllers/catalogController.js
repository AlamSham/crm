const catalogService = require('../services/catalogService')

// Helper to get userId from auth (adjust based on your auth middleware)
function getUserId(req) {
  // If you attach user on req.user, use that; fall back to header for now
  return (req.user && req.user._id) || req.headers['x-admin-id'] || req.query.userId
}

// Categories
async function createCategory(req, res) {
  try {
    const userId = getUserId(req)
    const cat = await catalogService.createCategory(userId, req.body)
    res.json({ success: true, data: cat })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message })
  }
}

async function listCategories(req, res) {
  try {
    const userId = getUserId(req)
    const cats = await catalogService.getCategories(userId)
    res.json({ success: true, data: cats })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message })
  }
}

async function updateCategory(req, res) {
  try {
    const userId = getUserId(req)
    const cat = await catalogService.updateCategory(userId, req.params.id, req.body)
    res.json({ success: true, data: cat })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message })
  }
}

async function deleteCategory(req, res) {
  try {
    const userId = getUserId(req)
    const result = await catalogService.deleteCategory(userId, req.params.id)
    res.json({ success: true, ...result })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message })
  }
}

// Items
async function createItem(req, res) {
  try {
    const userId = getUserId(req)
    const item = await catalogService.createItem(userId, req.body)
    res.json({ success: true, data: item })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message })
  }
}

async function listItems(req, res) {
  try {
    const userId = getUserId(req)
    const { page, limit, search, categoryId, status } = req.query
    const result = await catalogService.getItems(userId, { page, limit, search, categoryId, status })
    res.json({ success: true, ...result })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message })
  }
}

async function getItem(req, res) {
  try {
    const userId = getUserId(req)
    const item = await catalogService.getItemById(userId, req.params.id)
    res.json({ success: true, data: item })
  } catch (e) {
    res.status(404).json({ success: false, message: e.message })
  }
}

async function updateItem(req, res) {
  try {
    const userId = getUserId(req)
    const item = await catalogService.updateItem(userId, req.params.id, req.body)
    res.json({ success: true, data: item })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message })
  }
}

async function deleteItem(req, res) {
  try {
    const userId = getUserId(req)
    const result = await catalogService.deleteItem(userId, req.params.id)
    res.json({ success: true, ...result })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message })
  }
}

// Uploads
async function uploadImage(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No image file provided' })
    }
    const uploaded = await catalogService.uploadImage(req.file.buffer)
    res.json({ success: true, data: uploaded })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message })
  }
}

// Upload document (PDF or other raw files)
async function uploadFile(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No file provided' })
    }
    const uploaded = await catalogService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype)
    res.json({ success: true, data: uploaded })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message })
  }
}

module.exports = {
  // categories
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
  // items
  createItem,
  listItems,
  getItem,
  updateItem,
  deleteItem,
  // uploads
  uploadImage,
  uploadFile,
}

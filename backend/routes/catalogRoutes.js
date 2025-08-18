const express = require('express')
const multer = require('multer')
const router = express.Router()
const catalogController = require('../controllers/catalogController')
const { verifyAccessToken } = require('../middleware/authMiddleware')

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})

// Separate uploader with PDF filter
const uploadPdf = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true)
    cb(new Error('Only PDF files are allowed'))
  },
})

// Categories
router.post('/categories', catalogController.createCategory)
router.get('/categories', catalogController.listCategories)
router.put('/categories/:id', catalogController.updateCategory)
router.delete('/categories/:id', catalogController.deleteCategory)

// Items
router.post('/items', catalogController.createItem)
router.get('/items', catalogController.listItems)
// Admin: list pending catalog items (place before /items/:id)
router.get('/items/pending', verifyAccessToken, catalogController.listPendingForAdmin)
router.get('/items/:id', catalogController.getItem)
router.put('/items/:id', catalogController.updateItem)
router.delete('/items/:id', catalogController.deleteItem)
// Admin: approve catalog item
router.patch('/items/:id/approve', verifyAccessToken, catalogController.approveItem)

// Upload image
router.post('/upload/image', upload.single('image'), catalogController.uploadImage)

// Upload document (PDF)
router.post('/upload/file', uploadPdf.single('file'), catalogController.uploadFile)

module.exports = router

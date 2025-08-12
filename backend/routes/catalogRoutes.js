const express = require('express')
const multer = require('multer')
const router = express.Router()
const catalogController = require('../controllers/catalogController')

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
router.get('/items/:id', catalogController.getItem)
router.put('/items/:id', catalogController.updateItem)
router.delete('/items/:id', catalogController.deleteItem)

// Upload image
router.post('/upload/image', upload.single('image'), catalogController.uploadImage)

// Upload document (PDF)
router.post('/upload/file', uploadPdf.single('file'), catalogController.uploadFile)

module.exports = router

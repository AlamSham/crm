const express = require('express')
const multer = require('multer')
const router = express.Router()
const catalogController = require('../controllers/catalogController')

const storage = multer.memoryStorage()
const upload = multer({ storage })

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

module.exports = router

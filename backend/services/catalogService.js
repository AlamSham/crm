const CatalogItem = require('../models/catalog/CatalogItem')
const CatalogCategory = require('../models/catalog/CatalogCategory')
const cloudinary = require('../utils/cloudinary')

// Categories
async function createCategory(userId, data) {
  const cat = new CatalogCategory({ userId, name: data.name, description: data.description || '' })
  await cat.save()
  return cat
}

async function getCategories(userId) {
  return CatalogCategory.find({ userId }).sort({ createdAt: -1 })
}

async function updateCategory(userId, id, data) {
  const cat = await CatalogCategory.findOneAndUpdate({ _id: id, userId }, data, { new: true })
  if (!cat) throw new Error('Category not found')
  return cat
}

async function deleteCategory(userId, id) {
  const cat = await CatalogCategory.findOneAndDelete({ _id: id, userId })
  if (!cat) throw new Error('Category not found')
  // Optional: remove references from items
  await CatalogItem.updateMany({ userId, categoryIds: id }, { $pull: { categoryIds: id } })
  return { message: 'Category deleted' }
}

// Items
async function createItem(userId, data) {
  const item = new CatalogItem({
    userId,
    title: data.title,
    description: data.description || '',
    price: data.price,
    url: data.url,
    images: data.images || [],
    categoryIds: data.categoryIds || [],
    tags: data.tags || [],
    status: data.status || 'active',
  })
  await item.save()
  return item
}

async function getItems(userId, { page = 1, limit = 12, search = '', categoryId = '', status = '' }) {
  const query = { userId }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ]
  }
  if (categoryId) query.categoryIds = categoryId
  if (status) query.status = status

  const items = await CatalogItem.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
  const total = await CatalogItem.countDocuments(query)
  return {
    items,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  }
}

async function getItemById(userId, id) {
  const item = await CatalogItem.findOne({ _id: id, userId })
  if (!item) throw new Error('Item not found')
  return item
}

async function updateItem(userId, id, data) {
  const item = await CatalogItem.findOneAndUpdate({ _id: id, userId }, data, { new: true })
  if (!item) throw new Error('Item not found')
  return item
}

async function deleteItem(userId, id) {
  const item = await CatalogItem.findOneAndDelete({ _id: id, userId })
  if (!item) throw new Error('Item not found')
  return { message: 'Item deleted' }
}

// Upload image to Cloudinary
async function uploadImage(buffer, folder = 'crm/catalog') {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not fully configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET')
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err)
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
        })
      }
    )
    stream.end(buffer)
  })
}

module.exports = {
  // categories
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  // items
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  // upload
  uploadImage,
}

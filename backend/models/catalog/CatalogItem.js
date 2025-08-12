const mongoose = require('mongoose')

const CatalogItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number },
    url: { type: String },
    images: [
      {
        publicId: { type: String },
        url: { type: String, required: true },
        width: { type: Number },
        height: { type: Number },
        format: { type: String },
      },
    ],
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CatalogCategory' }],
    tags: [{ type: String }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('CatalogItem', CatalogItemSchema)

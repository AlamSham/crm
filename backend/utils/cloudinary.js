const cloudinary = require('cloudinary').v2

const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
const missing = required.filter((k) => !process.env[k])

if (missing.length) {
  console.warn('[cloudinary] Missing env vars:', missing.join(', '))
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

module.exports = cloudinary

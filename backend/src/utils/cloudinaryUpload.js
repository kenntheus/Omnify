const { Readable } = require('stream')
const cloudinary = require('../config/cloudinary')

function uploadStream(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
    Readable.from(buffer).pipe(stream)
  })
}

module.exports = { uploadStream }

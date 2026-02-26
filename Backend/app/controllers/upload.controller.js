const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const config = require('../config');
const ApiError = require('../api-error');

// Cấu hình Cloudinary với thông tin từ file config
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

// Cấu hình nơi lưu trữ (Storage)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sportstore', // Tên thư mục trên Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// Middleware upload 1 file có field name là 'image'
exports.uploader = upload.single('image');

exports.uploadImage = (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'No file uploaded!'));
  }
  // Trả về đường dẫn ảnh online
  res.json({ url: req.file.path });
};
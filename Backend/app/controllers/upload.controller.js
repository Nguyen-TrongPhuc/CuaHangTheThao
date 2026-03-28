const multer = require('multer');
const path = require('path');
const ApiError = require('../api-error');

// Cấu hình nơi lưu trữ ảnh cục bộ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // __dirname là Backend/app/controllers. Cần lùi 2 cấp để ra Backend/public/uploads
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: function (req, file, cb) {
    // Đổi tên file để không bị trùng lặp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware upload 1 file có field name là 'image'
exports.uploader = upload.single('image');

exports.uploadImage = (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'Không có file nào được tải lên!'));
  }
  
  // Trả về đường dẫn ảnh cục bộ để Frontend hiển thị
  // port 3003 là cổng của Backend server
  const imageUrl = `http://localhost:3003/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
};
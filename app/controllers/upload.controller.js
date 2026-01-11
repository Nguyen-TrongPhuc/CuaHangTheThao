const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const ApiError = require("../api-error");
const config = require("../config");

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret,
});

// Cấu hình nơi lưu ảnh trên Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "sport-store",   // 📁 thư mục lưu ảnh cho dự án của bạn
        allowed_formats: ["jpg", "png", "jpeg"],
    },
});

// Khởi tạo multer
const upload = multer({ storage });

// ================= CONTROLLERS =================

// Upload ảnh sản phẩm / avatar / banner
exports.uploadImage = (req, res, next) => {
    if (!req.file) {
        return next(new ApiError(400, "Không có hình ảnh nào được tải lên"));
    }

    return res.send({
        message: "Upload ảnh thành công",
        url: req.file.path,   // link ảnh trên Cloudinary
    });
};

// Middleware dùng trong route
exports.uploader = upload.single("image");

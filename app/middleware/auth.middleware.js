const jwt = require("jsonwebtoken");
const config = require("../config/index");
const ApiError = require("../api-error");

// =======================
// 1. XÁC THỰC TOKEN
// =======================
const verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"] || req.headers["authorization"];

    if (!token) {
        return next(new ApiError(403, "Không tìm thấy Token (No token provided)"));
    }

    // Xử lý định dạng "Bearer <token>"
    if (token.startsWith("Bearer ")) {
        token = token.slice(7).trim();
    }

    jwt.verify(token, config.jwt.secret, (error, decoded) => {
        if (error) {
            return next(new ApiError(401, "Token không hợp lệ hoặc đã hết hạn"));
        }

        // Lưu thông tin giải mã vào req.user để các hàm sau sử dụng
        req.user = decoded; 
        next();
    });
};

// =======================
// 2. KIỂM TRA QUYỀN NHÂN VIÊN HOẶC ADMIN (Dành cho Route Upload)
// =======================
const isEmployeeOrAdmin = (req, res, next) => {
    // Kiểm tra xem req.user đã tồn tại chưa (do verifyToken cấp)
    if (!req.user) {
        return next(new ApiError(401, "Người dùng chưa được xác thực"));
    }

    const role = req.user.role;
    if (role === "employee" || role === "admin") {
        return next();
    }

    return next(new ApiError(403, "Quyền truy cập bị từ chối! Cần quyền Nhân viên hoặc Admin."));
};

// =======================
// 3. CHỈ ADMIN
// =======================
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return next(new ApiError(403, "Yêu cầu quyền Admin!"));
};

// =======================
// 4. CHỈ KHÁCH HÀNG
// =======================
const isCustomer = (req, res, next) => {
    if (req.user && req.user.role === "customer") {
        return next();
    }
    return next(new ApiError(403, "Yêu cầu quyền Khách hàng!"));
};

module.exports = {
    verifyToken,
    isAdmin,
    isEmployeeOrAdmin, // Tên hàm này giờ đã khớp với file Route của bạn
    isCustomer,
};
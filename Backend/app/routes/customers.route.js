const express = require("express");
const customers = require("../controllers/customers.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// =======================
// ROUTES CHO CUSTOMERS
// =======================

// Đăng nhập khách hàng
router.route("/login")
    .post(customers.login);

// Đổi mật khẩu
router.route("/change-password")
    .post([auth.verifyToken], customers.changePassword);

// Quên mật khẩu (Gửi OTP)
router.route("/forgot-password")
    .post(customers.forgotPassword);

// ✅ Xác thực OTP (kiểm tra OTP đúng)
router.route("/verify-otp")
    .post(customers.verifyOtp);

// Đặt lại mật khẩu (Dùng OTP)
router.route("/reset-password")
    .post(customers.resetPassword);

// Cập nhật hồ sơ cá nhân
router.route("/profile")
    .get([auth.verifyToken], customers.getProfile)
    .put([auth.verifyToken], customers.updateProfile);

// Lấy danh sách + tạo mới + xóa tất cả
router.route("/")
    .get(customers.findAll)                 // nhân viên / admin
    .post(customers.create)                // đăng ký tài khoản
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], customers.deleteAll);

// Loyalty endpoints
router.route("/loyalty")
    .get([auth.verifyToken], customers.getLoyalty);
router.route("/loyalty/:id")
    .get([auth.verifyToken], customers.getLoyalty)
    .put([auth.verifyToken, auth.isEmployeeOrAdmin], customers.updateLoyalty);

// Lấy 1 + cập nhật + xóa theo id
router.route("/:id")
    .get(customers.findOne)
    .put([auth.verifyToken], customers.update)
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], customers.delete);

module.exports = router;

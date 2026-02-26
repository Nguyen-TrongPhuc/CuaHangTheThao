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

// Cập nhật hồ sơ cá nhân
router.route("/profile")
    .get([auth.verifyToken], customers.getProfile)
    .put([auth.verifyToken], customers.updateProfile);

// Lấy danh sách + tạo mới + xóa tất cả
router.route("/")
    .get(customers.findAll)                 // nhân viên / admin
    .post(customers.create)                // đăng ký tài khoản
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], customers.deleteAll);

// Lấy 1 + cập nhật + xóa theo id
router.route("/:id")
    .get(customers.findOne)
    .put([auth.verifyToken], customers.update)
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], customers.delete);

module.exports = router;

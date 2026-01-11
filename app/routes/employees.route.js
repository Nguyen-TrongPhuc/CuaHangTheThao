const express = require("express");
const employees = require("../controllers/employees.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// =======================
// ROUTES CHO EMPLOYEES
// =======================

// Đăng nhập nhân viên
router.route("/login")
    .post(employees.login);

// Lấy danh sách + tạo mới + xóa tất cả
router.route("/")
    .get([auth.verifyToken, auth.isAdmin], employees.findAll)   // chỉ admin xem danh sách
    .post([auth.verifyToken, auth.isAdmin], employees.create)  // chỉ admin tạo
    .delete([auth.verifyToken, auth.isAdmin], employees.deleteAll);

// Lấy 1 + cập nhật + xóa theo id
router.route("/:id")
    .get([auth.verifyToken, auth.isAdmin], employees.findOne)
    .put([auth.verifyToken, auth.isAdmin], employees.update)
    .delete([auth.verifyToken, auth.isAdmin], employees.delete);

module.exports = router;

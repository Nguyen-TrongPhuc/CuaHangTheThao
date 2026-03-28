const express = require("express");
const salaries = require("../controllers/salaries.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// Nhân viên xem lương của chính mình
router.get("/my-salaries", [auth.verifyToken, auth.isEmployeeOrAdmin], salaries.findMySalaries);

// Admin lấy danh sách bảng lương & Sinh bảng lương tự động
router.route("/")
    .get([auth.verifyToken, auth.isAdmin], salaries.findAll)
    .post([auth.verifyToken, auth.isAdmin], salaries.generate);

// Admin cập nhật/chốt thanh toán lương
router.put("/:id", [auth.verifyToken, auth.isAdmin], salaries.update);

module.exports = router;
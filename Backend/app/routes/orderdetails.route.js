const express = require("express");
const orderDetails = require("../controllers/orderdetails.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// =======================
// ROUTES CHO ORDER DETAILS
// =======================

// Lấy danh sách chi tiết đơn + thêm mới + xóa tất cả
router.route("/")
    .get([auth.verifyToken], orderDetails.findAll)          // nhân viên / admin xem
    .post([auth.verifyToken], orderDetails.create)         // khi tạo đơn hàng
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], orderDetails.deleteAll);

// Lấy 1 chi tiết + cập nhật + xóa
router.route("/:id")
    .get([auth.verifyToken], orderDetails.findOne)
    .put([auth.verifyToken], orderDetails.update)          // cập nhật số lượng, giá
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], orderDetails.delete);

module.exports = router;

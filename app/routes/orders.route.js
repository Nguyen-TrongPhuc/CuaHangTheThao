const express = require("express");
const orders = require("../controllers/orders.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// =======================
// ROUTES CHO ORDERS
// =======================

// Tạo đơn hàng + xem danh sách đơn
router.route("/")
    .get([auth.verifyToken], orders.findAll)        // nhân viên / admin xem
    .post([auth.verifyToken], orders.create)       // khách đã đăng nhập mới được mua
    .delete([auth.verifyToken, auth.isAdmin], orders.deleteAll); // chỉ admin xóa tất cả

// Lấy 1 đơn + cập nhật + xóa
router.route("/:id")
    .get([auth.verifyToken], orders.findOne)
    .put([auth.verifyToken], orders.update)        // nhân viên cập nhật trạng thái
    .delete([auth.verifyToken, auth.isAdmin], orders.delete);

module.exports = router;

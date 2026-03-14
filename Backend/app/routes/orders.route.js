const express = require("express");
const orders = require("../controllers/orders.controller");
const auth = require("../middleware/auth.middleware");
const MongoDB = require("../utils/mongodb.util");
const OrderService = require("../services/orders.service");

const router = express.Router();

// Khởi chạy Cronjob (Tác vụ nền) tự động hủy đơn hàng chưa thanh toán sau 15 phút
setInterval(async () => {
    if (MongoDB.client) {
        try {
            const orderService = new OrderService(MongoDB.client);
            await orderService.cancelExpiredOrders();
        } catch (error) {
            console.error("Lỗi khi chạy Cronjob hủy đơn:", error);
        }
    }
}, 60 * 1000); // Quét mỗi 1 phút (60,000 milliseconds)

// =======================
// ROUTES CHO ORDERS
// =======================

// Lấy lịch sử đơn hàng của khách hàng (Đặt trước route /:id để tránh nhầm lẫn)
router.route("/history")
    .get([auth.verifyToken], orders.findHistory);

// Tạo đơn hàng + xem danh sách đơn
router.route("/")
    .get([auth.verifyToken], orders.findAll)        // nhân viên / admin xem
    .post([auth.verifyToken], orders.create)       // khách đã đăng nhập mới được mua
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], orders.deleteAll); // nhân viên cũng có thể xóa

// Lấy 1 đơn + cập nhật + xóa
router.route("/:id")
    .get([auth.verifyToken], orders.findOne)
    .put([auth.verifyToken], orders.update)        // nhân viên cập nhật trạng thái
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], orders.delete);

module.exports = router;

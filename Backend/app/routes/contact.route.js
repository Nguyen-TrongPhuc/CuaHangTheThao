const express = require("express");
const contactController = require("../controllers/contact.controller");

const router = express.Router();

// Tạo liên hệ mới
router.post("/", contactController.create);

// Lấy tất cả liên hệ
router.get("/", contactController.findAll);

// Xóa tất cả liên hệ (đặt trước :id routes)
router.delete("/all", contactController.deleteAll);

// Specific routes before parameterized routes
// Đánh dấu liên hệ là đã đọc
router.put("/:id/mark-as-read", contactController.markAsRead);

// Parameterized routes
// Lấy chi tiết liên hệ theo ID
router.get("/:id", contactController.findById);

// Cập nhật liên hệ
router.put("/:id", contactController.update);

// Xóa liên hệ theo ID
router.delete("/:id", contactController.delete);

module.exports = router;

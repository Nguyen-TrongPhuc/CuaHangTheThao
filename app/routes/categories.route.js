const express = require("express");
const categories = require("../controllers/categories.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// =======================
// ROUTES CHO CATEGORIES
// =======================

// Lấy danh sách + tạo mới + xóa tất cả
router.route("/")
    .get(categories.findAll)                         // khách vãng lai xem được
    .post([auth.verifyToken, auth.isAdmin], categories.create)   // chỉ admin tạo
    .delete([auth.verifyToken, auth.isAdmin], categories.deleteAll);

// Lấy 1 + cập nhật + xóa theo id
router.route("/:id")
    .get(categories.findOne)
    .put([auth.verifyToken, auth.isAdmin], categories.update)
    .delete([auth.verifyToken, auth.isAdmin], categories.delete);

module.exports = router;

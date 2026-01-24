const express = require("express");
const suppliers = require("../controllers/suppliers.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// =======================
// ROUTES CHO SUPPLIERS
// =======================

// Lấy danh sách + tạo mới + xóa tất cả
router.route("/")
    .get(suppliers.findAll)                  // khách vãng lai xem được
    .post([auth.verifyToken], suppliers.create)   // chỉ người đăng nhập mới tạo
    .delete([auth.verifyToken], suppliers.deleteAll);

// Lấy 1 + cập nhật + xóa theo id
router.route("/:id")
    .get(suppliers.findOne)
    .put([auth.verifyToken], suppliers.update)
    .delete([auth.verifyToken], suppliers.delete);

module.exports = router;


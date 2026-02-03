const express = require("express");
const products = require("../controllers/products.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// =======================
// ROUTES CHO PRODUCTS
// =======================

// Lấy danh sách sản phẩm + thêm mới + xóa tất cả
router.route("/")
    .get(products.findAll)                                      // khách vãng lai xem được
    .post([auth.verifyToken, auth.isEmployeeOrAdmin], products.create)    // nhân viên/admin tạo
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], products.deleteAll);

// Lấy 1 sản phẩm + cập nhật + xóa
router.route("/:id")
    .get(products.findOne)
    .put([auth.verifyToken, auth.isEmployeeOrAdmin], products.update)
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], products.delete);

module.exports = router;

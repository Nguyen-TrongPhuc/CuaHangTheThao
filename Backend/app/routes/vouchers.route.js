const express = require("express");
const vouchers = require("../controllers/vouchers.controller");
const auth = require("../middleware/auth.middleware");
const MongoDB = require("../utils/mongodb.util");
const VoucherService = require("../services/vouchers.service");

const router = express.Router();

// API validate voucher (public - dùng ở checkout)
router.route("/validate")
    .post(vouchers.validate);

// Lấy danh sách voucher public (cho khách hàng chọn)
router.route("/available")
    .get(async (req, res, next) => {
        try {
            const voucherService = new VoucherService(MongoDB.client);
            const docs = await voucherService.getAvailablePublic();
            return res.send(docs);
        } catch (error) {
            return next(error);
        }
    });

router.route("/stats")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], vouchers.stats);

// Admin APIs (protected)
router.route("/")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], vouchers.findAll)
    .post([auth.verifyToken, auth.isAdmin], vouchers.create);

router.route("/:id")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], vouchers.findOne)
    .put([auth.verifyToken, auth.isAdmin], vouchers.update)
    .delete([auth.verifyToken, auth.isAdmin], vouchers.delete);

module.exports = router;

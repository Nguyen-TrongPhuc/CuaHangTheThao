const express = require("express");
const vouchers = require("../controllers/vouchers.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// API validate voucher (public - dùng ở checkout)
router.route("/validate")
    .post(vouchers.validate);

router.route("/stats")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], vouchers.stats);

// Admin APIs (protected)
router.route("/")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], vouchers.findAll)
    .post([auth.verifyToken, auth.isEmployeeOrAdmin], vouchers.create);

router.route("/:id")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], vouchers.findOne)
    .put([auth.verifyToken, auth.isEmployeeOrAdmin], vouchers.update)
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], vouchers.delete);

module.exports = router;

const express = require("express");
const dashboard = require("../controllers/dashboard.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

router.route("/summary")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], dashboard.getSummary);

router.route("/monthly-sales")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], dashboard.getMonthlySales);

router.route("/top-customers")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], dashboard.getTopCustomers);

router.route("/low-stock")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], dashboard.getLowStockProducts);

router.route("/import-report")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], dashboard.getImportReport);

module.exports = router;
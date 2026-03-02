const express = require("express");
const dashboard = require("../controllers/dashboard.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

router.route("/summary")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], dashboard.getSummary);

module.exports = router;
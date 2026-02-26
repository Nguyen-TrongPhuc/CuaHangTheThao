const express = require("express");
const colors = require("../controllers/colors.controller");
const auth = require("../middleware/auth.middleware");
const router = express.Router();

router.route("/")
    .get(colors.findAll)
    .post([auth.verifyToken, auth.isEmployeeOrAdmin], colors.create);

router.route("/:id")
    .get(colors.findOne)
    .put([auth.verifyToken, auth.isEmployeeOrAdmin], colors.update)
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], colors.delete);

module.exports = router;
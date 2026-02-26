const express = require("express");
const sizes = require("../controllers/sizes.controller");
const auth = require("../middleware/auth.middleware");
const router = express.Router();

router.route("/")
    .get(sizes.findAll)
    .post([auth.verifyToken, auth.isEmployeeOrAdmin], sizes.create);

router.route("/:id")
    .get(sizes.findOne)
    .put([auth.verifyToken, auth.isEmployeeOrAdmin], sizes.update)
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], sizes.delete);

module.exports = router;
const express = require("express");
const sports = require("../controllers/sports.controller");
const auth = require("../middleware/auth.middleware");
const router = express.Router();

router.route("/")
    .get(sports.findAll)
    .post([auth.verifyToken, auth.isEmployeeOrAdmin], sports.create);

router.route("/:id")
    .get(sports.findOne)
    .put([auth.verifyToken, auth.isEmployeeOrAdmin], sports.update)
    .delete([auth.verifyToken, auth.isEmployeeOrAdmin], sports.delete);

module.exports = router;
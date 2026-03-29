const express = require("express");
const shifts = require("../controllers/shifts.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

router.route("/")
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], shifts.findAll)
    .post([auth.verifyToken, auth.isAdmin], shifts.create);

router.route("/:id")
    .put([auth.verifyToken, auth.isAdmin], shifts.update)
    .delete([auth.verifyToken, auth.isAdmin], shifts.delete);

module.exports = router;
const express = require("express");
const reviews = require("../controllers/reviews.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

router.route("/")
    .post([auth.verifyToken], reviews.create)
    .get([auth.verifyToken, auth.isEmployeeOrAdmin], reviews.findAll);

router.route("/product/:id")
    .get(reviews.findByProduct);

router.route("/:id/reply")
    .put([auth.verifyToken, auth.isEmployeeOrAdmin], reviews.reply);

module.exports = router;
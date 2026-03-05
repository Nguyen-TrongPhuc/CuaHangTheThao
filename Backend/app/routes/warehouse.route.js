const express = require("express");
const warehouse = require("../controllers/warehouse.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

router.route("/")
    .get(warehouse.findAll);

router.route("/import")
    .post([auth.verifyToken, auth.isAdmin], warehouse.create);

module.exports = router;

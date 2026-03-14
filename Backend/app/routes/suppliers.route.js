const express = require("express");
const suppliers = require("../controllers/suppliers.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

router.route("/")
    .get(suppliers.findAll)
    .post([auth.verifyToken, auth.isAdmin], suppliers.create);

router.route("/:id")
    .put([auth.verifyToken, auth.isAdmin], suppliers.update)
    .delete([auth.verifyToken, auth.isAdmin], suppliers.delete);

module.exports = router;
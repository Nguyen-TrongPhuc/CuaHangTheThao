const express = require("express");
const shipping = require("../controllers/shipping.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

router.route("/shop")
    .get(shipping.getShopInfo)
    .put(auth.verifyToken, auth.isAdmin, shipping.updateShopInfo);

router.route("/calculate")
    .post(shipping.calculateShipping);

router.route("/config")
    .get(shipping.getShippingInfo);

module.exports = router;
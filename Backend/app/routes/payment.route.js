const express = require("express");
const payment = require("../controllers/payment.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// =======================
// ROUTES CHO PAYMENT
// =======================

// Get shipping fee calculation (public)
router.route("/shipping-fee")
    .get(payment.getShippingFee);

// Create VNPAY payment URL
router.route("/vnpay/create")
    .post([auth.verifyToken], payment.createVnpayPayment);

// VNPAY callback (IPN) - must be public for VNPAY server to call
router.route("/vnpay/callback")
    .get(payment.vnpayCallback);

// Create MoMo payment
router.route("/momo/create")
    .post([auth.verifyToken], payment.createMomoPayment);

// MoMo IPN Callback - Public for MoMo server
router.route("/momo-callback")
    .post(payment.momoCallback);

// Check payment status
router.route("/status/:orderId")
    .get([auth.verifyToken], payment.checkPaymentStatus);

module.exports = router;


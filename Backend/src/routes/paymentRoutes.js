const express = require("express");

const protectCustomer = require("../middleware/authMiddleware");

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/paymentController");

const router = express.Router();

router.post(
  "/create-order",
  protectCustomer,
  createRazorpayOrder
);

router.post(
  "/verify",
  protectCustomer,
  verifyRazorpayPayment
);

module.exports = router;
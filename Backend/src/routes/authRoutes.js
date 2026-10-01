const express = require("express");

const {
  registerCustomer,
  loginCustomer,
  forgotCustomerPassword,
  verifyCustomerResetOtp,
  resetCustomerPassword,
} = require("../controllers/customerAuthController");

const router = express.Router();

/* =========================================================
   CUSTOMER AUTH
========================================================= */

router.post("/register", registerCustomer);

router.post("/login", loginCustomer);

/* =========================================================
   CUSTOMER PASSWORD RESET
========================================================= */

router.post(
  "/forgot-password",
  forgotCustomerPassword
);

router.post(
  "/verify-reset-otp",
  verifyCustomerResetOtp
);

router.post(
  "/reset-password",
  resetCustomerPassword
);

module.exports = router;
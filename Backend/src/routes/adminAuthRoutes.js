const express = require("express");

const {
  loginAdmin,
  logoutAdmin,
  changeAdminPassword,
  getCurrentAdmin,
  updateAdminProfilePicture,
  forgotAdminPassword,
  verifyAdminResetOtp,
  resetAdminPassword,
} = require("../controllers/adminAuthController");

const protectAdmin = require("../middleware/adminAuth");
const upload = require("../middleware/upload");

const router = express.Router();

/* =========================================================
   PUBLIC ADMIN AUTH
========================================================= */

router.post("/login", loginAdmin);

router.post(
  "/forgot-password",
  forgotAdminPassword
);

router.post(
  "/verify-reset-otp",
  verifyAdminResetOtp
);

router.post(
  "/reset-password",
  resetAdminPassword
);

/* =========================================================
   PROTECTED ADMIN AUTH
========================================================= */

router.get(
  "/me",
  protectAdmin,
  getCurrentAdmin
);

router.patch(
  "/profile-picture",
  protectAdmin,
  upload.single("image"),
  updateAdminProfilePicture
);

router.post(
  "/logout",
  protectAdmin,
  logoutAdmin
);

router.post(
  "/change-password",
  protectAdmin,
  changeAdminPassword
);

module.exports = router;
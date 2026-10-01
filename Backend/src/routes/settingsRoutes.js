const express = require("express");

const adminAuth = require("../middleware/adminAuth");

const {
  getStoreSettings,
  updateStoreSettings,
} = require("../controllers/settingsController");

const router = express.Router();

// Public: checkout/customer can read shipping settings
router.get("/", getStoreSettings);

// Admin only: update settings
router.patch("/", adminAuth, updateStoreSettings);

module.exports = router;
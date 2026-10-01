const express = require("express");
const {
  submitContactMessage,
  subscribeToNewsletter,
  getContactInfo,
} = require("../controllers/publicController");
const protectCustomer = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/contact-info", getContactInfo);
router.post("/contact", protectCustomer, submitContactMessage);
router.post("/newsletter", subscribeToNewsletter);

module.exports = router;
const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const {
  getContactMessages,
  getUnreadContactMessageCount,
  markContactMessagesRead,
  updateContactInfo,
} = require("../controllers/publicController");

const router = express.Router();

router.use(adminAuth);
router.get("/unread-count", getUnreadContactMessageCount);
router.patch("/read-all", markContactMessagesRead);
router.get("/", getContactMessages);
router.patch("/contact-info", updateContactInfo);

module.exports = router;
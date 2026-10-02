const ContactMessage = require("../models/ContactMessage");
const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const StoreSettings = require("../models/StoreSettings");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (
      !String(name || "").trim() ||
      !EMAIL_PATTERN.test(normalizedEmail) ||
      !String(subject || "").trim() ||
      !String(message || "").trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, valid email, subject and message are required.",
      });
    }

    if (String(name).trim().length > 120 || String(subject).trim().length > 160 || String(message).trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: "One or more fields exceed the allowed length.",
      });
    }

    await ContactMessage.create({
      customerId: req.customer.id,
      name: String(name).trim(),
      email: normalizedEmail,
      subject: String(subject).trim(),
      message: String(message).trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been received.",
    });
  } catch (error) {
    console.error("Contact submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit your message.",
    });
  }
};

const getContactInfo = async (req, res) => {
  try {
    const settings = await StoreSettings.findOne({ key: "store" })
      .select("supportEmail supportPhone supportLocation")
      .lean();

    return res.status(200).json({
      success: true,
      contactInfo: {
        email: settings?.supportEmail || "",
        phone: settings?.supportPhone || "",
        location: settings?.supportLocation || "",
      },
    });
  } catch (error) {
    console.error("Get contact info error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load contact information.",
    });
  }
};

const getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Get contact messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load contact messages.",
    });
  }
};

const getUnreadContactMessageCount = async (req, res) => {
  try {
    const unreadCount = await ContactMessage.countDocuments({ readAt: null });
    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    console.error("Get unread message count error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load unread message count.",
    });
  }
};

const markContactMessagesRead = async (req, res) => {
  try {
    const result = await ContactMessage.updateMany(
      { readAt: null },
      { $set: { readAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      markedRead: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark messages read error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to mark messages as read.",
    });
  }
};

const updateContactInfo = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const location = String(req.body.location || "").trim();

    if (
      !EMAIL_PATTERN.test(email) ||
      email.length > 254 ||
      phone.length < 5 ||
      phone.length > 40 ||
      location.length < 2 ||
      location.length > 200
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email, phone number, and location.",
      });
    }

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "store" },
      {
        $set: {
          supportEmail: email,
          supportPhone: phone,
          supportLocation: location,
        },
        $setOnInsert: { key: "store" },
      },
      { returnDocument: "after", upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Contact details updated.",
      contactInfo: {
        email: settings.supportEmail,
        phone: settings.supportPhone,
        location: settings.supportLocation,
      },
    });
  } catch (error) {
    console.error("Update contact info error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update contact details.",
    });
  }
};

const subscribeToNewsletter = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    await NewsletterSubscriber.updateOne(
      { email },
      { $setOnInsert: { email } },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Thank you for subscribing.",
    });
  } catch (error) {
    console.error("Newsletter signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to subscribe right now.",
    });
  }
};

module.exports = {
  submitContactMessage,
  subscribeToNewsletter,
  getContactInfo,
  getContactMessages,
  getUnreadContactMessageCount,
  markContactMessagesRead,
  updateContactInfo,
};
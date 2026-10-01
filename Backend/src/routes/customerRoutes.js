const express = require("express");

const Customer = require("../models/Customer");
const adminAuth = require("../middleware/adminAuth");
const protectCustomer = require("../middleware/authMiddleware");

const {
  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
  deleteCustomerAccount,
} = require("../controllers/customerController");

const {
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
} = require("../controllers/emailVerificationController");

const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

const router = express.Router();

// ===============================
// ADMIN CUSTOMER COUNT
// ===============================

router.get("/admin/count", adminAuth, async (req, res) => {
  try {
    const count = await Customer.countDocuments({
      role: "customer",
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Get customer count error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customer count.",
    });
  }
});

// ===============================
// ADMIN CUSTOMER LIST
// ===============================

router.get("/admin/list", adminAuth, async (req, res) => {
  try {
    const customers = await Customer.find({
      role: "customer",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Get admin customer list error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customers.",
    });
  }
});

// ===============================
// ADMIN DELETE CUSTOMER
// ===============================

router.delete("/admin/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required.",
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      role: "customer",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    await Customer.deleteOne({
      _id: id,
      role: "customer",
    });

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully.",
      customerId: id,
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete customer.",
    });
  }
});

router.get(
  "/profile",
  protectCustomer,
  getCustomerProfile
);

router.patch(
  "/profile",
  protectCustomer,
  updateCustomerProfile
);

router.patch(
  "/change-password",
  protectCustomer,
  changeCustomerPassword
);

router.delete(
  "/account",
  protectCustomer,
  deleteCustomerAccount
);

router.get("/me", protectCustomer, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Customer authentication verified.",
    customer: req.customer,
  });
});

// Email change OTP
router.post(
  "/email/send-otp",
  protectCustomer,
  sendEmailChangeOtp
);

router.post(
  "/email/verify-otp",
  protectCustomer,
  verifyEmailChangeOtp
);

// Customer addresses
router.get(
  "/addresses",
  protectCustomer,
  getAddresses
);

router.post(
  "/addresses",
  protectCustomer,
  addAddress
);

router.patch(
  "/addresses/:id",
  protectCustomer,
  updateAddress
);

router.delete(
  "/addresses/:id",
  protectCustomer,
  deleteAddress
);

router.patch(
  "/addresses/:id/default",
  protectCustomer,
  setDefaultAddress
);

module.exports = router;
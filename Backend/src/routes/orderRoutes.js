const express = require("express");
const mongoose = require("mongoose");

const protectCustomer = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminAuth");

const {
  getCustomerOrders,
  getCustomerOrderById,
  cancelCustomerOrder,
  requestCustomerOrderReturn,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  updateReturnStatus,
  reconcileOrderRefund,
} = require("../controllers/orderController");

const router = express.Router();
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID." });
  next();
});

// ===============================
// CUSTOMER ORDER ROUTES
// ===============================

router.get(
  "/",
  protectCustomer,
  getCustomerOrders
);

// ===============================
// ADMIN ORDER ROUTES
// ===============================

router.get(
  "/admin",
  adminAuth,
  getAllOrders
);

router.patch(
  "/:id/status",
  adminAuth,
  updateOrderStatus
);

router.patch(
  "/:id/payment-status",
  adminAuth,
  updatePaymentStatus
);

router.patch(
  "/:id/return-status",
  adminAuth,
  updateReturnStatus
);
router.post("/:id/refund/reconcile", adminAuth, reconcileOrderRefund);

// ===============================
// CUSTOMER ORDER BY ID / ACTIONS
// ===============================

router.get(
  "/:id",
  protectCustomer,
  getCustomerOrderById
);

router.patch(
  "/:id/cancel",
  protectCustomer,
  cancelCustomerOrder
);

router.patch(
  "/:id/return",
  protectCustomer,
  requestCustomerOrderReturn
);

module.exports = router;

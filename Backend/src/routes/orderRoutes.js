const express = require("express");

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
} = require("../controllers/orderController");

const router = express.Router();

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
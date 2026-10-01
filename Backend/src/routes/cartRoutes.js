const express = require("express");

const protectCustomer = require("../middleware/authMiddleware");

const {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  removeItemsFromCart,
  clearCart,
  syncCart,
} = require("../controllers/cartController");

const router = express.Router();

router.get(
  "/",
  protectCustomer,
  getCart
);

router.post(
  "/items",
  protectCustomer,
  addToCart
);

router.post(
  "/sync",
  protectCustomer,
  syncCart
);

router.patch(
  "/items/:cartId",
  protectCustomer,
  updateCartQuantity
);

router.delete(
  "/items/:cartId",
  protectCustomer,
  removeFromCart
);

router.post(
  "/items/remove",
  protectCustomer,
  removeItemsFromCart
);

router.delete(
  "/",
  protectCustomer,
  clearCart
);

module.exports = router;
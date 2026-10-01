const express = require("express");
const protectCustomer = require("../middleware/authMiddleware");
const {
  getWishlist,
  addWishlistProduct,
  removeWishlistProduct,
  clearWishlist,
} = require("../controllers/wishlistController");

const router = express.Router();

router.use(protectCustomer);
router.get("/", getWishlist);
router.post("/products/:productId", addWishlistProduct);
router.delete("/products/:productId", removeWishlistProduct);
router.delete("/", clearWishlist);

module.exports = router;
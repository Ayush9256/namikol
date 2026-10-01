const express = require("express");
const adminAuth = require("../middleware/adminAuth");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const upload = require("../middleware/upload");

const router = express.Router();

/* =========================================================
   PUBLIC PRODUCT ROUTES
========================================================= */

// Get all products
router.get("/", getProducts);

// Get single product
router.get("/:id", getProductById);

/* =========================================================
   ADMIN PRODUCT ROUTES
========================================================= */

router.post("/", adminAuth, upload.single("image"), createProduct);

router.put("/:id", adminAuth, upload.single("image"), updateProduct);

router.delete("/:id", adminAuth, deleteProduct);

module.exports = router;
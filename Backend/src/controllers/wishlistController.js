const mongoose = require("mongoose");
const Product = require("../models/Product");
const Wishlist = require("../models/Wishlist");

const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      customerId: req.customer.id,
    }).populate("products");

    return res.status(200).json({
      success: true,
      products: wishlist?.products || [],
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load wishlist.",
    });
  }
};

const addWishlistProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(productId).select("_id");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { customerId: req.customer.id },
      { $addToSet: { products: product._id } },
      { upsert: true, returnDocument: "after", runValidators: true }
    ).populate("products");

    return res.status(200).json({
      success: true,
      products: wishlist.products,
    });
  } catch (error) {
    console.error("Add wishlist product error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update wishlist.",
    });
  }
};

const removeWishlistProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { customerId: req.customer.id },
      { $pull: { products: productId } },
      { returnDocument: "after" }
    ).populate("products");

    return res.status(200).json({
      success: true,
      products: wishlist?.products || [],
    });
  } catch (error) {
    console.error("Remove wishlist product error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update wishlist.",
    });
  }
};

const clearWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate(
      { customerId: req.customer.id },
      { $set: { products: [] } },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      products: [],
    });
  } catch (error) {
    console.error("Clear wishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to clear wishlist.",
    });
  }
};

module.exports = {
  getWishlist,
  addWishlistProduct,
  removeWishlistProduct,
  clearWishlist,
};
const mongoose = require("mongoose");

const sizeStockSchema = new mongoose.Schema(
  {
    size: {
      type: Number,
      required: true,
      enum: [6, 7, 8, 9, 10, 11],
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      required: true,
      enum: ["men", "women", "unisex"],
      lowercase: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    // Size-wise inventory
    sizes: {
      type: [sizeStockSchema],
      required: true,
      validate: {
        validator: (sizes) => {
          if (!Array.isArray(sizes) || sizes.length === 0) {
            return false;
          }

          const sizeValues = sizes.map((item) => Number(item.size));

          // Only sizes 6 to 11
          if (!sizeValues.every((size) => [6, 7, 8, 9, 10, 11].includes(size))) {
            return false;
          }

          // Prevent duplicate sizes
          return new Set(sizeValues).size === sizeValues.length;
        },
        message:
          "Sizes must contain unique shoe sizes from 6 to 11.",
      },
    },

    newArrival: {
      type: Boolean,
      default: false,
    },

    bestSeller: {
      type: Boolean,
      default: false,
    },

    salesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
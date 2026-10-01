const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: "store",
    },

    storeName: {
      type: String,
      default: "NAMIKOL",
      trim: true,
    },

    storeTagline: {
      type: String,
      default: "Premium Footwear",
      trim: true,
    },

    currency: {
      type: String,
      default: "INR",
      trim: true,
    },

    currencySymbol: {
      type: String,
      default: "₹",
      trim: true,
    },

    allowOrders: {
      type: Boolean,
      default: true,
    },

    supportEmail: {
      type: String,
      default: "support@namikol.com",
      lowercase: true,
      trim: true,
    },

    supportPhone: {
      type: String,
      default: "",
      trim: true,
    },

    supportLocation: {
      type: String,
      default: "Jaipur, Rajasthan, India",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const StoreSettings = mongoose.model(
  "StoreSettings",
  storeSettingsSchema
);

module.exports = StoreSettings;
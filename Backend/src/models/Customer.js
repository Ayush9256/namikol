const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    checkoutActivityAt: { type: Date, default: null },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
        type: String,
        trim: true,
        default: "",
        },

        city: {
        type: String,
        trim: true,
        default: "",
        },

        state: {
        type: String,
        trim: true,
        default: "",
        },

        pincode: {
        type: String,
        trim: true,
        default: "",
        },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Customer", customerSchema);

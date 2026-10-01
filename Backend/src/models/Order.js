const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    cartId: {
      type: String,
      default: "",
    },

    productId: {
      type: String,
      default: "",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    size: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    itemTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const shippingAddressSchema =
  new mongoose.Schema(
    {
      id: {
        type: String,
        default: "",
      },

      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      addressLine: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
      },

      landmark: {
        type: String,
        default: "",
        trim: true,
      },
    },
    { _id: false }
  );

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    customer: {
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
        lowercase: true,
        trim: true,
      },
    },

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) =>
          Array.isArray(items) && items.length > 0,
        message: "Order must contain at least one item.",
      },
    },

    itemCount: {
      type: Number,
      required: true,
      min: 1,
    },

    skuCount: {
      type: Number,
      required: true,
      min: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shipping: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    orderStatus: {
      type: String,
      enum: [
        "Placed",
        "Processing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Placed",
    },

    deliveredAt: {
        type: Date,
        default: null,
        },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refunded",
      ],
      default: "Pending",
    },

    razorpayOrderId: {
        type: String,
        default: "",
        index: true,
        },

        razorpayPaymentId: {
        type: String,
        default: "",
        index: true,
        },

        razorpaySignature: {
        type: String,
        default: "",
        select: false,
        },

        razorpayRefundId: {
          type: String,
          default: "",
        },

    paymentMethod: {
      type: String,
      default: "Pending",
    },

    source: {
      type: String,
      enum: ["cart", "buy_now"],
      default: "cart",
    },

    returnStatus: {
      type: String,
      enum: [
        "Not Requested",
        "Requested",
        "Accepted",
        "Received",
        "Completed",
        "Rejected",
      ],
      default: "Not Requested",
    },

    returnReason: {
      type: String,
      default: "",
      trim: true,
    },

    returnRequestedAt: { type: Date, default: null },
    returnAcceptedAt: { type: Date, default: null },
    returnReceivedAt: { type: Date, default: null },
    returnCompletedAt: { type: Date, default: null },
    returnRejectedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model("Order", orderSchema);
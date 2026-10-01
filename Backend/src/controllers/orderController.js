const Order = require("../models/Order");
const Customer = require("../models/Customer");
const razorpay = require("../config/razorpay");

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `NMK-${timestamp}-${random}`;
};

const createOrder = async (req, res) => {
  try {
    const {
      items,
      itemCount,
      skuCount,
      subtotal,
      shipping,
      total,
      shippingAddress,
      paymentMethod,
      source,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item.",
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required.",
      });
    }

    if (
      !shippingAddress.fullName?.trim() ||
      !shippingAddress.phone?.trim() ||
      !shippingAddress.addressLine?.trim() ||
      !shippingAddress.city?.trim() ||
      !shippingAddress.state?.trim() ||
      !shippingAddress.pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required.",
      });
    }

    // Get the authenticated customer directly from MongoDB.
    const customerRecord = await Customer.findById(req.customer.id).select(
      "firstName lastName email"
    );

    if (!customerRecord) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found.",
      });
    }

    const order = await Order.create({
      customerId: customerRecord._id,

      customer: {
        firstName: customerRecord.firstName,
        lastName: customerRecord.lastName,
        email: customerRecord.email,
      },

      orderNumber: generateOrderNumber(),

      items,

      itemCount: Number(itemCount || 0),

      skuCount: Number(skuCount || items.length),

      subtotal: Number(subtotal || 0),

      shipping: Number(shipping || 0),

      total: Number(total || 0),

      shippingAddress: {
        id: shippingAddress.id || "",

        fullName: shippingAddress.fullName.trim(),

        phone: shippingAddress.phone.trim(),

        addressLine: shippingAddress.addressLine.trim(),

        city: shippingAddress.city.trim(),

        state: shippingAddress.state.trim(),

        pincode: shippingAddress.pincode.trim(),

        landmark: shippingAddress.landmark?.trim() || "",
      },

      paymentMethod: paymentMethod || "Pending",

      source: source === "buy_now" ? "buy_now" : "cart",

      orderStatus: "Placed",

      deliveredAt: null,

      paymentStatus: "Pending",

      returnStatus: "Not Requested",
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create order.",
    });
  }
};

const getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customerId: req.customer.id,
    }).sort({
      createdAt: -1,
    });

    const now = Date.now();
    const returnWindow = 3 * 24 * 60 * 60 * 1000;
    const customerOrders = orders.map((order) => {
      const deliveredAt = order.deliveredAt?.getTime();
      const remaining = deliveredAt
        ? returnWindow - (now - deliveredAt)
        : 0;
      const returnEligible =
        order.orderStatus === "Delivered" &&
        order.returnStatus === "Not Requested" &&
        remaining >= 0;

      return {
        ...order.toObject(),
        returnEligible,
        returnDaysLeft: returnEligible
          ? Math.ceil(remaining / (24 * 60 * 60 * 1000))
          : 0,
      };
    });

    return res.status(200).json({
      success: true,
      orders: customerOrders,
    });
  } catch (error) {
    console.error(
      "Get customer orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load orders.",
    });
  }
};

const getCustomerOrderById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      customerId: req.customer.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get customer order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load order.",
    });
  }
};

const cancelCustomerOrder = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      customerId: req.customer.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      order.orderStatus !== "Placed" &&
      order.orderStatus !== "Processing"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This order can no longer be cancelled.",
      });
    }

    order.orderStatus = "Cancelled";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      order,
    });
  } catch (error) {
    console.error(
      "Cancel customer order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to cancel this order.",
    });
  }
};

const requestCustomerOrderReturn = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      customerId: req.customer.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({
        success: false,
        message:
          "Only delivered orders can be returned.",
      });
    }

    if (order.returnStatus !== "Not Requested") {
      return res.status(400).json({
        success: false,
        message:
          "A return request has already been submitted for this order.",
      });
    }

    if (!order.deliveredAt) {
      return res.status(400).json({
        success: false,
        message:
          "Return window information is unavailable for this order.",
      });
    }

    const deliveredTime =
      new Date(order.deliveredAt).getTime();

    const currentTime = Date.now();

    const threeDays =
      3 * 24 * 60 * 60 * 1000;

    const timePassed =
      currentTime - deliveredTime;

    if (
      timePassed < 0 ||
      timePassed > threeDays
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The 3-day return window has expired.",
      });
    }

    order.returnStatus = "Requested";
    order.returnRequestedAt = new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Return request submitted successfully.",
      order,
    });
  } catch (error) {
    console.error(
      "Request customer return error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to submit return request.",
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Get all orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Placed",
      "Processing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.orderStatus = status;

    if (status === "Delivered") {
      if (!order.deliveredAt) {
        order.deliveredAt = new Date();
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update order status.",
    });
  }
};


const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Paid",
      "Failed",
      "Refunded",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.paymentStatus = status;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      order,
    });
  } catch (error) {
    console.error(
      "Update payment status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update payment status.",
    });
  }
};

const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const allowedTransitions = {
      Requested: ["Accepted", "Rejected"],
      Accepted: ["Received"],
      Received: ["Completed"],
    };

    if (!allowedTransitions[order.returnStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid return status transition.",
      });
    }

    const timestampFields = {
      Accepted: "returnAcceptedAt",
      Received: "returnReceivedAt",
      Rejected: "returnRejectedAt",
    };

    if (status === "Completed") {
      if (
        order.paymentStatus !== "Paid" ||
        order.paymentMethod !== "Razorpay" ||
        !order.razorpayPaymentId
      ) {
        return res.status(400).json({
          success: false,
          message: "A verified Razorpay payment is required to complete this return.",
        });
      }

      const refund = await razorpay.payments.refund(
        order.razorpayPaymentId
      );
      order.paymentStatus = "Refunded";
      order.razorpayRefundId = refund.id;
      order.returnCompletedAt = new Date();
    } else if (timestampFields[status]) {
      order[timestampFields[status]] = new Date();
    }

    order.returnStatus = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Return status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Update return status error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update return status.",
    });
  }
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getCustomerOrderById,
  cancelCustomerOrder,
  requestCustomerOrderReturn,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  updateReturnStatus,
};
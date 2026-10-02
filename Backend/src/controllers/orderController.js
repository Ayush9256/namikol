const Order = require("../models/Order");
const { transitionOrder } = require("../services/orderLifecycle");
const { processRefund } = require("../services/refundService");


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
        remaining >= 0 && remaining <= returnWindow;

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

const cancelCustomerOrder = async (req, res) => {
  try {
    const order = await transitionOrder({ _id: req.params.id, customerId: req.customer.id }, "Cancelled");
    return res.status(200).json({
      success: true,
      message: order.refundStatus === "Completed" ? "Order cancelled and payment refunded." :
        order.refundStatus !== "Not Requested" ? "Order cancelled. Your refund is being processed." : "Order cancelled successfully.",
      order,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Unable to cancel this order." });
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

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, customerId: req.customer.id, orderStatus: "Delivered", returnStatus: "Not Requested" },
      { $set: { returnStatus: "Requested", returnRequestedAt: new Date() } }, { returnDocument: "after" }
    );
    if (!updatedOrder) return res.status(409).json({ success: false, message: "Order changed. Refresh and try again." });

    return res.status(200).json({
      success: true,
      message:
        "Return request submitted successfully.",
      order: updatedOrder,
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
    const order = await transitionOrder({ _id: req.params.id }, req.body.status);
    return res.status(200).json({ success: true, message: "Order status updated successfully.", order });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Unable to update order status." });
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

    if (order.paymentMethod === "Razorpay") {
      return res.status(409).json({ success: false, message: "Razorpay payment status is managed by verified payments and refunds." });
    }
    const transitions = { Pending: ["Paid", "Failed"], Failed: ["Pending"], Paid: [], Refunded: [] };
    if (order.paymentStatus !== status && !transitions[order.paymentStatus]?.includes(status)) {
      return res.status(409).json({ success: false, message: "Invalid payment status transition." });
    }
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: order.paymentStatus },
      { $set: { paymentStatus: status } }, { returnDocument: "after", runValidators: true }
    );
    if (!updated) return res.status(409).json({ success: false, message: "Order changed. Refresh and try again." });


    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      order: updated,
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
    const order = await transitionOrder({ _id: req.params.id }, req.body.status, "return");
    return res.status(200).json({ success: true, message: order.refundStatus === "Completed" ? "Return completed and payment refunded." : "Return updated. Any requested refund is being processed.", order });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Unable to update return status." });
  }
};

const reconcileOrderRefund = async (req, res) => {
  const order = await processRefund(Order, req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });
  return res.status(200).json({ success: true, message: "Refund status checked.", order });
};

module.exports = {
  reconcileOrderRefund,
  getCustomerOrders,
  getCustomerOrderById,
  cancelCustomerOrder,
  requestCustomerOrderReturn,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  updateReturnStatus,
};
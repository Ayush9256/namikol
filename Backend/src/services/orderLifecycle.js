const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { processRefund } = require("./refundService");

const ORDER_TRANSITIONS = {
  Placed: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Out for Delivery", "Delivered"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
};
const RETURN_TRANSITIONS = { Requested: ["Accepted", "Rejected"], Accepted: ["Received"], Received: ["Completed"] };
const failure = (status, message) => Object.assign(new Error(message), { status });

async function restoreInventory(order, session) {
  if (order.inventoryRestoredAt || !order.razorpayPaymentId) return;
  for (const item of order.items) {
    const size = Number(item.size);
    const quantity = Number(item.quantity);
    if (!mongoose.isValidObjectId(item.productId) || !Number.isInteger(quantity) || quantity <= 0 || ![6, 7, 8, 9, 10, 11].includes(size)) {
      throw failure(409, "Order inventory data needs review before restocking.");
    }
    const result = await Product.updateOne(
      { _id: item.productId, "sizes.size": size },
      { $inc: { "sizes.$.stock": quantity } }, { session }
    );
    if (!result.matchedCount) {
      // Restore an inventory size removed by an admin. Deleted products stay deleted.
      await Product.updateOne(
        { _id: item.productId, "sizes.size": { $ne: size } },
        { $push: { sizes: { size, stock: quantity } } }, { session }
      );
    }
  }
  order.inventoryRestoredAt = new Date();
}

function queueRefund(order, purpose) {
  if (order.paymentStatus === "Refunded") return;
  if (order.paymentStatus !== "Paid") {
    if (purpose === "Return") throw failure(409, "A paid order is required for a refund.");
    return;
  }
  if (order.paymentMethod !== "Razorpay" || !order.razorpayPaymentId) {
    throw failure(409, "A verified Razorpay payment is required for an automatic refund.");
  }
  if (!order.refundStatus || order.refundStatus === "Not Requested") {
    order.refundStatus = "Pending";
    order.refundPurpose = purpose;
    order.refundRequestedAt = new Date();
  }
}

async function transitionOrder(filter, status, type = "order") {
  const session = await mongoose.startSession();
  let id;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne(filter).session(session);
      if (!order) throw failure(404, "Order not found.");
      id = order._id;
      const field = type === "return" ? "returnStatus" : "orderStatus";
      // Repeating cancellation/return completion retries refund reconciliation.
      if (order[field] === status) {
        if (type === "order" && status === "Cancelled") {
          queueRefund(order, "Cancellation");
          await restoreInventory(order, session);
          await order.save({ session });
        } else if (type === "return" && ["Received", "Completed"].includes(status)) {
          await restoreInventory(order, session);
          await order.save({ session });
        }
        return;
      }
      const transitions = type === "return" ? RETURN_TRANSITIONS : ORDER_TRANSITIONS;
      if (!transitions[order[field]]?.includes(status)) throw failure(409, `Invalid ${type} status transition.`);
      if (type === "return" && order.orderStatus !== "Delivered") throw failure(409, "Only delivered orders can be returned.");
      if (type === "order" && status === "Cancelled") {
        queueRefund(order, "Cancellation");
        await restoreInventory(order, session);
      }
      if (type === "return" && status === "Received") await restoreInventory(order, session);
      if (type === "return" && status === "Completed") {
        queueRefund(order, "Return");
        await restoreInventory(order, session);
        // Keep Received until the gateway confirms completion.
        if (order.paymentStatus !== "Refunded") {
          await order.save({ session });
          return;
        }
      }
      order[field] = status;
      const timestampFields = {
        Delivered: "deliveredAt", Accepted: "returnAcceptedAt", Received: "returnReceivedAt",
        Rejected: "returnRejectedAt", Completed: "returnCompletedAt",
      };
      if (timestampFields[status] && !order[timestampFields[status]]) order[timestampFields[status]] = new Date();
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }
  return processRefund(Order, id);
}

module.exports = { transitionOrder, restoreInventory, ORDER_TRANSITIONS, RETURN_TRANSITIONS };

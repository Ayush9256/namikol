const mongoose = require("mongoose");
const Order = require("../models/Order");
const PaymentIntent = require("../models/PaymentIntent");
const { processRefund } = require("./refundService");

async function refundUnfulfilledPayment(intent, paymentId, purpose) {
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      order = await Order.findOne({ razorpayOrderId: intent.razorpayOrderId, customerId: intent.customerId }).session(session);
      if (order) return;
      await PaymentIntent.updateOne(
        { _id: intent._id, status: { $in: ["Created", "Expired"] } },
        { $set: { status: "Failed", razorpayPaymentId: paymentId, refundStatus: "Pending", refundPurpose: purpose, refundRequestedAt: new Date() } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  if (order) return { order };
  return { intent: await processRefund(PaymentIntent, intent._id) };
}

module.exports = refundUnfulfilledPayment;

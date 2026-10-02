const crypto = require("node:crypto");
const PaymentIntent = require("../models/PaymentIntent");
const razorpay = require("../config/razorpay");

async function recoverCapturedPayments() {
  const now = Date.now();
  const intents = await PaymentIntent.find({
    status: { $in: ["Created", "Expired"] },
    createdAt: { $lt: new Date(now - 60_000), $gt: new Date(now - 7 * 24 * 60 * 60 * 1000) },
    $or: [{ paymentCheckedAt: null }, { paymentCheckedAt: { $lt: new Date(now - 5 * 60_000) } }],
  }).sort({ paymentCheckedAt: 1 }).limit(20);
  const { verifyRazorpayPayment } = require("../controllers/paymentController");
  for (const intent of intents) {
    try {
      await PaymentIntent.updateOne({ _id: intent._id }, { $set: { paymentCheckedAt: new Date() } });
      const payments = await razorpay.orders.fetchPayments(intent.razorpayOrderId);
      const payment = payments.items?.find((item) => item.status === "captured");
      if (!payment) {
        if (intent.expiresAt.getTime() < now) {
          await PaymentIntent.updateOne({ _id: intent._id, status: "Created" }, { $set: { status: "Expired" } });
        }
        continue;
      }
      const signature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${intent.razorpayOrderId}|${payment.id}`).digest("hex");
      // Only provider-confirmed captured payments reach the shared verifier.
      await verifyRazorpayPayment({
        customer: { id: String(intent.customerId) },
        body: { razorpay_order_id: intent.razorpayOrderId, razorpay_payment_id: payment.id, razorpay_signature: signature, paymentIntentId: String(intent._id) },
      }, { status() { return this; }, json(data) { return data; } });
    } catch (error) {
      console.error("Payment recovery failed:", error.code || error.name || "GatewayError");
    }
  }
}

module.exports = recoverCapturedPayments;

const Order = require("../models/Order");
const PaymentIntent = require("../models/PaymentIntent");
const { processRefund, ACTIVE_REFUNDS } = require("./refundService");
const recoverCapturedPayments = require("./paymentRecovery");

function startRefundWorker() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await recoverCapturedPayments();
      for (const Model of [Order, PaymentIntent]) {
        const records = await Model.find({ refundStatus: { $in: ACTIVE_REFUNDS } })
          .sort({ updatedAt: 1 }).limit(20).select("_id");
        for (const record of records) await processRefund(Model, record._id);
      }
    } catch (error) {
      console.error("Refund worker failed:", error.name);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(tick, 60_000);
  timer.unref();
  return () => clearInterval(timer);
}

module.exports = startRefundWorker;

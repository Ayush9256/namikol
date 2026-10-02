const razorpay = require("../config/razorpay");

const ACTIVE_REFUNDS = ["Pending", "Processing", "Submitted", "Review Required"];

// Persist the claim before contacting the gateway. A timeout is ambiguous:
// reconcile it by reading the gateway, never by issuing another refund.
async function processRefund(Model, id) {
  let record = await Model.findById(id);
  if (!record || !ACTIVE_REFUNDS.includes(record.refundStatus)) return record;
  if (!record.razorpayPaymentId) return record;

  let claimed = false;
  let requestSent = false;
  try {
    if (record.refundStatus === "Pending") {
      const claim = await Model.findOneAndUpdate(
        { _id: id, refundStatus: "Pending" },
        { $set: { refundStatus: "Processing" } },
        { returnDocument: "after" }
      );
      if (!claim) return Model.findById(id);
      record = claim;
      claimed = true;
    }

    const amount = Math.round(Number(record.total) * 100);
    let refund;
    if (record.razorpayRefundId) {
      refund = await razorpay.payments.fetchRefund(record.razorpayPaymentId, record.razorpayRefundId);
    } else {
      const refunds = await razorpay.payments.fetchMultipleRefund(record.razorpayPaymentId, { count: 100 });
      refund = refunds.items?.find((item) =>
        Number(item.amount) === amount && item.status !== "failed"
      );
      if (!refund && claimed) {
        // Partial/failed refunds need support review rather than a second full refund.
        if (refunds.items?.length || Number(refunds.count) > 0) {
          await Model.updateOne({ _id: id, refundStatus: "Processing" }, { $set: { refundStatus: "Review Required" } });
          return Model.findById(id);
        }
        requestSent = true;
        refund = await razorpay.payments.refund(record.razorpayPaymentId, {
          amount,
          receipt: `nmk_${id}`,
          notes: { recordId: String(id), purpose: record.refundPurpose },
        });
      }
    }

    if (!refund) {
      await Model.updateOne({ _id: id, refundStatus: "Processing" }, { $set: { refundStatus: "Review Required" } });
      return Model.findById(id);
    }
    if (
      !refund.id || refund.payment_id !== record.razorpayPaymentId ||
      Number(refund.amount) !== amount || !["processed", "pending"].includes(refund.status)
    ) {
      await Model.updateOne({ _id: id, refundStatus: { $in: ACTIVE_REFUNDS } }, { $set: { refundStatus: "Review Required" } });
      return Model.findById(id);
    }

    const completed = refund.status === "processed";
    const updates = {
      razorpayRefundId: refund.id,
      refundStatus: completed ? "Completed" : "Submitted",
      refundSubmittedAt: record.refundSubmittedAt || new Date(),
    };
    if (completed) {
      updates.refundCompletedAt = new Date();
      if (Model.modelName === "Order") {
        updates.paymentStatus = "Refunded";
        if (record.refundPurpose === "Return") {
          updates.returnStatus = "Completed";
          updates.returnCompletedAt = new Date();
        }
      }
    }
    await Model.updateOne({ _id: id, refundStatus: { $in: ACTIVE_REFUNDS } }, { $set: updates });
  } catch (error) {
    // A read failure before the POST is safe to retry. Once POST starts,
    // preserve the uncertain result for reconciliation, even if DB save fails.
    if (claimed) {
      await Model.updateOne(
        { _id: id, refundStatus: "Processing" },
        { $set: { refundStatus: requestSent ? "Review Required" : "Pending" } }
      ).catch(() => {});
    }
    console.error("Refund reconciliation failed:", error.name || "GatewayError");
  }
  return Model.findById(id);
}

module.exports = { processRefund, ACTIVE_REFUNDS };

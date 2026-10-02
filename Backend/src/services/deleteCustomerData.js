const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const PaymentIntent = require("../models/PaymentIntent");
const { ACTIVE_REFUNDS } = require("./refundService");

async function deleteCustomerData(customerId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const pendingOrder = await Order.exists({ customerId, $or: [
        { orderStatus: { $in: ["Placed", "Processing", "Shipped", "Out for Delivery"] } },
        { returnStatus: { $in: ["Requested", "Accepted", "Received"] } },
        { refundStatus: { $in: ACTIVE_REFUNDS } },
      ] }).session(session);
      const pendingPayment = await PaymentIntent.exists({ customerId, $or: [
        { status: "Created", expiresAt: { $gt: new Date() } },
        { refundStatus: { $in: ACTIVE_REFUNDS } },
      ] }).session(session);
      if (pendingOrder || pendingPayment) {
        throw Object.assign(new Error("Complete or cancel outstanding orders, checkout sessions, returns, and refunds before deleting this account."), { status: 409 });
      }
      const redactedAddress = { id: "", fullName: "Deleted Customer", phone: "Redacted", addressLine: "Redacted", city: "Redacted", state: "Redacted", pincode: "000000", landmark: "" };
      for (const name of ["Address", "Cart", "Wishlist", "EmailVerification", "CustomerPasswordReset"]) {
        await require(`../models/${name}`).deleteMany({ customerId }, { session });
      }
      // Preserve payment IDs and snapshots needed to refund a delayed capture.
      await PaymentIntent.updateMany({ customerId }, { $set: { shippingAddress: redactedAddress } }, { session });
      await Order.updateMany({ customerId }, { $set: {
        customer: { firstName: "Deleted", lastName: "Customer", email: `deleted-${customerId}@privacy.invalid` },
        shippingAddress: redactedAddress, returnReason: "",
      } }, { session });
      await Customer.deleteOne({ _id: customerId, role: "customer" }, { session });
    });
  } finally {
    await session.endSession();
  }
}

module.exports = deleteCustomerData;

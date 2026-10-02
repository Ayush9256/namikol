const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Order = require("../src/models/Order");
const Product = require("../src/models/Product");
const { transitionOrder } = require("../src/services/orderLifecycle");
const { processRefund } = require("../src/services/refundService");
const razorpay = require("../src/config/razorpay");

const orderId = "507f1f77bcf86cd799439011";
const productId = "507f1f77bcf86cd799439012";
const matches = (record, filter) => Object.entries(filter).every(([key, value]) => {
  if (value && typeof value === "object" && "$in" in value) return value.$in.includes(record[key]);
  return String(record[key]) === String(value);
});

function setup(t, overrides = {}) {
  let state = {
    order: {
      _id: orderId, customerId: "customer", orderStatus: "Placed", paymentStatus: "Paid",
      paymentMethod: "Razorpay", razorpayPaymentId: "pay_test", total: 100,
      refundStatus: "Not Requested", returnStatus: "Not Requested",
      items: [{ productId, size: "8", quantity: 2 }], ...overrides,
    },
    stock: 5,
  };
  const clone = (value) => structuredClone(value);
  const document = () => ({ ...clone(state.order), async save() {
    const { save, ...data } = this;
    void save;
    state.order = clone(data);
  } });
  let lock = Promise.resolve();
  t.mock.method(mongoose, "startSession", async () => ({
    async withTransaction(callback) {
      const previous = lock;
      let unlock;
      lock = new Promise((resolve) => { unlock = resolve; });
      await previous;
      const snapshot = clone(state);
      try { await callback(); } catch (error) { state = snapshot; throw error; }
      finally { unlock(); }
    },
    async endSession() {},
  }));
  t.mock.method(Order, "findOne", (filter) => ({ session: async () => matches(state.order, filter) ? document() : null }));
  t.mock.method(Order, "findById", async () => document());
  t.mock.method(Order, "findOneAndUpdate", async (filter, update) => {
    if (!matches(state.order, filter)) return null;
    Object.assign(state.order, update.$set);
    return document();
  });
  t.mock.method(Order, "updateOne", async (filter, update) => {
    if (!matches(state.order, filter)) return { modifiedCount: 0 };
    Object.assign(state.order, update.$set);
    return { modifiedCount: 1 };
  });
  t.mock.method(Product, "updateOne", async (_filter, update) => {
    state.stock += update.$inc?.["sizes.$.stock"] || 0;
    return { matchedCount: 1 };
  });
  for (const key of ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]) {
    const old = process.env[key];
    process.env[key] = "test_value";
    t.after(() => { if (old === undefined) delete process.env[key]; else process.env[key] = old; });
  }
  const refund = { id: "rfnd_test", payment_id: "pay_test", amount: 10000, status: "processed" };
  const post = t.mock.method(razorpay.payments, "refund", async () => refund);
  const list = t.mock.method(razorpay.payments, "fetchMultipleRefund", async () => ({ items: [], count: 0 }));
  const fetch = t.mock.method(razorpay.payments, "fetchRefund", async () => refund);
  return { state: () => state, post, list, fetch, refund };
}

test("concurrent and repeated cancellation restocks and refunds once", async (t) => {
  const db = setup(t);
  await Promise.all([
    transitionOrder({ _id: orderId, customerId: "customer" }, "Cancelled"),
    transitionOrder({ _id: orderId, customerId: "customer" }, "Cancelled"),
  ]);
  await transitionOrder({ _id: orderId }, "Cancelled");
  assert.equal(db.state().stock, 7);
  assert.equal(db.post.mock.callCount(), 1);
  assert.equal(db.state().order.orderStatus, "Cancelled");
  assert.equal(db.state().order.paymentStatus, "Refunded");
  assert.ok(db.state().order.inventoryRestoredAt);
});

test("failed restock rolls back cancellation and never calls the refund gateway", async (t) => {
  const db = setup(t);
  t.mock.method(Product, "updateOne", async () => { throw new Error("inventory write failed"); });
  await assert.rejects(transitionOrder({ _id: orderId }, "Cancelled"), /inventory write failed/);
  assert.equal(db.state().stock, 5);
  assert.equal(db.state().order.orderStatus, "Placed");
  assert.equal(db.state().order.refundStatus, "Not Requested");
  assert.equal(db.post.mock.callCount(), 0);
});

test("delivered and cancelled orders cannot move backwards or be cancelled after delivery", async (t) => {
  const db = setup(t, { orderStatus: "Delivered" });
  for (const status of ["Placed", "Processing", "Cancelled"]) {
    await assert.rejects(transitionOrder({ _id: orderId }, status), { status: 409 });
  }
  assert.equal(db.state().stock, 5);
  assert.equal(db.post.mock.callCount(), 0);
});

test("received return restocks once and completes only after processed gateway refund", async (t) => {
  const db = setup(t, { orderStatus: "Delivered", returnStatus: "Accepted" });
  await transitionOrder({ _id: orderId }, "Received", "return");
  await transitionOrder({ _id: orderId }, "Received", "return");
  db.post.mock.mockImplementation(async () => ({ ...db.refund, status: "pending" }));
  const pending = await transitionOrder({ _id: orderId }, "Completed", "return");
  assert.equal(pending.returnStatus, "Received");
  assert.equal(pending.paymentStatus, "Paid");
  assert.equal(pending.refundStatus, "Submitted");
  const completed = await processRefund(Order, orderId);
  assert.equal(completed.returnStatus, "Completed");
  assert.equal(completed.paymentStatus, "Refunded");
  assert.equal(db.state().stock, 7);
  assert.equal(db.post.mock.callCount(), 1);
});

test("timeout after refund POST reconciles without sending a second refund", async (t) => {
  const db = setup(t);
  t.mock.method(console, "error", () => {});
  db.post.mock.mockImplementation(async () => { throw new Error("gateway timeout"); });
  await transitionOrder({ _id: orderId }, "Cancelled");
  assert.equal(db.state().order.refundStatus, "Review Required");
  await processRefund(Order, orderId);
  assert.equal(db.post.mock.callCount(), 1);
  db.list.mock.mockImplementation(async () => ({ items: [db.refund], count: 1 }));
  const recovered = await processRefund(Order, orderId);
  assert.equal(recovered.refundStatus, "Completed");
  assert.equal(db.post.mock.callCount(), 1);
  assert.equal(db.state().stock, 7);
});

test("gateway read failure before refund submission remains safely retryable", async (t) => {
  const db = setup(t);
  t.mock.method(console, "error", () => {});
  db.list.mock.mockImplementationOnce(async () => { throw new Error("read timeout"); });
  await transitionOrder({ _id: orderId }, "Cancelled");
  assert.equal(db.state().order.refundStatus, "Pending");
  assert.equal(db.post.mock.callCount(), 0);
  await processRefund(Order, orderId);
  assert.equal(db.state().order.refundStatus, "Completed");
  assert.equal(db.post.mock.callCount(), 1);
});

test("partial gateway refunds require review instead of a duplicate full refund", async (t) => {
  const db = setup(t);
  db.list.mock.mockImplementation(async () => ({ items: [{ ...db.refund, amount: 5000 }], count: 1 }));
  await transitionOrder({ _id: orderId }, "Cancelled");
  assert.equal(db.state().order.refundStatus, "Review Required");
  assert.equal(db.post.mock.callCount(), 0);
});

test("customer ownership is required before inventory or refunds change", async (t) => {
  const db = setup(t);
  await assert.rejects(transitionOrder({ _id: orderId, customerId: "another_customer" }, "Cancelled"), { status: 404 });
  assert.equal(db.state().stock, 5);
  assert.equal(db.post.mock.callCount(), 0);
});

const { test } = require("node:test");
const assert = require("node:assert/strict");

test("API starts without payment credentials and returns JSON errors", async () => {
  const app = require("../src/app");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const root = await fetch(base);
    assert.equal(root.status, 200);
    assert.equal((await root.json()).success, true);
    const missing = await fetch(`${base}/api/missing`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).success, false);
    const malformed = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).success, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("checkout rejects malformed addresses and items before database access", async () => {
  const { createRazorpayOrder } = require("../src/controllers/paymentController");
  const address = Object.fromEntries(
    ["fullName", "phone", "addressLine", "city", "state", "pincode"].map((key) => [key, "value"])
  );
  for (const body of [
    { items: [null], shippingAddress: address },
    { items: [{}], shippingAddress: { ...address, fullName: 123 } },
    { items: [{}], shippingAddress: { ...address, landmark: {} } },
  ]) {
    let status;
    const res = { status(code) { status = code; return this; }, json(data) { return data; } };
    const result = await createRazorpayOrder({ body }, res);
    assert.equal(status, 400);
    assert.equal(result.success, false);
  }
});

test("payment verification rejects uncaptured or mismatched payments", async (t) => {
  const crypto = require("node:crypto");
  for (const [key, value] of Object.entries({ RAZORPAY_KEY_ID: "test_key", RAZORPAY_KEY_SECRET: "test_secret" })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
  const razorpay = require("../src/config/razorpay");
  const PaymentIntent = require("../src/models/PaymentIntent");
  const { verifyRazorpayPayment } = require("../src/controllers/paymentController");
  t.mock.method(razorpay.orders, "fetch", async () => ({ id: "order_test", amount: 10000, currency: "INR" }));
  t.mock.method(PaymentIntent, "findOne", async () => ({
    customerId: "customer_test", razorpayOrderId: "order_test", status: "Created", total: 100,
  }));
  const signature = crypto.createHmac("sha256", "test_secret").update("order_test|pay_test").digest("hex");
  for (const overrides of [
    { status: "authorized" }, { amount: 1 }, { order_id: "order_other" }, { currency: "USD" },
  ]) {
    const mock = t.mock.method(razorpay.payments, "fetch", async () => ({
      order_id: "order_test", status: "captured", amount: 10000, currency: "INR", ...overrides,
    }));
    let status;
    const res = { status(code) { status = code; return this; }, json(data) { return data; } };
    const result = await verifyRazorpayPayment({
      customer: { id: "customer_test" },
      body: { razorpay_order_id: "order_test", razorpay_payment_id: "pay_test", razorpay_signature: signature },
    }, res);
    assert.equal(status, 400);
    assert.equal(result.success, false);
    mock.mock.restore();
  }
});

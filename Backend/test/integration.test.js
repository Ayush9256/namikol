const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

test("API integration against an isolated temporary MongoDB database", { skip: process.env.RUN_DB_TESTS !== "1" }, async (t) => {
  require("dotenv").config({ quiet: true });
  const mongoose = require("mongoose");
  const databaseName = `nmk_test_${crypto.randomBytes(12).toString("hex")}`;
  assert.match(databaseName, /^nmk_test_[a-f0-9]{24}$/);
  await mongoose.connect(process.env.MONGODB_URI, { dbName: databaseName, serverSelectionTimeoutMS: 10000 });
  t.after(async () => {
    // The explicit dbName override is mandatory. Never drop the configured application DB.
    assert.equal(mongoose.connection.db.databaseName, databaseName);
    assert.match(mongoose.connection.db.databaseName, /^nmk_test_[a-f0-9]{24}$/);
    try { await mongoose.connection.db.dropDatabase(); } finally { await mongoose.disconnect(); }
  });

  const razorpay = require("../src/config/razorpay");
  const email = require("../src/services/emailService");
  const cloudinary = require("../src/config/cloudinary");
  const { Writable } = require("node:stream");
  const emailMock = t.mock.method(email, "sendEmail", async () => ({ messageId: "test_email" }));
  t.mock.method(cloudinary.uploader, "upload_stream", (_options, callback) => new Writable({
    write(_chunk, _encoding, next) { next(); },
    final(next) { callback(null, { secure_url: "https://example.com/test-shoe.png" }); next(); },
  }));
  const gatewayOrders = new Map();
  const gatewayRefunds = new Map();
  let number = 0;
  t.mock.method(razorpay.orders, "create", async (options) => {
    const order = { ...options, id: `order_test_${++number}` };
    gatewayOrders.set(order.id, order);
    return order;
  });
  t.mock.method(razorpay.orders, "fetch", async (id) => gatewayOrders.get(id));
  t.mock.method(razorpay.orders, "fetchPayments", async (id) => ({ items: [{ id: id.replace("order_", "pay_"), status: "captured" }] }));
  t.mock.method(razorpay.payments, "fetch", async (id) => {
    const order = gatewayOrders.get(id.replace("pay_", "order_"));
    return { id, order_id: order.id, amount: order.amount, currency: "INR", status: "captured" };
  });
  const refundMock = t.mock.method(razorpay.payments, "refund", async (id, options) => {
    const refund = { id: `rfnd_test_${id}`, payment_id: id, amount: options.amount, status: "processed" };
    gatewayRefunds.set(id, refund);
    return refund;
  });
  t.mock.method(razorpay.payments, "fetchMultipleRefund", async (id) => ({ items: gatewayRefunds.has(id) ? [gatewayRefunds.get(id)] : [], count: gatewayRefunds.has(id) ? 1 : 0 }));
  t.mock.method(razorpay.payments, "fetchRefund", async (id) => gatewayRefunds.get(id));

  const app = require("../src/app");
  const prepareDatabase = require("../src/config/prepareDatabase");
  const Customer = require("../src/models/Customer");
  const Admin = require("../src/models/Admin");
  const Product = require("../src/models/Product");
  const Order = require("../src/models/Order");
  const PaymentIntent = require("../src/models/PaymentIntent");
  const StoreSettings = require("../src/models/StoreSettings");
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");
  await PaymentIntent.createCollection();
  await PaymentIntent.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await prepareDatabase();
  for (const Model of [Customer, Admin, Product, Order]) await Model.init();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let token;
  let customerId;
  let adminCookie;
  let product;
  let shippingAddress;
  let verifiedOrder;

  async function request(path, { method = "GET", body, admin = false, form } = {}) {
    const headers = {};
    if (token && !admin) headers.Authorization = `Bearer ${token}`;
    if (adminCookie && admin) headers.Cookie = adminCookie;
    if (body) headers["Content-Type"] = "application/json";
    const response = await fetch(`${base}${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
    const data = await response.json();
    return { status: response.status, data, headers: response.headers };
  }

  await t.test("startup removes only the obsolete payment TTL index", async () => {
    const indexes = await PaymentIntent.collection.indexes();
    assert.ok(indexes.some((index) => index.key.expiresAt === 1));
    assert.ok(!indexes.some((index) => index.expireAfterSeconds !== undefined));
  });

  await t.test("customer registration, login, and admin session use actual database records", async () => {
    const registered = await request("/auth/register", { method: "POST", body: { firstName: "Test", lastName: "Customer", email: "test@example.com", password: "TestPassword123!" } });
    assert.equal(registered.status, 201);
    customerId = registered.data.customer.id;
    const login = await request("/auth/login", { method: "POST", body: { email: "test@example.com", password: "TestPassword123!" } });
    assert.equal(login.status, 200);
    token = login.data.token;
    const admin = await Admin.create({ name: "Test Admin", email: "admin@example.com", password: await bcrypt.hash("TestPassword123!", 4) });
    const adminLogin = await request("/admin/auth/login", { method: "POST", body: { email: admin.email, password: "TestPassword123!" } });
    assert.equal(adminLogin.status, 200);
    adminCookie = adminLogin.headers.get("set-cookie").split(";")[0];
    const me = await request("/admin/auth/me", { admin: true });
    assert.equal(me.status, 200);
    const wrong = await request("/auth/login", { method: "POST", body: { email: "test@example.com", password: "wrong" } });
    assert.equal(wrong.status, 401);
    assert.equal(jwt.verify(token, process.env.JWT_SECRET).id, customerId);
  });

  await t.test("product image upload, addresses, cart, and wishlist work through HTTP", async () => {
    const form = new FormData();
    for (const [key, value] of Object.entries({ name: "Test Shoe", price: "100", deliveryCharge: "10", category: "formal", gender: "men", sizes: JSON.stringify([{ size: 8, stock: 30 }]) })) form.set(key, value);
    form.set("image", new Blob(["test-image"], { type: "image/png" }), "test.png");
    const created = await request("/products", { method: "POST", admin: true, form });
    assert.equal(created.status, 201);
    product = created.data.product;
    assert.equal(product.image, "https://example.com/test-shoe.png");
    const address = await request("/customer/addresses", { method: "POST", body: { fullName: "Test Customer", phone: "9876543210", addressLine: "Test Street", city: "Jaipur", state: "Rajasthan", pincode: "302001", isDefault: true } });
    assert.equal(address.status, 201);
    shippingAddress = address.data.address;
    const cart = await request("/cart/items", { method: "POST", body: { productId: product._id, size: "8", quantity: 2 } });
    assert.equal(cart.status, 200);
    assert.equal(cart.data.cart.items[0].quantity, 2);
    const tooMany = await request("/cart/items", { method: "POST", body: { productId: product._id, size: "8", quantity: 19 } });
    assert.equal(tooMany.status, 400);
    const wished = await request(`/wishlist/products/${product._id}`, { method: "POST" });
    assert.equal(wished.status, 200);
  });

  async function checkout() {
    const created = await request("/payment/create-order", { method: "POST", body: {
      items: [{ productId: product._id, size: "8", quantity: 2 }], shippingAddress,
      subtotal: 1, total: 1,
    } });
    assert.equal(created.status, 201);
    assert.equal(created.data.order.amount, 22000);
    const id = created.data.order.id;
    const paymentId = id.replace("order_", "pay_");
    const body = {
      razorpay_order_id: id, razorpay_payment_id: paymentId,
      razorpay_signature: crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${id}|${paymentId}`).digest("hex"),
      paymentIntentId: created.data.paymentIntentId,
    };
    return { created, body };
  }

  await t.test("expired snapshot verifies and concurrent verification deducts stock once", async () => {
    const { created, body } = await checkout();
    await PaymentIntent.updateOne({ _id: created.data.paymentIntentId }, { $set: { expiresAt: new Date(Date.now() - 3600000) } });
    const responses = await Promise.all([
      request("/payment/verify", { method: "POST", body }),
      request("/payment/verify", { method: "POST", body }),
    ]);
    assert.ok(responses.every((response) => [200, 201].includes(response.status)));
    assert.equal(await Order.countDocuments(), 1);
    assert.equal((await Product.findById(product._id)).sizes[0].stock, 28);
    verifiedOrder = responses[0].data.order;
    assert.equal(verifiedOrder.total, 220);
  });

  await t.test("concurrent cancellation restores stock and submits one refund", async () => {
    const before = refundMock.mock.callCount();
    const responses = await Promise.all([
      request(`/orders/${verifiedOrder._id}/cancel`, { method: "PATCH" }),
      request(`/orders/${verifiedOrder._id}/cancel`, { method: "PATCH" }),
    ]);
    assert.ok(responses.every((response) => response.status === 200));
    assert.equal((await Product.findById(product._id)).sizes[0].stock, 30);
    const order = await Order.findById(verifiedOrder._id);
    assert.equal(order.orderStatus, "Cancelled");
    assert.equal(order.paymentStatus, "Refunded");
    assert.equal(refundMock.mock.callCount() - before, 1);
    const reopen = await request(`/orders/${verifiedOrder._id}/status`, { method: "PATCH", admin: true, body: { status: "Placed" } });
    assert.equal(reopen.status, 409);
  });

  await t.test("admin delivery, customer return, receipt, and refund follow the lifecycle", async () => {
    const { body } = await checkout();
    const paid = await request("/payment/verify", { method: "POST", body });
    const id = paid.data.order._id;
    for (const status of ["Processing", "Shipped", "Delivered"]) {
      const changed = await request(`/orders/${id}/status`, { method: "PATCH", admin: true, body: { status } });
      assert.equal(changed.status, 200);
    }
    const requested = await request(`/orders/${id}/return`, { method: "PATCH" });
    assert.equal(requested.status, 200);
    for (const status of ["Accepted", "Received", "Completed"]) {
      const changed = await request(`/orders/${id}/return-status`, { method: "PATCH", admin: true, body: { status } });
      assert.equal(changed.status, 200);
    }
    const order = await Order.findById(id);
    assert.equal(order.returnStatus, "Completed");
    assert.equal(order.paymentStatus, "Refunded");
    assert.equal((await Product.findById(product._id)).sizes[0].stock, 30);
  });

  await t.test("sold-out payment is refunded once and cannot create a business order", async () => {
    const { created, body } = await checkout();
    await Product.updateOne({ _id: product._id }, { $set: { "sizes.0.stock": 0 } });
    const before = refundMock.mock.callCount();
    const responses = await Promise.all([
      request("/payment/verify", { method: "POST", body }),
      request("/payment/verify", { method: "POST", body }),
    ]);
    assert.ok(responses.every((response) => response.status === 409));
    assert.equal(refundMock.mock.callCount() - before, 1);
    assert.equal(await Order.countDocuments({ razorpayOrderId: created.data.order.id }), 0);
    const intent = await PaymentIntent.findById(created.data.paymentIntentId);
    assert.equal(intent.status, "Failed");
    assert.equal(intent.refundStatus, "Completed");
    await Product.updateOne({ _id: product._id }, { $set: { "sizes.0.stock": 30 } });
  });

  await t.test("store pause blocks checkout before any gateway order is created", async () => {
    await StoreSettings.findOneAndUpdate({ key: "store" }, { $set: { allowOrders: false } }, { upsert: true });
    const before = number;
    const response = await request("/payment/create-order", { method: "POST", body: { items: [{ productId: product._id, size: "8", quantity: 1 }], shippingAddress } });
    assert.equal(response.status, 409);
    assert.equal(number, before);
    await StoreSettings.updateOne({ key: "store" }, { $set: { allowOrders: true } });
  });

  await t.test("background recovery finalizes a captured payment after the browser closes", async () => {
    const { created } = await checkout();
    await PaymentIntent.collection.updateOne({ _id: new mongoose.Types.ObjectId(created.data.paymentIntentId) }, { $set: { createdAt: new Date(Date.now() - 120000), expiresAt: new Date(Date.now() - 60000) } });
    await require("../src/services/paymentRecovery")();
    const order = await Order.findOne({ razorpayOrderId: created.data.order.id });
    assert.ok(order);
    assert.equal(order.paymentStatus, "Paid");
    assert.equal((await Product.findById(product._id)).sizes[0].stock, 28);
    const deletion = await request("/customer/account", { method: "DELETE", body: { password: "TestPassword123!" } });
    assert.equal(deletion.status, 409);
    assert.ok(await Customer.findById(customerId));
    const cancelled = await request(`/orders/${order._id}/cancel`, { method: "PATCH" });
    assert.equal(cancelled.status, 200);
  });

  await t.test("malformed address, profile, admin login, and ID return HTTP 400", async () => {
    const badAddress = await request("/customer/addresses", { method: "POST", body: { ...shippingAddress, fullName: 123 } });
    assert.equal(badAddress.status, 400);
    const badProfile = await request("/customer/profile", { method: "PATCH", body: { firstName: 123, lastName: "Test" } });
    assert.equal(badProfile.status, 400);
    const badAdmin = await request("/admin/auth/login", { method: "POST", body: { email: 123, password: "test" } });
    assert.equal(badAdmin.status, 400);
    assert.equal((await request("/orders/invalid")).status, 400);
    assert.equal((await request("/customer/addresses/invalid", { method: "DELETE" })).status, 400);
  });

  await t.test("password recovery calls mocked email transport without sending real mail", async () => {
    const response = await request("/auth/forgot-password", { method: "POST", body: { email: "test@example.com" } });
    assert.equal(response.status, 200);
    assert.ok(emailMock.mock.callCount() > 0);
  });

  await t.test("account deletion preserves payment records and refunds a delayed capture", async () => {
    const { created } = await checkout();
    const id = new mongoose.Types.ObjectId(created.data.paymentIntentId);
    await PaymentIntent.collection.updateOne({ _id: id }, { $set: { createdAt: new Date(Date.now() - 120000), expiresAt: new Date(Date.now() - 60000) } });
    const deleted = await request("/customer/account", { method: "DELETE", body: { password: "TestPassword123!" } });
    assert.equal(deleted.status, 200);
    assert.equal(await Customer.findById(customerId), null);
    assert.equal((await PaymentIntent.findById(id)).shippingAddress.phone, "Redacted");
    await require("../src/services/paymentRecovery")();
    const intent = await PaymentIntent.findById(id);
    assert.equal(intent.status, "Failed");
    assert.equal(intent.refundStatus, "Completed");
    assert.equal(await Order.countDocuments({ razorpayOrderId: created.data.order.id }), 0);
    assert.equal((await Product.findById(product._id)).sizes[0].stock, 30);
  });
});

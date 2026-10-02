const Razorpay = require("razorpay");

// Payments are optional during local setup. Initialize on first use so
// missing credentials do not prevent unrelated API routes from starting.
let client;
const razorpay = new Proxy({}, {
  get(_target, property) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      const error = new Error("Payment service is not configured.");
      error.status = 503;
      throw error;
    }
    client ||= new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    client.api.rq.defaults.timeout = 15000;
    return client[property];
  },
});

module.exports = razorpay;

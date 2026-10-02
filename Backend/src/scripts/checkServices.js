require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cloudinary = require("../config/cloudinary");
const razorpay = require("../config/razorpay");

// Read-only checks: no email delivery, uploads, payments, or refunds.
const results = [];
async function check(name, callback) {
  let timer;
  try {
    await Promise.race([
      callback(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error(), { code: "CHECK_TIMEOUT" })), 12000); }),
    ]);
    results.push({ service: name, status: "PASS" });
  } catch (error) {
    results.push({ service: name, status: "FAIL", code: error.code || error.statusCode || error.name || "UNAVAILABLE" });
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  await Promise.all([
    check("MongoDB replica set", async () => {
      if (!process.env.MONGODB_URI) throw Object.assign(new Error(), { code: "MISSING_CONFIGURATION" });
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
      const hello = await mongoose.connection.db.admin().command({ hello: 1 });
      if (!hello.setName && hello.msg !== "isdbgrid") throw Object.assign(new Error(), { code: "REPLICA_SET_REQUIRED" });
    }),
    check("Razorpay authentication", async () => { await razorpay.orders.all({ count: 1 }); }),
    check("Cloudinary authentication", async () => { await cloudinary.api.ping({ timeout: 8000 }); }),
    check("SMTP connection and authentication", async () => {
      const port = Number(process.env.SMTP_PORT || 587);
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port, secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000,
      });
      try { await transport.verify(); } finally { transport.close(); }
    }),
  ]);
  // Print only status and error codes. Provider responses may contain secrets.
  console.log(JSON.stringify(results, null, 2));
  const failed = results.some((result) => result.status === "FAIL");
  await Promise.race([mongoose.disconnect(), new Promise((resolve) => setTimeout(resolve, 1000))]);
  process.exit(failed ? 1 : 0);
}

main().catch(() => { console.error("Service checks could not finish."); process.exit(1); });

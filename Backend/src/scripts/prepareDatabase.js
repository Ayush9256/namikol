require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const prepareDatabase = require("../config/prepareDatabase");

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
    await prepareDatabase();
    console.log("Database ready: replica set verified and payment snapshot TTL removed.");
  } finally {
    await mongoose.disconnect();
  }
}
main().catch((error) => { console.error("Database preparation failed:", error.code || error.name); process.exitCode = 1; });

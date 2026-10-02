const mongoose = require("mongoose");
const PaymentIntent = require("../models/PaymentIntent");

async function prepareDatabase() {
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid") {
    throw new Error("MongoDB transactions require a replica set or Atlas. Configure MONGODB_URI before starting checkout.");
  }
  // Remove only the old destructive payment expiry index, not other indexes.
  const exists = await mongoose.connection.db.listCollections({ name: PaymentIntent.collection.name }).hasNext();
  if (exists) {
    const indexes = await PaymentIntent.collection.indexes();
    for (const index of indexes) {
      if (index.expireAfterSeconds !== undefined && Object.keys(index.key).length === 1 && index.key.expiresAt === 1) {
        await PaymentIntent.collection.dropIndex(index.name);
      }
    }
  }
  await PaymentIntent.createIndexes();
}

module.exports = prepareDatabase;

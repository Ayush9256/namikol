const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    const connection = await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    );

    return connection;
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    console.error("MongoDB Error Name:", error.name);
    console.error("MongoDB Error Code:", error.code);
    console.error("MongoDB Error Reason:", error.reason);

    throw error;
  }
};

module.exports = connectDB;
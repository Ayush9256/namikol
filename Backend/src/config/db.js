const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    const connection = await mongoose.connect(
      process.env.MONGODB_URI,
      { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 }
    );

    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    );

    return connection;
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    console.error("MongoDB Error Name:", error.name);
    console.error("MongoDB Error Code:", error.code);
    // Driver inspection hides the nested network cause as [MongoNetworkError].
    // Print only diagnostic fields, never connection strings or credentials.
    for (const [address, server] of error.reason?.servers || []) {
      const causes = [];
      let cause = server.error;
      for (let depth = 0; cause && depth < 5; depth += 1) {
        causes.push({
          name: cause.name,
          code: cause.code,
          syscall: cause.syscall,
        });
        cause = cause.cause;
      }
      console.error("MongoDB Network Diagnostic:", JSON.stringify({ address, causes }));
    }

    throw error;
  }
};

module.exports = connectDB;

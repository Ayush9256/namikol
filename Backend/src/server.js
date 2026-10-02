require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const prepareDatabase = require("./config/prepareDatabase");
const startRefundWorker = require("./services/refundWorker");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await prepareDatabase();
    startRefundWorker();

    app.listen(PORT, () => {
      console.log(
        `NAMIKOL Backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();

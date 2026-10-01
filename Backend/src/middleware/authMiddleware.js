const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");

const protectCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Customer access denied",
      });
    }

    const customer = await Customer.findById(decoded.id).select("isActive role");

    if (!customer || !customer.isActive || customer.role !== "customer") {
      return res.status(401).json({
        success: false,
        message: "Customer account is unavailable.",
      });
    }

    req.customer = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired customer token",
    });
  }
};

module.exports = protectCustomer;
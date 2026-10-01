require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const Admin = require("../models/Admin");

const createAdmin = async () => {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env"
      );
    }

    if (password.length < 8) {
      throw new Error(
        "ADMIN_PASSWORD must be at least 8 characters long"
      );
    }

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log(`Admin already exists: ${email}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await Admin.create({
      name: "NAMIKOL Admin",
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log(`Admin created successfully: ${email}`);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    const mongoose = require("mongoose");

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

createAdmin();

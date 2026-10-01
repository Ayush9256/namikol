const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Customer = require("../models/Customer");
const CustomerPasswordReset = require("../models/CustomerPasswordReset");
const { sendEmail } = require("../services/emailService");

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

/* =========================================================
   CUSTOMER REGISTER
========================================================= */

const registerCustomer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
    } = req.body;

    const normalizedFirstName = String(
      firstName || ""
    ).trim();

    const normalizedLastName = String(
      lastName || ""
    ).trim();

    const normalizedEmail = normalizeEmail(email);

    const normalizedPassword = String(
      password || ""
    );

    const normalizedPhone = String(
      phone || ""
    ).trim();

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedEmail ||
      !normalizedPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, email and password are required.",
      });
    }

    if (normalizedPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters.",
      });
    }

    const existingCustomer =
      await Customer.findOne({
        email: normalizedEmail,
      });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        normalizedPassword,
        12
      );

    const customer =
      await Customer.create({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        password: hashedPassword,
        phone: normalizedPhone,
        role: "customer",
        isActive: true,
      });

    const token = jwt.sign(
      {
        id: customer._id.toString(),
        role: "customer",
        email: customer.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      success: true,
      message:
        "Customer account created successfully.",
      token,
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
      },
    });
  } catch (error) {
    console.error(
      "Customer registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create customer account.",
    });
  }
};

/* =========================================================
   CUSTOMER LOGIN
========================================================= */

const loginCustomer = async (req, res) => {
  try {
    const email = normalizeEmail(
      req.body.email
    );

    const password = String(
      req.body.password || ""
    );

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const customer =
      await Customer.findOne({
        email,
        role: "customer",
      }).select("+password");

    if (!customer) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "This customer account has been disabled.",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        customer.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: customer._id.toString(),
        role: "customer",
        email: customer.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Customer login successful.",
      token,
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        role: customer.role,
      },
    });
  } catch (error) {
    console.error(
      "Customer login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to login customer.",
    });
  }
};

/* =========================================================
   CUSTOMER FORGOT PASSWORD
========================================================= */

const forgotCustomerPassword = async (req, res) => {
  try {
    const email = normalizeEmail(
      req.body.email
    );

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const genericResponse = {
      success: true,
      message:
        "If an account with this email exists, a password reset OTP has been sent.",
    };

    const customer =
      await Customer.findOne({
        email,
        role: "customer",
      });

    // Do not reveal whether an email exists.
    if (!customer || !customer.isActive) {
      return res.status(200).json(
        genericResponse
      );
    }

    // Invalidate previous unused reset requests.
    await CustomerPasswordReset.updateMany(
      {
        customerId: customer._id,
        usedAt: null,
        verifiedAt: null,
      },
      {
        $set: {
          usedAt: new Date(),
        },
      }
    );

    // Generate a 6-digit OTP.
    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // Hash OTP before storing it.
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // Generate reset token.
    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await CustomerPasswordReset.create({
      customerId: customer._id,
      email: customer.email,
      otpHash,
      resetTokenHash,
      expiresAt,
      attempts: 0,
      verifiedAt: null,
      usedAt: null,
    });

    try {
      await sendEmail({
        to: customer.email,
        subject: "NAMIKOL Password Reset OTP",
        text: `Your NAMIKOL password reset OTP is ${otp}. This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>NAMIKOL Password Reset</h2>

            <p>Your password reset OTP is:</p>

            <h1 style="letter-spacing: 6px;">
              ${otp}
            </h1>

            <p>
              This OTP is valid for <strong>10 minutes</strong>.
            </p>

            <p>
              If you did not request a password reset,
              please ignore this email.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      // Do not leave a usable reset request if email delivery fails.
      await CustomerPasswordReset.updateOne(
        {
          customerId: customer._id,
          resetTokenHash,
          usedAt: null,
        },
        {
          $set: {
            usedAt: new Date(),
          },
        }
      );

      console.error(
        "Customer password reset email error:",
        emailError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send password reset email. Please try again.",
      });
    }

    return res.status(200).json(
      genericResponse
    );
  } catch (error) {
    console.error(
      "Customer forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request.",
    });
  }
};

/* =========================================================
   VERIFY CUSTOMER RESET OTP
========================================================= */

const verifyCustomerResetOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    const otp = String(
      req.body.otp || ""
    ).trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be a 6-digit number.",
      });
    }

    const resetRequest =
      await CustomerPasswordReset.findOne({
        email,
        usedAt: null,
      }).sort({
        createdAt: -1,
      });

    if (!resetRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset request.",
      });
    }

    if (
      resetRequest.expiresAt.getTime() <
      Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    if (resetRequest.verifiedAt) {
      return res.status(400).json({
        success: false,
        message:
          "OTP has already been verified.",
      });
    }

    if (resetRequest.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message:
          "Maximum OTP attempts exceeded. Please request a new OTP.",
      });
    }

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (otpHash !== resetRequest.otpHash) {
      resetRequest.attempts += 1;

      await resetRequest.save();

      const remainingAttempts =
        Math.max(
          0,
          5 - resetRequest.attempts
        );

      return res.status(400).json({
        success: false,
        message:
          remainingAttempts > 0
            ? `Invalid OTP. ${remainingAttempts} attempt${
                remainingAttempts === 1
                  ? ""
                  : "s"
              } remaining.`
            : "Maximum OTP attempts exceeded. Please request a new OTP.",
      });
    }

    /*
      OTP is correct.

      Generate a NEW reset token.
      Only the hash is stored in MongoDB.
      The raw token is returned to the frontend
      and is required for the final password reset.
    */

    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    resetRequest.resetTokenHash =
      resetTokenHash;

    resetRequest.verifiedAt =
      new Date();

    await resetRequest.save();

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error(
      "Customer OTP verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify OTP.",
    });
  }
};

/* =========================================================
   CUSTOMER RESET PASSWORD
========================================================= */

const resetCustomerPassword = async (req, res) => {
  try {
    const email = normalizeEmail(
      req.body.email
    );

    const resetToken = String(
      req.body.resetToken || ""
    ).trim();

    const newPassword = String(
      req.body.newPassword || ""
    );

    if (
      !email ||
      !resetToken ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email, reset token and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters.",
      });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetRequest =
      await CustomerPasswordReset.findOne({
        email,
        resetTokenHash,
        usedAt: null,
      }).sort({
        createdAt: -1,
      });

    if (!resetRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset token.",
      });
    }

    if (!resetRequest.verifiedAt) {
      return res.status(403).json({
        success: false,
        message:
          "OTP verification is required before changing the password.",
      });
    }

    if (
      resetRequest.expiresAt.getTime() <
      Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset request has expired. Please request a new OTP.",
      });
    }

    const customer =
      await Customer.findOne({
        _id: resetRequest.customerId,
        email,
        role: "customer",
      }).select("+password");

    if (!customer) {
      return res.status(400).json({
        success: false,
        message:
          "Customer account could not be found.",
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "This customer account has been disabled.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    customer.password =
      hashedPassword;

    await customer.save();

    resetRequest.usedAt =
      new Date();

    await resetRequest.save();

    // Invalidate all other active reset requests
    // for this customer.
    await CustomerPasswordReset.updateMany(
      {
        customerId: customer._id,
        _id: {
          $ne: resetRequest._id,
        },
        usedAt: null,
      },
      {
        $set: {
          usedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Customer password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error(
      "Customer password reset error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset customer password.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  registerCustomer,
  loginCustomer,
  forgotCustomerPassword,
  verifyCustomerResetOtp,
  resetCustomerPassword,
};
const Customer = require("../models/Customer");
const EmailVerification = require("../models/EmailVerification");
const { sendEmail } = require("../services/emailService");

const generateOtp = () => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
};

const sendEmailChangeOtp = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail?.trim()) {
      return res.status(400).json({
        success: false,
        message: "New email address is required.",
      });
    }

    const normalizedEmail = newEmail
      .trim()
      .toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const customer = await Customer.findById(
      req.customer.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (customer.email === normalizedEmail) {
      return res.status(400).json({
        success: false,
        message:
          "This email is already linked to your account.",
      });
    }

    const existingCustomer = await Customer.findOne({
      email: normalizedEmail,
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already registered with another account.",
      });
    }

    const otp = generateOtp();

    await EmailVerification.deleteMany({
      customerId: customer._id,
    });

    await EmailVerification.create({
      customerId: customer._id,
      newEmail: normalizedEmail,
      otp,
      expiresAt: new Date(
        Date.now() + 5 * 60 * 1000
      ),
    });

    await sendEmail({
      to: normalizedEmail,
      subject: "NAMIKOL - Email Verification OTP",
      text: `Your NAMIKOL email verification OTP is ${otp}. This OTP is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:40px;">
          <div style="max-width:520px; margin:auto; background:#ffffff; padding:32px; border-radius:16px;">
            <h2 style="margin:0 0 12px;">NAMIKOL</h2>

            <p style="color:#555;">
              Use the OTP below to verify your new email address.
            </p>

            <div style="margin:28px 0; padding:18px; background:#111; color:#fff; text-align:center; border-radius:12px;">
              <span style="font-size:32px; font-weight:700; letter-spacing:8px;">
                ${otp}
              </span>
            </div>

            <p style="color:#777;">
              This OTP is valid for <strong>5 minutes</strong>.
            </p>

            <p style="color:#999; font-size:12px;">
              If you did not request this change, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message:
        "OTP sent successfully to your new email address.",
    });
  } catch (error) {
    console.error(
      "Send email change OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send verification OTP.",
    });
  }
};

const verifyEmailChangeOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp?.trim()) {
      return res.status(400).json({
        success: false,
        message: "OTP is required.",
      });
    }

    const verification =
      await EmailVerification.findOne({
        customerId: req.customer.id,
        otp: otp.trim(),
        verified: false,
      });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (new Date() > verification.expiresAt) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    const customer = await Customer.findById(
      req.customer.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const emailAlreadyUsed =
      await Customer.findOne({
        email: verification.newEmail,
        _id: { $ne: customer._id },
      });

    if (emailAlreadyUsed) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(409).json({
        success: false,
        message:
          "This email is already registered with another account.",
      });
    }

    customer.email = verification.newEmail;

    await customer.save();

    await EmailVerification.deleteOne({
      _id: verification._id,
    });

    return res.status(200).json({
      success: true,
      message: "Email address updated successfully.",
      email: customer.email,
    });
  } catch (error) {
    console.error(
      "Verify email change OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify email address.",
    });
  }
};

module.exports = {
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
};
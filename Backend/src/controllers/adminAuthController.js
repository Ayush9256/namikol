const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Admin = require("../models/Admin");
const AdminPasswordReset = require("../models/AdminPasswordReset");
const { sendEmail } = require("../services/emailService");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

/* =========================================================
   ADMIN LOGIN
========================================================= */

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id.toString(),
        email: admin.email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("namikol_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login as admin.",
    });
  }
};

/* =========================================================
   ADMIN LOGOUT
========================================================= */

const logoutAdmin = async (req, res) => {
  try {
    res.clearCookie("namikol_admin_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully.",
    });
  } catch (error) {
    console.error("Admin logout failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to logout admin.",
    });
  }
};

/* =========================================================
   CHANGE ADMIN PASSWORD
========================================================= */

const changeAdminPassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password, new password and confirmation are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirmation do not match.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from the current password.",
      });
    }

    const admin = await Admin.findById(
      req.admin.id
    ).select("+password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    const currentPasswordMatches =
      await bcrypt.compare(
        currentPassword,
        admin.password
      );

    if (!currentPasswordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    admin.password = hashedPassword;

    await admin.save();

    return res.status(200).json({
      success: true,
      message:
        "Admin password changed successfully.",
    });
  } catch (error) {
    console.error(
      "Admin password change failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to change admin password.",
    });
  }
};

/* =========================================================
   GET CURRENT ADMIN
========================================================= */

const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select(
      "name email role avatar"
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar || "",
      },
    });
  } catch (error) {
    console.error(
      "Get current admin failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load admin account.",
    });
  }
};

const updateAdminProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Select an image to upload.",
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "namikol/admin", resource_type: "image" },
        (error, result) => error ? reject(error) : resolve(result)
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      { avatar: uploadResult.secure_url },
      { new: true, runValidators: true }
    ).select("name email role avatar");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated.",
      admin,
    });
  } catch (error) {
    console.error("Update admin profile picture failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile picture.",
    });
  }
};

/* =========================================================
   GENERATE 6 DIGIT OTP
========================================================= */

const generateOtp = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
};

/* =========================================================
   HASH VALUE
========================================================= */

const hashValue = (value) => {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
};

/* =========================================================
   FORGOT ADMIN PASSWORD
========================================================= */

const forgotAdminPassword = async (req, res) => {
   console.log("========== ADMIN FORGOT PASSWORD CALLED ==========");
  console.log("Admin forgot email:", req.body?.email);
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    /*
      Always return the same response whether the
      email exists or not. This prevents account
      enumeration.
    */

    const genericResponse = {
      success: true,
      message:
        "If an admin account exists with this email, a password reset email has been sent.",
    };

    if (!admin) {
      return res.status(200).json(genericResponse);
    }

    // Remove previous unused reset requests
    await AdminPasswordReset.deleteMany({
      adminId: admin._id,
      usedAt: null,
    });

    const otp = generateOtp();

    const resetToken = crypto.randomBytes(32).toString("hex");

    const otpHash = hashValue(otp);
    const resetTokenHash = hashValue(resetToken);

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await AdminPasswordReset.create({
      adminId: admin._id,
      email: admin.email,
      otpHash,
      resetTokenHash,
      expiresAt,
    });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const resetLink =
      `${frontendUrl}/admin/reset-password?token=${resetToken}`;

    await sendEmail({
      to: admin.email,

      subject:
        "NAMIKOL Admin Password Reset",

      text: `
NAMIKOL Admin Password Reset

Your password reset OTP is:

${otp}

This OTP is valid for 10 minutes.

You can also use the following secure reset link:

${resetLink}

If you did not request a password reset, please ignore this email.
      `.trim(),

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>NAMIKOL Admin Password Reset</h2>

          <p>
            A password reset was requested for your NAMIKOL administrator account.
          </p>

          <p>Your 6-digit OTP is:</p>

          <div style="
            font-size: 30px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>
            This OTP is valid for <strong>10 minutes</strong>.
          </p>

          <p>
            You can also use the secure reset link below:
          </p>

          <p>
            <a
              href="${resetLink}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background: #111;
                color: #fff;
                text-decoration: none;
                border-radius: 6px;
              "
            >
              Reset Admin Password
            </a>
          </p>

          <p>
            If you did not request this password reset,
            you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error(
      "Forgot admin password failed:",
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
   VERIFY ADMIN RESET OTP
========================================================= */

const verifyAdminResetOtp = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const token = String(req.body.token || "").trim();
    const otp = String(req.body.otp || "").trim();

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter the 6-digit OTP.",
      });
    }

    let resetRequest = null;

    /*
      FLOW 1:
      Reset-link flow

      If token exists, identify the reset request
      using the token from the email link.
    */
    if (token) {
      const resetTokenHash = hashValue(token);

      resetRequest = await AdminPasswordReset.findOne({
        resetTokenHash,
        usedAt: null,
      });
    }

    /*
      FLOW 2:
      OTP-only flow

      If there is no token, identify the latest
      pending reset request using the admin email.
    */
    if (!resetRequest) {
      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Email is required when verifying OTP without a reset link.",
        });
      }

      resetRequest = await AdminPasswordReset.findOne({
        email,
        usedAt: null,
        verifiedAt: null,
      }).sort({
        createdAt: -1,
      });
    }

    if (!resetRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset request.",
      });
    }

    if (
      resetRequest.expiresAt &&
      resetRequest.expiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset request has expired. Please request a new OTP.",
      });
    }

    if (resetRequest.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }

    const otpHash = hashValue(otp);

    if (otpHash !== resetRequest.otpHash) {
      resetRequest.attempts += 1;
      await resetRequest.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    /*
      OTP is correct.

      For OTP-only flow, generate a NEW reset token
      internally. The user never needs to see it.
    */
    let resetToken = token;

    if (!resetToken) {
      resetToken = crypto.randomBytes(32).toString("hex");

      resetRequest.resetTokenHash =
        hashValue(resetToken);
    }

    resetRequest.verifiedAt = new Date();

    await resetRequest.save();

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully. Create your new password.",
      resetToken,
    });
  } catch (error) {
    console.error(
      "Verify admin reset OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify OTP right now.",
    });
  }
};

/* =========================================================
   RESET ADMIN PASSWORD
========================================================= */

const resetAdminPassword = async (req, res) => {
  try {
    const {
      token,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !token ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token, new password and confirmation are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirmation do not match.",
      });
    }

    const resetTokenHash = hashValue(token);

    const resetRequest =
      await AdminPasswordReset.findOne({
        resetTokenHash,
        usedAt: null,
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
          "This password reset request has expired.",
      });
    }

    if (!resetRequest.verifiedAt) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify the OTP before resetting the password.",
      });
    }

    const admin = await Admin.findById(
      resetRequest.adminId
    ).select("+password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    admin.password = hashedPassword;

    await admin.save();

    resetRequest.usedAt = new Date();

    await resetRequest.save();

    // Invalidate any other active reset requests
    await AdminPasswordReset.updateMany(
      {
        adminId: admin._id,
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

    // Ensure old admin session is not kept active
    res.clearCookie("namikol_admin_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
    });

    return res.status(200).json({
      success: true,
      message:
        "Admin password reset successfully.",
    });
  } catch (error) {
    console.error(
      "Admin password reset failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset admin password.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  loginAdmin,
  logoutAdmin,
  changeAdminPassword,
  getCurrentAdmin,
  updateAdminProfilePicture,
  forgotAdminPassword,
  verifyAdminResetOtp,
  resetAdminPassword,
};
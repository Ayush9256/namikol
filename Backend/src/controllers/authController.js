const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const AdminPasswordReset = require("../models/AdminPasswordReset");

const { sendEmail } = require("../services/emailService");

/* =========================================================
   HELPERS
========================================================= */

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashValue = (value) => {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
};

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

/* =========================================================
   ADMIN LOGIN
========================================================= */

const loginAdmin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({
      email,
      role: "admin",
    }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        admin.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id.toString(),
        role: "admin",
        email: admin.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.cookie(
      "namikol_admin_token",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        maxAge: 24 * 60 * 60 * 1000,
      }
    );

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
    console.error(
      "Admin login error:",
      error
    );

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
    res.clearCookie(
      "namikol_admin_token",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully.",
    });
  } catch (error) {
    console.error(
      "Admin logout error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to logout admin.",
    });
  }
};

/* =========================================================
   CHANGE PASSWORD
========================================================= */

const changeAdminPassword = async (
  req,
  res
) => {
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
          "New password must be at least 8 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirm password do not match.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password.",
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

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    admin.password = hashedPassword;

    await admin.save();

    /*
     * Invalidate any pending password reset requests
     * after a successful normal password change.
     */
    await AdminPasswordReset.updateMany(
      {
        adminId: admin._id,
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
        "Admin password changed successfully.",
    });
  } catch (error) {
    console.error(
      "Change admin password error:",
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

const getCurrentAdmin = async (
  req,
  res
) => {
  try {
    const admin = await Admin.findById(
      req.admin.id
    ).select(
      "_id name email role"
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error(
      "Get current admin error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch current admin.",
    });
  }
};

/* =========================================================
   FORGOT ADMIN PASSWORD
========================================================= */

const forgotAdminPassword = async (
  req,
  res
) => {
  try {
    const email = normalizeEmail(
      req.body.email
    );

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Admin email is required.",
      });
    }

    /*
     * IMPORTANT SECURITY CHECK #1
     *
     * Only the configured backend admin email
     * can start the admin password recovery flow.
     */
    const configuredAdminEmail =
      normalizeEmail(
        process.env.ADMIN_EMAIL
      );

    /*
     * IMPORTANT SECURITY CHECK #2
     *
     * The email must also exist in MongoDB as
     * an actual admin account.
     */
    const admin = await Admin.findOne({
      email,
      role: "admin",
    });

    /*
     * Never reveal whether the email exists.
     *
     * This prevents account/email enumeration.
     */
    if (
      !admin ||
      !configuredAdminEmail ||
      email !== configuredAdminEmail
    ) {
      return res.status(200).json({
        success: true,
        message:
          "If the email belongs to the configured admin account, a password reset OTP has been sent.",
      });
    }

    /*
     * Invalidate all previous unused reset requests
     * for this admin before creating a new one.
     */
    await AdminPasswordReset.updateMany(
      {
        adminId: admin._id,
        usedAt: null,
      },
      {
        $set: {
          usedAt: new Date(),
        },
      }
    );

    /*
     * Generate secure OTP.
     */
    const otp = generateOtp();

    /*
     * Generate secure random reset token.
     */
    const resetToken =
      crypto.randomBytes(32).toString("hex");

    /*
     * Store only hashes in MongoDB.
     *
     * Raw OTP and reset token are never stored.
     */
    const otpHash = hashValue(otp);

    const resetTokenHash =
      hashValue(resetToken);

    /*
     * OTP/reset request expires in 10 minutes.
     */
    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await AdminPasswordReset.create({
      adminId: admin._id,
      email: admin.email,
      otpHash,
      resetTokenHash,
      expiresAt,
      attempts: 0,
      verifiedAt: null,
      usedAt: null,
    });

    /*
     * Frontend reset page.
     *
     * IMPORTANT:
     * The reset token is random and is only sent
     * to the verified admin email.
     */
    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const resetUrl =
      `${frontendUrl}/admin/reset-password?token=${resetToken}`;

    const subject =
      "NAMIKOL Admin Password Reset";

    const text = `
NAMIKOL ADMIN PASSWORD RESET

A password reset was requested for the NAMIKOL administrator account.

OTP: ${otp}

Reset link:
${resetUrl}

This OTP and reset link expire in 10 minutes.

If you did not request this password reset, ignore this email.

Do not share this OTP or reset link with anyone.
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>NAMIKOL Admin Password Reset</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#050505;
    color:#ffffff;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:600px;
      margin:40px auto;
      padding:32px;
      background:#0b0b0b;
      border:1px solid #222;
      border-radius:16px;
    "
  >

    <h2 style="margin-top:0;">
      NAMIKOL Admin Password Reset
    </h2>

    <p style="color:#aaaaaa;line-height:1.6;">
      A password reset was requested for the
      NAMIKOL administrator account.
    </p>

    <div
      style="
        margin:25px 0;
        padding:20px;
        background:#111;
        border:1px solid #333;
        border-radius:12px;
        text-align:center;
      "
    >

      <p
        style="
          margin:0 0 8px;
          color:#888;
          font-size:12px;
          text-transform:uppercase;
          letter-spacing:2px;
        "
      >
        Your OTP
      </p>

      <div
        style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
        "
      >
        ${otp}
      </div>

    </div>

    <p style="color:#aaaaaa;">
      Or use the secure reset link:
    </p>

    <a
      href="${resetUrl}"
      style="
        display:inline-block;
        padding:14px 20px;
        background:#ffffff;
        color:#000000;
        text-decoration:none;
        border-radius:8px;
        font-weight:bold;
      "
    >
      RESET ADMIN PASSWORD
    </a>

    <p
      style="
        margin-top:25px;
        color:#777;
        font-size:13px;
        line-height:1.6;
      "
    >
      This OTP and reset link expire in 10 minutes.
      Do not share them with anyone.
    </p>

    <p
      style="
        color:#777;
        font-size:13px;
      "
    >
      If you did not request this password reset,
      you can safely ignore this email.
    </p>

  </div>

</body>
</html>
`;

    await sendEmail({
      to: admin.email,
      subject,
      text,
      html,
    });

    return res.status(200).json({
      success: true,
      message:
        "If the email belongs to the configured admin account, a password reset OTP has been sent.",
    });
  } catch (error) {
    console.error(
      "Forgot admin password error:",
      error
    );

    /*
     * Do not expose SMTP/database details to
     * the frontend.
     */
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

const verifyAdminResetOtp = async (
  req,
  res
) => {
  try {
    const token = String(
      req.body.token || ""
    ).trim();

    const otp = String(
      req.body.otp || ""
    ).trim();

    if (!token || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token and OTP are required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message:
          "OTP must be a 6-digit number.",
      });
    }

    const resetTokenHash =
      hashValue(token);

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

    /*
     * Maximum 5 OTP attempts.
     */
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
        message:
          "Invalid OTP.",
      });
    }

    /*
     * OTP verified successfully.
     */
    resetRequest.verifiedAt =
      new Date();

    await resetRequest.save();

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully.",
    });
  } catch (error) {
    console.error(
      "Verify admin reset OTP error:",
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
   RESET ADMIN PASSWORD
========================================================= */

const resetAdminPassword = async (
  req,
  res
) => {
  try {
    const token = String(
      req.body.token || ""
    ).trim();

    const newPassword = String(
      req.body.newPassword || ""
    );

    const confirmPassword = String(
      req.body.confirmPassword || ""
    );

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
          "New password must be at least 8 characters.",
      });
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirm password do not match.",
      });
    }

    const resetTokenHash =
      hashValue(token);

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

    /*
     * CRITICAL:
     *
     * OTP verification MUST happen before
     * changing the password.
     */
    if (!resetRequest.verifiedAt) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify the OTP before resetting your password.",
      });
    }

    const admin =
      await Admin.findOne({
        _id: resetRequest.adminId,
        email: resetRequest.email,
        role: "admin",
      }).select("+password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message:
          "Admin account not found.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    admin.password =
      hashedPassword;

    await admin.save();

    /*
     * Consume this reset request.
     */
    resetRequest.usedAt =
      new Date();

    await resetRequest.save();

    /*
     * Invalidate ALL other pending reset
     * requests belonging to this admin.
     */
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

    /*
     * Clear any existing admin session.
     *
     * The admin must login again with the
     * newly created password.
     */
    res.clearCookie(
      "namikol_admin_token",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Admin password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset admin password error:",
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

  forgotAdminPassword,
  verifyAdminResetOtp,
  resetAdminPassword,
};
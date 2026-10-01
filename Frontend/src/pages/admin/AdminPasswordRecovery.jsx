import { useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
} from "react-icons/fi";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";

/*
  IMPORTANT:
  Keep this component outside AdminPasswordRecovery.
  Otherwise the password input can remount on every keystroke.
*/
function PasswordField({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggle,
  placeholder,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-neutral-500"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white"
          aria-label={
            showPassword
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
        >
          {showPassword ? (
            <FiEyeOff size={18} />
          ) : (
            <FiEye size={18} />
          )}
        </button>
      </div>
    </div>
  );
}

function AdminPasswordRecovery() {
  const [searchParams] =
    useSearchParams();

  const tokenFromUrl =
    searchParams.get("token") || "";

  const [step, setStep] = useState(
    tokenFromUrl ? "otp" : "email"
  );

  const [token, setToken] =
    useState(tokenFromUrl);

  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const handleSendOtp = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError(
        "Please enter your admin email."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/admin/auth/forgot-password",
        {
          email: email.trim(),
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to send reset email."
        );
      }

      setMessage(
        "If this email belongs to an administrator, a reset OTP and link have been sent."
      );

      /*
        In development, backend can return a token
        only if your backend explicitly provides it.
        Normally the token comes through the email link.
      */
      if (response.data?.resetToken) {
        setToken(
          response.data.resetToken
        );
      }

      setStep("otp");
    } catch (err) {
      console.error(
        "Forgot password failed:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to send reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
  event.preventDefault();

  setError("");
  setMessage("");

  if (!token && !email.trim()) {
    setError("Please enter your admin email.");
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    setError("Please enter the 6-digit OTP.");
    return;
  }

  try {
    setLoading(true);

    const response = await api.post(
      "/admin/auth/verify-reset-otp",
      {
        email: email.trim(),
        token,
        otp,
      }
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "OTP verification failed."
      );
    }

    /*
      OTP-only flow:
      Backend generates the reset token internally
      and returns it to the frontend.
    */
    if (response.data?.resetToken) {
      setToken(response.data.resetToken);
    }

    setMessage(
      "OTP verified successfully. Create your new password."
    );

    setStep("password");
  } catch (err) {
    setError(
      err.response?.data?.message ||
        err.message ||
        "OTP verification failed."
    );
  } finally {
    setLoading(false);
  }
};

  const handleResetPassword = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError(
        "Reset token is missing."
      );
      return;
    }

    if (!newPassword) {
      setError(
        "Please enter a new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/admin/auth/reset-password",
        {
          token,
          newPassword,
          confirmPassword,
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Password reset failed."
        );
      }

      setMessage(
        "Password reset successfully. You can now login with your new password."
      );

      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        window.location.href =
          "/admin/login";
      }, 1500);
    } catch (err) {
      console.error(
        "Reset password failed:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* BACK */}
          <Link
            to="/admin/login"
            className="mb-10 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-white"
          >
            <FiArrowLeft size={16} />
            Back to Admin Login
          </Link>

          {/* CARD */}
          <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl">
            {/* ICON */}
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              {step === "email" ? (
                <FiMail
                  size={24}
                  className="text-white"
                />
              ) : step === "otp" ? (
                <FiShield
                  size={24}
                  className="text-white"
                />
              ) : (
                <FiLock
                  size={24}
                  className="text-white"
                />
              )}
            </div>

            {/* HEADER */}
            <div className="mb-8">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
                NAMIKOL
              </p>

              <h1 className="text-3xl font-semibold tracking-tight">
                {step === "email"
                  ? "Forgot Password"
                  : step === "otp"
                  ? "Verify OTP"
                  : "Reset Password"}
              </h1>

              <p className="mt-3 text-sm leading-6 text-neutral-500">
                {step === "email"
                  ? "Enter your administrator email to receive a secure password reset OTP and link."
                  : step === "otp"
                  ? "Enter the 6-digit OTP sent to your administrator email."
                  : "Create a new secure password for the admin panel."}
              </p>
            </div>

            {/* MESSAGE */}
            {message && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-400">
                <FiCheckCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />
                <span>{message}</span>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-400">
                {error}
              </div>
            )}

            {/* EMAIL STEP */}
            {step === "email" && (
              <form
                onSubmit={handleSendOtp}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="reset-email"
                    className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-neutral-500"
                  >
                    Admin Email
                  </label>

                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="admin@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "SENDING..."
                    : "SEND OTP"}
                </button>
              </form>
            )}

            {/* OTP STEP */}
            {step === "otp" && (
              <form
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="reset-otp"
                    className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-neutral-500"
                  >
                    6-Digit OTP
                  </label>

                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) =>
                      setOtp(
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="000000"
                    autoComplete="one-time-code"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-center text-lg tracking-[0.4em] text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "VERIFYING..."
                    : "VERIFY OTP"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setToken("");
                    setMessage("");
                    setError("");
                  }}
                  className="w-full text-center text-xs text-neutral-500 transition hover:text-white"
                >
                  Use another email
                </button>
              </form>
            )}

            {/* PASSWORD STEP */}
            {step === "password" && (
              <form
                onSubmit={
                  handleResetPassword
                }
                className="space-y-6"
              >
                <PasswordField
                  id="new-admin-password"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  showPassword={
                    showNewPassword
                  }
                  onToggle={() =>
                    setShowNewPassword(
                      (value) => !value
                    )
                  }
                  placeholder="Enter new password"
                />

                <PasswordField
                  id="confirm-admin-password"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={
                    setConfirmPassword
                  }
                  showPassword={
                    showConfirmPassword
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  placeholder="Confirm new password"
                />

                <p className="text-xs leading-5 text-neutral-600">
                  Password must contain at least 8
                  characters.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "RESETTING..."
                    : "RESET PASSWORD"}
                </button>
              </form>
            )}

            {/* SECURITY NOTE */}
            <p className="mt-7 text-center text-xs leading-5 text-neutral-600">
              Secure administrator password recovery.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminPasswordRecovery;
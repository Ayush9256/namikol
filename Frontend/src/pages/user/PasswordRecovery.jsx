import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
} from "react-icons/fi";
import api from "../../services/api";

const PasswordInput = ({
  name,
  value,
  onChange,
  placeholder,
  showPassword,
  onToggle,
}) => {
  return (
    <div className="relative">
      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />

      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
        className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition focus:border-white/30"
      />

      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white"
      >
        {showPassword ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  );
};

function PasswordRecovery() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  /* =========================================================
     STEP 1
     SEND OTP
  ========================================================= */

  const handleSendOtp = async (event) => {
    event.preventDefault();

    clearMessages();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your registered email."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/forgot-password",
        {
          email: normalizedEmail,
        }
      );

      setEmail(normalizedEmail);

      setMessage(
        response.data?.message ||
          "If an account exists, an OTP has been sent to your email."
      );

      setStep(2);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     STEP 2
     VERIFY OTP
  ========================================================= */

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    clearMessages();

    const normalizedOtp = otp.trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      setError(
        "Please enter the 6-digit OTP."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/verify-reset-otp",
        {
          email,
          otp: normalizedOtp,
        }
      );

      if (!response.data?.resetToken) {
        setError(
          "OTP verification succeeded, but the reset session could not be created."
        );
        return;
      }

      setResetToken(
        response.data.resetToken
      );

      setMessage(
        "OTP verified successfully."
      );

      setStep(3);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to verify OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     STEP 3
     RESET PASSWORD
  ========================================================= */

  const handleResetPassword = async (
    event
  ) => {
    event.preventDefault();

    clearMessages();

    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    if (!resetToken) {
      setError(
        "Your password reset session is invalid. Please start again."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/reset-password",
        {
          email,
          resetToken,
          newPassword,
        }
      );

      setMessage(
        response.data?.message ||
          "Password reset successfully."
      );

      setStep(4);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-5 py-12 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-xl">

        {/* BACK TO LOGIN */}

        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
        >
          <FiArrowLeft />
          Back to Login
        </Link>

        <div className="rounded-3xl border border-white/10 bg-neutral-950 p-6 sm:p-8 lg:p-10">

          {/* =================================================
              SUCCESS
          ================================================= */}

          {step === 4 ? (
            <div className="py-8 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10">
                <FiCheckCircle className="text-2xl text-green-400" />
              </div>

              <h1 className="mt-6 text-2xl font-semibold">
                Password Reset Successfully
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-neutral-400">
                Your password has been updated
                successfully. You can now login
                using your new password.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/login")
                }
                className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              {/* HEADER */}

              <div className="mb-8">

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  {step === 3 ? (
                    <FiLock className="text-lg text-white" />
                  ) : (
                    <FiMail className="text-lg text-white" />
                  )}
                </div>

                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Account Security
                </p>

                <h1 className="mt-2 text-3xl font-semibold">
                  {step === 1 &&
                    "Forgot Password"}

                  {step === 2 &&
                    "Verify OTP"}

                  {step === 3 &&
                    "Create New Password"}
                </h1>

                <p className="mt-3 text-sm leading-6 text-neutral-400">
                  {step === 1 &&
                    "Enter your registered email and we'll send you a password reset OTP."}

                  {step === 2 &&
                    "Enter the 6-digit OTP sent to your registered email address."}

                  {step === 3 &&
                    "Create a new secure password for your NAMIKOL account."}
                </p>
              </div>

              {/* PROGRESS */}

              <div className="mb-8 flex gap-2">

                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className={`h-1.5 flex-1 rounded-full transition ${
                        item <= step
                          ? "bg-white"
                          : "bg-white/10"
                      }`}
                    />
                  )
                )}
              </div>

              {/* MESSAGE */}

              {message && (
                <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                  {message}
                </div>
              )}

              {/* ERROR */}

              {error && (
                <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* =================================================
                  STEP 1: EMAIL
              ================================================= */}

              {step === 1 && (
                <form
                  onSubmit={handleSendOtp}
                  className="space-y-6"
                >
                  <div>

                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
                      Registered Email
                    </label>

                    <div className="relative">

                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />

                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(
                            event.target.value
                          );
                          clearMessages();
                        }}
                        placeholder="Enter your registered email"
                        autoComplete="email"
                        className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition focus:border-white/30"
                      />

                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs leading-5 text-neutral-500">
                    We'll send a 6-digit OTP to
                    your registered email address.
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Sending OTP..."
                      : "Send OTP"}
                  </button>
                </form>
              )}

              {/* =================================================
                  STEP 2: OTP
              ================================================= */}

              {step === 2 && (
                <form
                  onSubmit={handleVerifyOtp}
                  className="space-y-6"
                >
                  <div>

                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
                      Verification OTP
                    </label>

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => {
                        const value =
                          event.target.value.replace(
                            /\D/g,
                            ""
                          );

                        setOtp(value);
                        clearMessages();
                      }}
                      placeholder="Enter 6-digit OTP"
                      autoComplete="one-time-code"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-center text-lg tracking-[0.4em] text-white outline-none transition focus:border-white/30"
                    />
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs leading-5 text-neutral-500">
                    OTP is valid for 10 minutes.
                    You have a maximum of 5
                    verification attempts.
                  </div>

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      otp.length !== 6
                    }
                    className="w-full rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Verifying OTP..."
                      : "Verify OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                      clearMessages();
                    }}
                    className="w-full text-sm text-neutral-500 transition hover:text-white"
                  >
                    Use a different email
                  </button>
                </form>
              )}

              {/* =================================================
                  STEP 3: NEW PASSWORD
              ================================================= */}

              {step === 3 && (
                <form
                  onSubmit={
                    handleResetPassword
                  }
                  className="space-y-6"
                >
                  <div>

                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
                      New Password
                    </label>

                    <PasswordInput
                      name="newPassword"
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(
                          event.target.value
                        );
                        clearMessages();
                      }}
                      placeholder="Enter new password"
                      showPassword={
                        showPassword
                      }
                      onToggle={() =>
                        setShowPassword(
                          (current) =>
                            !current
                        )
                      }
                    />
                  </div>

                  <div>

                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
                      Confirm New Password
                    </label>

                    <PasswordInput
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(
                          event.target.value
                        );
                        clearMessages();
                      }}
                      placeholder="Confirm new password"
                      showPassword={
                        showConfirm
                      }
                      onToggle={() =>
                        setShowConfirm(
                          (current) =>
                            !current
                        )
                      }
                    />
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs leading-5 text-neutral-500">
                    Password must contain at
                    least 8 characters.
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Updating Password..."
                      : "Reset Password"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default PasswordRecovery;
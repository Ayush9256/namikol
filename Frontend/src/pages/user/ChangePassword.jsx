import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import api from "../../services/api";

function ChangePassword() {
  const navigate = useNavigate();

  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const [session] = useState(() => {
    try {
      const savedSession = localStorage.getItem(
        "namikol_customer_session"
      );

      return savedSession
        ? JSON.parse(savedSession)
        : null;
    } catch {
      return null;
    }
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

    setError("");
    setSuccess("");
  };

  const handleKeyDown = (event, nextRef) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (nextRef) {
      nextRef.current?.focus();
    } else {
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!localStorage.getItem("namikol-token")) {
      setError("Please login to change your password.");
      return;
    }

    if (!formData.currentPassword) {
      setError("Please enter your current password.");
      currentPasswordRef.current?.focus();
      return;
    }

    if (!formData.newPassword) {
      setError("Please enter a new password.");
      newPasswordRef.current?.focus();
      return;
    }

    if (formData.newPassword.length < 6) {
      setError(
        "New password must be at least 6 characters."
      );
      newPasswordRef.current?.focus();
      return;
    }

    if (
      formData.newPassword ===
      formData.currentPassword
    ) {
      setError(
        "New password must be different from your current password."
      );
      newPasswordRef.current?.focus();
      return;
    }

    if (
      formData.newPassword !==
      formData.confirmPassword
    ) {
      setError("New passwords do not match.");
      confirmPasswordRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await api.patch(
        "/customer/change-password",
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }
      );

      if (!response.data?.success) {
        setError(
          response.data?.message ||
            "Unable to change password."
        );
        return;
      }

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccess("Password changed successfully.");

      setTimeout(() => {
        navigate("/settings");
      }, 1000);
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to change password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPasswordField = (
    label,
    name,
    value,
    showPassword,
    setShowPassword,
    placeholder,
    inputRef,
    nextRef
  ) => (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
        {label}
      </label>

      <div className="relative">
        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />

        <input
          ref={inputRef}
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={handleChange}
          onKeyDown={(event) =>
            handleKeyDown(event, nextRef)
          }
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition focus:border-white/30"
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword(
              (current) => !current
            )
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white"
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
        >
          {showPassword ? (
            <FiEyeOff />
          ) : (
            <FiEye />
          )}
        </button>
      </div>
    </div>
  );

  if (!session) {
    return (
      <main className="min-h-screen bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center">
          <h1 className="text-2xl font-semibold">
            Login Required
          </h1>

          <p className="mt-3 text-sm text-neutral-400">
            Please login to change your password.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-12 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/settings"
          className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
        >
          <FiArrowLeft />
          Back to Settings
        </Link>

        <div className="rounded-3xl border border-white/10 bg-neutral-950 p-6 sm:p-8 lg:p-10">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              Security
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              Change Password
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-400">
              Update your account password using your current password.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {renderPasswordField(
              "Current Password",
              "currentPassword",
              formData.currentPassword,
              showCurrent,
              setShowCurrent,
              "Enter current password",
              currentPasswordRef,
              newPasswordRef
            )}

            {renderPasswordField(
              "New Password",
              "newPassword",
              formData.newPassword,
              showNew,
              setShowNew,
              "Enter new password",
              newPasswordRef,
              confirmPasswordRef
            )}

            {renderPasswordField(
              "Confirm New Password",
              "confirmPassword",
              formData.confirmPassword,
              showConfirm,
              setShowConfirm,
              "Confirm new password",
              confirmPasswordRef,
              null
            )}

            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs leading-5 text-neutral-500">
              Password should contain at least 6 characters.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Changing Password..."
                : "Change Password"}
            </button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-neutral-500">
              Forgot your current password?
            </p>

            <Link
              to="/password-recovery"
              className="mt-2 inline-block text-sm text-white underline underline-offset-4 transition hover:text-neutral-300"
            >
              Reset your password
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ChangePassword;
import { useCallback, useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiDollarSign,
  FiEye,
  FiEyeOff,
  FiLock,
  FiRefreshCw,
  FiSave,
  FiSettings,
} from "react-icons/fi";
import { Link } from "react-router-dom";

import api from "../../services/api";

const DEFAULT_SETTINGS = {
  storeName: "NAMIKOL",
  storeTagline: "Premium Footwear",
  currency: "INR",
  currencySymbol: "₹",
  allowOrders: true,
};

/*
|--------------------------------------------------------------------------
| PASSWORD INPUT
|--------------------------------------------------------------------------
| Keep this component outside AdminSettings.
| This prevents the input from being recreated on every render,
| which was causing the focus / first-character problem.
|--------------------------------------------------------------------------
*/
function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  showPassword,
  onToggle,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </label>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-neutral-500 transition hover:bg-white/5 hover:text-white"
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
        >
          {showPassword ? (
            <FiEyeOff size={17} />
          ) : (
            <FiEye size={17} />
          )}
        </button>
      </div>
    </div>
  );
}

function AdminSettings() {
  /*
  |--------------------------------------------------------------------------
  | STORE SETTINGS
  |--------------------------------------------------------------------------
  */
  const [settings, setSettings] =
    useState(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | CHANGE PASSWORD
  |--------------------------------------------------------------------------
  */
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD SETTINGS
  |--------------------------------------------------------------------------
  */
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/settings");

      if (
        response.data?.success &&
        response.data?.settings
      ) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...response.data.settings,
        });
      }
    } catch (err) {
      console.error(
        "Failed to load settings:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load store settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSettings();
    });
  }, [loadSettings]);

  /*
  |--------------------------------------------------------------------------
  | STORE SETTINGS CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setMessage("");
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE STORE SETTINGS
  |--------------------------------------------------------------------------
  */
  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        storeName: settings.storeName,
        storeTagline: settings.storeTagline,
        currency: settings.currency,
        currencySymbol:
          settings.currencySymbol,

        allowOrders:
          Boolean(settings.allowOrders),
      };

      const response = await api.patch(
        "/settings",
        payload
      );

      if (response.data?.success) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...response.data.settings,
        });

        setMessage(
          "Store settings saved successfully."
        );
      }
    } catch (err) {
      console.error(
        "Failed to save settings:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to save store settings."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RESET STORE SETTINGS
  |--------------------------------------------------------------------------
  */
  const handleReset = () => {
    loadSettings();
  };

  /*
  |--------------------------------------------------------------------------
  | CHANGE ADMIN PASSWORD
  |--------------------------------------------------------------------------
  */
  const handleChangePassword = async () => {
    /*
     * Clear only the previous ERROR.
     * Do not clear success message here.
     */
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError(
        "Please enter your current password."
      );
      return;
    }

    if (!newPassword) {
      setPasswordError(
        "Please enter your new password."
      );
      return;
    }

    if (!confirmPassword) {
      setPasswordError(
        "Please confirm your new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await api.post(
        "/admin/auth/change-password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        }
      );

      if (response.data?.success) {
        /*
         * Clear password fields after successful change.
         */
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        /*
         * IMPORTANT:
         * Keep this message visible.
         */
        setPasswordMessage(
          "Admin password changed successfully."
        );

        /*
         * Clear any previous error.
         */
        setPasswordError("");
      }
    } catch (err) {
      console.error(
        "Failed to change admin password:",
        err
      );

      setPasswordError(
        err.response?.data?.message ||
          "Unable to change admin password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-neutral-400">
            <FiRefreshCw
              size={17}
              className="animate-spin"
            />

            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="min-h-screen">

        {/* =========================================================
            TOP BAR
        ========================================================== */}
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between border-b border-white/10 bg-black/95 px-5 backdrop-blur-md md:px-8">

          <div className="flex items-center gap-4">

            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-400 transition hover:text-white"
            >
              <FiArrowLeft size={15} />

              Back to Dashboard
            </Link>

            <span className="hidden h-4 w-px bg-white/10 sm:block" />

            <div className="hidden items-center gap-2 sm:flex">

              <FiSettings
                size={16}
                className="text-neutral-500"
              />

              <p className="text-sm font-medium text-white">
                Settings
              </p>

            </div>
          </div>

          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-600">
            NAMIKOL ADMIN
          </p>

        </header>

        {/* =========================================================
            CONTENT
        ========================================================== */}
        <section className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">

          {/* PAGE HEADER */}
          <div className="mb-8">

            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">
              Configuration
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Store Settings
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
              Manage your store information, shipping
              rules, order availability and administrator
              security from one place.
            </p>

          </div>

          {/* STORE SUCCESS */}
          {message && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
              <FiCheckCircle size={17} />

              {message}
            </div>
          )}

          {/* STORE ERROR */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* =======================================================
              STORE SETTINGS FORM
          ======================================================== */}
          <form onSubmit={handleSave}>

            <div className="grid gap-6 lg:grid-cols-2">

              {/* STORE INFORMATION */}
              <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">

                <div className="mb-6 flex items-start gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <FiSettings size={18} />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Store Information
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      Basic information displayed across
                      your store.
                    </p>
                  </div>

                </div>

                <div className="space-y-5">

                  <div>

                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                      Store Name
                    </label>

                    <input
                      type="text"
                      name="storeName"
                      value={settings.storeName}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                      placeholder="NAMIKOL"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                      Store Tagline
                    </label>

                    <input
                      type="text"
                      name="storeTagline"
                      value={
                        settings.storeTagline
                      }
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                      placeholder="Premium Footwear"
                    />

                  </div>

                </div>
              </section>

              {/* CURRENCY */}
              <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">

                <div className="mb-6 flex items-start gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <FiDollarSign size={18} />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Currency
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      Configure the currency used for store
                      pricing.
                    </p>
                  </div>

                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                      Currency
                    </label>

                    <input
                      type="text"
                      name="currency"
                      value={settings.currency}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                      Symbol
                    </label>

                    <input
                      type="text"
                      name="currencySymbol"
                      value={
                        settings.currencySymbol
                      }
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                    />

                  </div>

                </div>
              </section>

              {/* ORDERS */}
              <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">

                <div className="mb-6 flex items-start gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <FiCheckCircle size={18} />
                  </div>

                  <div>

                    <h2 className="text-base font-semibold text-white">
                      Orders
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      Control whether customers can place
                      new orders.
                    </p>

                  </div>

                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-4">

                  <div>

                    <p className="text-sm font-medium text-white">
                      Accept Orders
                    </p>

                    <p className="mt-1 text-xs text-neutral-600">
                      Customers can place orders when this
                      setting is enabled.
                    </p>

                  </div>

                  <input
                    type="checkbox"
                    name="allowOrders"
                    checked={
                      settings.allowOrders
                    }
                    onChange={handleChange}
                    className="h-4 w-4 accent-white"
                  />

                </label>

              </section>

            </div>

            {/* STORE ACTIONS */}
            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-neutral-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiRefreshCw size={16} />

                RESET
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiSave size={16} />

                {saving
                  ? "SAVING..."
                  : "SAVE SETTINGS"}
              </button>

            </div>

          </form>

          {/* =======================================================
              ADMINISTRATOR SECURITY
          ======================================================== */}
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">

            {/* SECURITY HEADER */}
            <div className="mb-6 flex items-start gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <FiLock size={18} />
              </div>

              <div>

                <h2 className="text-base font-semibold text-white">
                  Administrator Security
                </h2>

                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Change or recover the password used to
                  access the NAMIKOL admin panel.
                </p>

              </div>

            </div>

            {/* PASSWORD SUCCESS */}
            {passwordMessage && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">

                <FiCheckCircle size={17} />

                {passwordMessage}

              </div>
            )}

            {/* PASSWORD ERROR */}
            {passwordError && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {passwordError}
              </div>
            )}

            {/* PASSWORD FIELDS */}
            <div className="grid gap-5 md:grid-cols-3">

              <PasswordInput
                label="Current Password"
                value={currentPassword}
                onChange={(value) => {
                  setCurrentPassword(value);

                  /*
                   * Clear only error.
                   * SUCCESS MESSAGE STAYS.
                   */
                  setPasswordError("");
                }}
                placeholder="Enter current password"
                showPassword={
                  showCurrentPassword
                }
                onToggle={() =>
                  setShowCurrentPassword(
                    (previous) => !previous
                  )
                }
              />

              <PasswordInput
                label="New Password"
                value={newPassword}
                onChange={(value) => {
                  setNewPassword(value);

                  /*
                   * Clear only error.
                   * SUCCESS MESSAGE STAYS.
                   */
                  setPasswordError("");
                }}
                placeholder="Minimum 8 characters"
                showPassword={
                  showNewPassword
                }
                onToggle={() =>
                  setShowNewPassword(
                    (previous) => !previous
                  )
                }
              />

              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(value) => {
                  setConfirmPassword(value);

                  /*
                   * Clear only error.
                   * SUCCESS MESSAGE STAYS.
                   */
                  setPasswordError("");
                }}
                placeholder="Repeat new password"
                showPassword={
                  showConfirmPassword
                }
                onToggle={() =>
                  setShowConfirmPassword(
                    (previous) => !previous
                  )
                }
              />

            </div>

            {/* PASSWORD ACTIONS */}
            <div className="mt-6 flex flex-col gap-5 border-t border-white/10 pt-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-xs font-medium text-neutral-400">
                    Password requirements
                  </p>

                  <p className="mt-1 text-xs text-neutral-600">
                    Use at least 8 characters and do not
                    reuse your current password.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <FiLock size={16} />

                  {changingPassword
                    ? "CHANGING..."
                    : "CHANGE PASSWORD"}

                </button>

              </div>

              {/* FORGOT PASSWORD */}
              <div className="flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-sm font-medium text-white">
                    Forgot your admin password?
                  </p>

                  <p className="mt-1 text-xs text-neutral-600">
                    Reset it using your registered admin
                    email and OTP.
                  </p>

                </div>

                <Link
                  to="/admin/forgot-password"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-300 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
                >
                  FORGOT PASSWORD
                </Link>

              </div>

            </div>

          </section>

        </section>

      </main>
    </div>
  );
}

export default AdminSettings;
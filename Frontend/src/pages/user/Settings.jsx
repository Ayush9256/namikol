import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../../services/api"
import {
  FiBell,
  FiCheck,
  FiChevronRight,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiMoon,
  FiPackage,
  FiShield,
  FiShoppingBag,
  FiTrash2,
  FiUser,
  FiHeart,
} from "react-icons/fi"

const SETTINGS_KEY = "namikol_customer_settings"

const defaultSettings = {
  orderUpdates: true,
  deliveryUpdates: true,
  paymentUpdates: true,
  emailNotifications: true,
  marketingEmails: false,
  preferredCollection: "Unisex",
  wishlistEnabled: true,
  cartReminders: true,
  darkMode: true,
}

function getSavedSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)

    if (!saved) {
      return defaultSettings
    }

    return {
      ...defaultSettings,
      ...JSON.parse(saved),
    }
  } catch {
    return defaultSettings
  }
}

function getSavedSession() {
  try {
    const savedSession = localStorage.getItem("namikol_customer_session")
    return savedSession ? JSON.parse(savedSession) : null
  } catch {
    return null
  }
}

function Toggle({ enabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={enabled ? "Disable" : "Enable"}
      className={`relative h-7 w-12 cursor-pointer rounded-full transition ${
        enabled ? "bg-white" : "bg-neutral-800"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full transition ${
          enabled ? "left-6 bg-black" : "left-1 bg-neutral-500"
        }`}
      />
    </button>
  )
}

function SettingRow({ icon, title, description, enabled, onClick }) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-white/10 py-5 last:border-b-0">
      <div className="flex min-w-0 items-start gap-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black text-neutral-400">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 max-w-lg text-xs leading-5 text-neutral-500">
            {description}
          </p>
        </div>
      </div>
      <Toggle enabled={enabled} onClick={onClick} />
    </div>
  )
}

function Settings() {
  const navigate = useNavigate()

  const [settings, setSettings] = useState(
    getSavedSettings
  )

  const [session] = useState(getSavedSession)

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    )
  }, [settings])

  const toggleSetting = (key) => {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const handleCollectionChange = (value) => {
    setSettings((current) => ({
      ...current,
      preferredCollection: value,
    }))
  }

  const handleLogout = () => {
    localStorage.removeItem("namikol-token")
    localStorage.removeItem(
      "namikol_customer_session"
    )

    window.dispatchEvent(new Event("namikol-auth-changed"))
    navigate("/")
  }

  const handleDeleteAccount = async () => {
    if (!session?.id) {
      return
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    )

    if (!confirmed) {
      return
    }

    const password = window.prompt("Enter your current password to confirm account deletion.")
    if (!password) return

    try {
      await api.delete("/customer/account", { data: { password } })
      localStorage.removeItem("namikol-token")
      localStorage.removeItem(
        "namikol_customer_session"
      )
      localStorage.removeItem(SETTINGS_KEY)
      window.dispatchEvent(new Event("namikol-auth-changed"))
      navigate("/")
    } catch (error) {
      console.error(
        "Failed to delete account:",
        error
      )

      alert(
        error.response?.data?.message ||
          "Something went wrong while deleting the account."
      )
    }
  }

  return (
    <main className="min-h-screen bg-black px-5 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-neutral-600">
            NAMIKOL / ACCOUNT
          </p>

          <h1 className="mt-4 text-5xl font-black uppercase tracking-[0.06em] sm:text-6xl">
            Settings
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500">
            Manage your account preferences, notifications,
            shopping preferences and privacy controls.
          </p>
        </div>

        {/* Account Summary */}
        {session && (
          <div className="mt-10 flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white text-black">
                <FiUser size={21} />
              </div>

              <div>
                <p className="text-sm font-bold">
                  {session.firstName}{" "}
                  {session.lastName}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  {session.email}
                </p>
              </div>
            </div>

            <Link
              to="/profile"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:border-white/30 hover:bg-white hover:text-black"
            >
              Edit Profile
              <FiChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Notifications */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <FiBell size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                Notifications
              </h2>

              <p className="mt-1 text-xs text-neutral-500">
                Choose which updates you want to receive.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <SettingRow
              icon={<FiPackage size={17} />}
              title="Order Updates"
              description="Receive updates about your order status."
              enabled={settings.orderUpdates}
              onClick={() => toggleSetting("orderUpdates")}
            />

            <SettingRow
              icon={<FiShoppingBag size={17} />}
              title="Delivery Updates"
              description="Receive shipping and delivery notifications."
              enabled={settings.deliveryUpdates}
              onClick={() => toggleSetting("deliveryUpdates")}
            />

            <SettingRow
              icon={<FiCheck size={17} />}
              title="Payment Updates"
              description="Receive payment and transaction updates."
              enabled={settings.paymentUpdates}
              onClick={() => toggleSetting("paymentUpdates")}
            />

            <SettingRow
              icon={<FiMail size={17} />}
              title="Email Notifications"
              description="Allow NAMIKOL to send account-related emails."
              enabled={settings.emailNotifications}
              onClick={() => toggleSetting("emailNotifications")}
            />

            <SettingRow
              icon={<FiMail size={17} />}
              title="Marketing & Newsletter"
              description="Receive new collection and promotional emails."
              enabled={settings.marketingEmails}
              onClick={() => toggleSetting("marketingEmails")}
            />
          </div>
        </section>

        {/* Shopping Preferences */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <FiShoppingBag size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                Shopping Preferences
              </h2>

              <p className="mt-1 text-xs text-neutral-500">
                Customize your shopping experience.
              </p>
            </div>
          </div>

          {/* Collection */}
          <div className="mt-6 border-b border-white/10 pb-6">
            <p className="text-sm font-semibold">
              Preferred Collection
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              Choose the collection you prefer to browse.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-md">
              {["Men", "Women", "Unisex"].map(
                (collection) => {
                  const selected =
                    settings.preferredCollection ===
                    collection

                  return (
                    <button
                      key={collection}
                      type="button"
                      onClick={() =>
                        handleCollectionChange(
                          collection
                        )
                      }
                      className={`cursor-pointer rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] transition ${
                        selected
                          ? "border-white bg-white text-black"
                          : "border-white/10 text-neutral-500 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {collection}
                    </button>
                  )
                }
              )}
            </div>
          </div>

          <SettingRow
            icon={<FiHeart size={17} />}
            title="Wishlist"
            description="Keep wishlist functionality enabled on your account."
            enabled={settings.wishlistEnabled}
            onClick={() => toggleSetting("wishlistEnabled")}
          />

          <SettingRow
            icon={<FiShoppingBag size={17} />}
            title="Cart Reminders"
            description="Allow reminders about products saved in your cart."
            enabled={settings.cartReminders}
            onClick={() => toggleSetting("cartReminders")}
          />
        </section>

        {/* Privacy & Security */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
                <FiShield size={18} />
                </div>

                <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                    Privacy & Security
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                    Manage your account and session controls.
                </p>
                </div>
            </div>

            <div className="mt-5 divide-y divide-white/10">
                <Link
                to="/profile"
                className="flex items-center justify-between py-5 transition hover:text-neutral-300"
                >
                <div>
                    <p className="text-sm font-semibold">
                    Account Information
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                    Update your name, email and profile picture.
                    </p>
                </div>

                <FiChevronRight
                    size={18}
                    className="text-neutral-600"
                />
                </Link>

                <Link
                to="/change-password"
                className="flex items-center justify-between py-5 transition hover:text-neutral-300"
                >
                <div>
                    <p className="text-sm font-semibold">
                    Change Password
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                    Update your current account password.
                    </p>
                </div>

                <FiChevronRight
                    size={18}
                    className="text-neutral-600"
                />
                </Link>

                <button
                type="button"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center justify-between py-5 text-left transition hover:text-neutral-300"
                >
                <div>
                    <p className="text-sm font-semibold">
                    Logout
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                    Sign out from this device.
                    </p>
                </div>

                <FiLogOut
                    size={18}
                    className="text-neutral-600"
                />
                </button>
            </div>
        </section>

        {/* Account Management */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <FiUser size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                Account Management
              </h2>

              <p className="mt-1 text-xs text-neutral-500">
                Quickly access your account sections.
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-white/10">
            <Link
              to="/profile"
              className="flex items-center justify-between py-5"
            >
              <div>
                <p className="text-sm font-semibold">
                  Edit Profile
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  Manage your personal information.
                </p>
              </div>

              <FiChevronRight
                size={18}
                className="text-neutral-600"
              />
            </Link>

            <Link
              to="/addresses"
              className="flex items-center justify-between py-5"
            >
              <div>
                <p className="text-sm font-semibold">
                  Manage Addresses
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  Add, edit or manage delivery addresses.
                </p>
              </div>

              <FiMapPin
                size={18}
                className="text-neutral-600"
              />
            </Link>

            <Link
              to="/orders"
              className="flex items-center justify-between py-5"
            >
              <div>
                <p className="text-sm font-semibold">
                  My Orders
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  View your complete order history.
                </p>
              </div>

              <FiPackage
                size={18}
                className="text-neutral-600"
              />
            </Link>
          </div>
        </section>

        {/* Appearance */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <FiMoon size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                Appearance
              </h2>

              <p className="mt-1 text-xs text-neutral-500">
                Manage your visual preferences.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-5 border-t border-white/10 pt-5">
            <div>
              <p className="text-sm font-semibold">
                Dark Mode
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                NAMIKOL currently uses the dark luxury theme.
              </p>
            </div>

            <Toggle
              enabled={settings.darkMode}
              onClick={() =>
                toggleSetting("darkMode")
              }
            />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <FiTrash2 size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-red-400">
                Account Management
              </h2>

              <p className="mt-1 text-xs text-neutral-600">
                Permanent account actions.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">
                Delete Account
              </p>

              <p className="mt-1 max-w-xl text-xs leading-5 text-neutral-500">
                Permanently delete your account and saved data. Order records are retained with personal details removed.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-red-400/20 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-red-400 transition hover:bg-red-500/10"
            >
              <FiTrash2 size={14} />
              Delete Account
            </button>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="mt-10 flex flex-wrap justify-center gap-6">
          <Link
            to="/account"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 transition hover:text-white"
          >
            Back To Account
          </Link>

          <Link
            to="/shop"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 transition hover:text-white"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  )
}

export default Settings
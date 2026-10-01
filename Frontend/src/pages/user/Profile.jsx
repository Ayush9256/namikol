import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiArrowLeft,
  FiSave,
  FiLogOut,
  FiCamera,
  FiX,
  FiEdit3,
  FiMail,
  FiCheckCircle,
  FiShield,
} from "react-icons/fi";

import api from "../../services/api";

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [customer, setCustomer] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    profileImage: "",
  });

  const [saving, setSaving] = useState(false);

  // EMAIL CHANGE
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  // =====================================================
  // LOAD CUSTOMER PROFILE
  // =====================================================

  useEffect(() => {
    const token = localStorage.getItem("namikol-token");

    if (!token) {
      navigate("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await api.get("/customer/profile");

        if (!response.data?.success || !response.data?.customer) {
          throw new Error("Unable to load customer profile.");
        }

        const storedCustomer = response.data.customer;

        setCustomer(storedCustomer);

        setFormData({
          firstName: storedCustomer.firstName || "",
          lastName: storedCustomer.lastName || "",
          email: storedCustomer.email || "",
          phone: storedCustomer.phone || "",
          address: storedCustomer.address || "",
          city: storedCustomer.city || "",
          state: storedCustomer.state || "",
          pincode: storedCustomer.pincode || "",
          profileImage: storedCustomer.profileImage || "",
        });
      } catch (error) {
        console.error("Failed to load customer profile:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("namikol-token");
          localStorage.removeItem("namikol_customer_session");
          navigate("/login");
          return;
        }

        setEmailError(
          error.response?.data?.message ||
            "Unable to load your profile."
        );
      }
    };

    loadProfile();
  }, [navigate]);

  // =====================================================
  // NORMAL FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // PROFILE IMAGE
  // =====================================================

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setFormData((previous) => ({
        ...previous,
        profileImage: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = () => {
    setFormData((previous) => ({
      ...previous,
      profileImage: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // EDIT EMAIL
  // =====================================================

  const handleEditEmail = () => {
    setIsEditingEmail(true);

    setNewEmail(formData.email);
    setOtp("");
    setOtpSent(false);

    setEmailMessage("");
    setEmailError("");
  };

  // =====================================================
  // CANCEL EMAIL EDIT
  // =====================================================

  const handleCancelEmailEdit = () => {
    setIsEditingEmail(false);

    setNewEmail("");
    setOtp("");
    setOtpSent(false);

    setEmailMessage("");
    setEmailError("");
  };

  // =====================================================
  // SEND OTP
  // =====================================================

  const handleSendOtp = async () => {
    const email = newEmail.trim().toLowerCase();

    setEmailMessage("");
    setEmailError("");

    if (!email) {
      setEmailError("Please enter your new email address.");
      return;
    }

    if (email === formData.email.toLowerCase()) {
      setEmailError(
        "This is already your current email address."
      );
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      setSendingOtp(true);

      const response = await api.post(
        "/customer/email/send-otp",
        {
          newEmail: email,
        }
      );

      if (!response.data?.success) {
        setEmailError(
          response.data?.message ||
            "Unable to send OTP."
        );
        return;
      }

      // IMPORTANT:
      // OTP section appears immediately after successful API response.
      setNewEmail(email);
      setOtp("");
      setOtpSent(true);

      setEmailMessage(
        `OTP sent successfully to ${email}.`
      );
    } catch (error) {
      console.error("Send OTP error:", error);

      setEmailError(
        error.response?.data?.message ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // =====================================================
  // OTP INPUT
  // =====================================================

  const handleOtpChange = (event) => {
    const value = event.target.value.replace(/\D/g, "");

    if (value.length <= 6) {
      setOtp(value);
    }

    setEmailError("");
  };

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOtp = async () => {
    setEmailMessage("");
    setEmailError("");

    if (otp.length !== 6) {
      setEmailError("Please enter the complete 6-digit OTP.");
      return;
    }

    try {
      setVerifyingOtp(true);

      const response = await api.post(
        "/customer/email/verify-otp",
        {
          otp,
        }
      );

      if (!response.data?.success) {
        setEmailError(
          response.data?.message ||
            "OTP verification failed."
        );
        return;
      }

      const verifiedEmail =
        response.data.email ||
        newEmail.trim().toLowerCase();

      // Update frontend only after backend verification
      setFormData((previous) => ({
        ...previous,
        email: verifiedEmail,
      }));

      setCustomer((previous) => ({
        ...previous,
        email: verifiedEmail,
      }));

      // Update local session
      const session = localStorage.getItem(
        "namikol_customer_session"
      );

      if (session) {
        try {
          const sessionData = JSON.parse(session);

          localStorage.setItem(
            "namikol_customer_session",
            JSON.stringify({
              ...sessionData,
              email: verifiedEmail,
            })
          );
        } catch (error) {
          console.error(
            "Failed to update local session:",
            error
          );
        }
      }

      setIsEditingEmail(false);
      setOtpSent(false);
      setOtp("");
      setNewEmail("");

      setEmailMessage(
        "Email address verified and updated successfully."
      );
    } catch (error) {
      console.error("Verify OTP error:", error);

      setEmailError(
        error.response?.data?.message ||
          "Invalid or expired OTP."
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSave = async (event) => {
    event.preventDefault();

    if (!customer) {
      return;
    }

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();

    if (!firstName || !lastName) {
      return;
    }

    try {
      setSaving(true);

      const response = await api.patch(
        "/customer/profile",
        {
          firstName,
          lastName,
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        }
      );

      if (!response.data?.success) {
        return;
      }

      const updatedCustomer = response.data.customer;

      setCustomer((previous) => ({
        ...previous,
        ...updatedCustomer,
        profileImage: formData.profileImage,
      }));

      setFormData((previous) => ({
        ...previous,
        firstName: updatedCustomer.firstName || "",
        lastName: updatedCustomer.lastName || "",
        email:
          updatedCustomer.email || previous.email,
        phone: updatedCustomer.phone || "",
        address: updatedCustomer.address || "",
        city: updatedCustomer.city || "",
        state: updatedCustomer.state || "",
        pincode: updatedCustomer.pincode || "",
      }));

      // Update session
      const session = localStorage.getItem(
        "namikol_customer_session"
      );

      if (session) {
        try {
          const sessionData = JSON.parse(session);

          localStorage.setItem(
            "namikol_customer_session",
            JSON.stringify({
              ...sessionData,
              firstName: updatedCustomer.firstName,
              lastName: updatedCustomer.lastName,
              email: updatedCustomer.email,
            })
          );
        } catch (error) {
          console.error(
            "Failed to update customer session:",
            error
          );
        }
      }
    } catch (error) {
      console.error("Update profile error:", error);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CANCEL ALL PROFILE CHANGES
  // =====================================================

  const handleCancel = () => {
    if (!customer) {
      return;
    }

    setFormData({
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
      profileImage: customer.profileImage || "",
    });

    handleCancelEmailEdit();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("namikol-token");
    localStorage.removeItem("namikol_customer_session");
    window.dispatchEvent(new Event("namikol-auth-changed"));

    navigate("/");
  };

  if (!customer) {
    return null;
  }

  const profileImage =
    formData.profileImage ||
    customer.profileImage ||
    "";

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="border-b border-white/10 bg-black">
        <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10 lg:px-16">

          <Link
            to="/account"
            className="group inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500 transition hover:text-white"
          >
            <FiArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-1"
            />

            Back to Account
          </Link>

          <div className="mt-8">

            <p className="text-[10px] font-medium uppercase tracking-[0.55em] text-neutral-600">
              CUSTOMER ACCOUNT
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] sm:text-6xl">
              My Profile
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500">
              Manage your personal information and account details.
            </p>

          </div>

        </div>
      </section>

      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10 lg:px-16 lg:py-14">

        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">

          {/* =================================================
              PROFILE CARD
          ================================================= */}

          <aside className="h-fit rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-7">

            <div className="flex flex-col items-center text-center">

              <div className="relative">

                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[#151515] text-3xl font-black shadow-[0_20px_50px_rgba(0,0,0,0.4)]">

                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    customer.firstName
                      ?.charAt(0)
                      ?.toUpperCase() || "N"
                  )}

                </div>

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white text-black shadow-lg transition hover:bg-neutral-200"
                  title="Change profile picture"
                >
                  <FiCamera size={16} />
                </button>

              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />

              {profileImage && (
                <button
                  type="button"
                  onClick={handleRemoveProfileImage}
                  className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-neutral-600 transition hover:text-white"
                >
                  <FiX size={13} />
                  Remove Photo
                </button>
              )}

              <h2 className="mt-5 text-lg font-semibold">
                {customer.firstName}{" "}
                {customer.lastName}
              </h2>

              <p className="mt-2 break-all text-xs text-neutral-600">
                {customer.email}
              </p>

              <p className="mt-4 text-[10px] uppercase tracking-[0.15em] text-neutral-700">
                JPG, PNG or WEBP · MAX 2MB
              </p>

            </div>

            <div className="mt-8 border-t border-white/10 pt-6">

              <div className="flex items-center gap-3 text-neutral-500">

                <FiUser size={16} />

                <span className="text-xs uppercase tracking-[0.12em]">
                  Customer Account
                </span>

              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="group mt-6 flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3.5 text-neutral-500 transition hover:bg-[#151515] hover:text-white"
              >
                <FiLogOut
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />

                <span className="text-xs font-medium uppercase tracking-[0.14em]">
                  Logout
                </span>
              </button>

            </div>

          </aside>

          {/* =================================================
              PROFILE FORM
          ================================================= */}

          <section className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-7 sm:p-9">

            <div className="border-b border-white/10 pb-7">

              <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-neutral-600">
                PERSONAL INFORMATION
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                Account Details
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Update the information associated with your NAMIKOL account.
              </p>

            </div>

            <form
              onSubmit={handleSave}
              className="mt-8"
            >

              <div className="grid gap-6 sm:grid-cols-2">

                {/* FIRST NAME */}

                <div>

                  <label
                    htmlFor="firstName"
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600"
                  >
                    First Name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                    placeholder="First name"
                  />

                </div>

                {/* LAST NAME */}

                <div>

                  <label
                    htmlFor="lastName"
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600"
                  >
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                    placeholder="Last name"
                  />

                </div>

                {/* =================================================
                    EMAIL
                ================================================= */}

                <div className="sm:col-span-2">

                  <div className="flex items-center justify-between">

                    <label
                      htmlFor="email"
                      className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600"
                    >
                      Email Address
                    </label>

                    {!isEditingEmail && (
                      <button
                        type="button"
                        onClick={handleEditEmail}
                        className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500 transition hover:text-white"
                      >
                        <FiEdit3 size={13} />
                        Edit Email
                      </button>
                    )}

                  </div>

                  {/* CURRENT EMAIL */}

                  {!isEditingEmail && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-[#111111] px-4 py-3.5">

                      <FiMail
                        size={16}
                        className="shrink-0 text-neutral-600"
                      />

                      <span className="min-w-0 flex-1 break-all text-sm text-white">
                        {formData.email}
                      </span>

                      <FiCheckCircle
                        size={17}
                        className="shrink-0 text-green-500"
                      />

                    </div>
                  )}

                  {/* EMAIL EDIT */}

                  {isEditingEmail && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-[#111111] p-5">

                      {/* NEW EMAIL */}

                      <label
                        htmlFor="newEmail"
                        className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-600"
                      >
                        New Email Address
                      </label>

                      <input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(event) => {
                          setNewEmail(event.target.value);
                          setOtpSent(false);
                          setOtp("");
                          setEmailMessage("");
                          setEmailError("");
                        }}
                        disabled={otpSent || sendingOtp}
                        className="mt-3 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="Enter new email address"
                      />

                      {/* INLINE ERROR */}

                      {emailError && (
                        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">
                          {emailError}
                        </div>
                      )}

                      {/* INLINE SUCCESS */}

                      {emailMessage && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-xs text-green-400">
                          <FiCheckCircle size={14} />
                          {emailMessage}
                        </div>
                      )}

                      {/* SEND OTP */}

                      {!otpSent && (
                        <div className="mt-5 flex gap-3">

                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <FiMail size={14} />

                            {sendingOtp
                              ? "Sending..."
                              : "Send OTP"}
                          </button>

                          <button
                            type="button"
                            onClick={handleCancelEmailEdit}
                            disabled={sendingOtp}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 transition hover:bg-[#181818] hover:text-white"
                          >
                            <FiX size={14} />
                            Cancel
                          </button>

                        </div>
                      )}

                      {/* =================================================
                          OTP SECTION
                      ================================================= */}

                      {otpSent && (
                        <div className="mt-6 border-t border-white/10 pt-6">

                          <div className="flex items-start gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
                              <FiShield
                                size={16}
                                className="text-neutral-400"
                              />
                            </div>

                            <div>

                              <p className="text-sm font-semibold text-white">
                                Verify your new email
                              </p>

                              <p className="mt-1 text-xs leading-5 text-neutral-600">
                                Enter the 6-digit OTP sent to{" "}
                                <span className="text-neutral-400">
                                  {newEmail}
                                </span>
                                .
                              </p>

                              <p className="mt-1 text-[11px] text-neutral-700">
                                OTP is valid for 5 minutes.
                              </p>

                            </div>

                          </div>

                          {/* 6 DIGIT OTP FIELD */}

                          <div className="mt-6">

                            <label
                              htmlFor="emailOtp"
                              className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-600"
                            >
                              6-Digit OTP
                            </label>

                            <input
                              id="emailOtp"
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={6}
                              value={otp}
                              onChange={handleOtpChange}
                              className="mt-3 w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-4 text-center text-xl font-bold tracking-[0.55em] text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                              placeholder="••••••"
                            />

                          </div>

                          {/* VERIFY + RESEND */}

                          <div className="mt-5 flex flex-wrap gap-3">

                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={
                                verifyingOtp ||
                                otp.length !== 6
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <FiCheckCircle size={14} />

                              {verifyingOtp
                                ? "Verifying..."
                                : "Verify OTP"}
                            </button>

                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={sendingOtp}
                              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 transition hover:bg-[#181818] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <FiMail size={14} />

                              {sendingOtp
                                ? "Sending..."
                                : "Resend OTP"}
                            </button>

                            <button
                              type="button"
                              onClick={handleCancelEmailEdit}
                              disabled={verifyingOtp || sendingOtp}
                              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 transition hover:bg-[#181818] hover:text-white"
                            >
                              <FiX size={14} />
                              Cancel
                            </button>

                          </div>

                        </div>
                      )}

                    </div>
                  )}

                  {!isEditingEmail && (
                    <p className="mt-2 text-[11px] text-neutral-700">
                      Email changes require OTP verification.
                    </p>
                  )}

                </div>

                {/* PHONE */}

                <div>

                  <label
                    htmlFor="phone"
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600"
                  >
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                    placeholder="Phone number"
                  />

                </div>

                {/* ADDRESS */}

                <div>

                  <label
                    htmlFor="address"
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600"
                  >
                    Address
                  </label>

                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                    placeholder="Your address"
                  />

                </div>

                {/* CITY */}

                <div>

                  <label
                    htmlFor="city"
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                    placeholder="City"
                  />

                </div>

                {/* STATE */}

                <div>

                  <label
                    htmlFor="state"
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600"
                  >
                    State
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                    placeholder="State"
                  />

                </div>

                {/* PINCODE */}

                <div>

                  <label
                    htmlFor="pincode"
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600"
                  >
                    PIN Code
                  </label>

                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleChange}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                    placeholder="PIN code"
                  />

                </div>

              </div>

              {/* MEMBER SINCE */}

              <div className="mt-8">

                <div className="rounded-xl border border-white/10 bg-[#111111] p-5">

                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                    Member Since
                  </p>

                  <p className="mt-3 text-sm text-white">
                    {customer.createdAt
                      ? new Date(
                          customer.createdAt
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "Not available"}
                  </p>

                </div>

              </div>

              {/* ACTION BUTTONS */}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-7 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 transition hover:border-white/20 hover:bg-[#151515] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiX size={15} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiSave
                    size={15}
                    className="transition-transform group-hover:scale-110"
                  />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </section>

        </div>

      </main>

    </div>
  );
}

export default Profile;
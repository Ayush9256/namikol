import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiMapPin,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
} from "react-icons/fi";
import api from "../../services/api";

const emptyForm = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
};

function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [defaultId, setDefaultId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customer/addresses");

      if (response.data?.success) {
        setAddresses(response.data.addresses || []);
      } else {
        setError(
          response.data?.message ||
            "Unable to load addresses."
        );
      }
    } catch (error) {
      console.error(
        "Load addresses error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load addresses."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadAddresses();
    });
    return () => {
      active = false;
    };
  }, [loadAddresses]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
    setError("");
    setSuccess("");
  };

  const openEditForm = (address) => {
    setEditingId(address._id || address.id);

    setFormData({
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine: address.addressLine || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      landmark: address.landmark || "",
    });

    setIsFormOpen(true);
    setError("");
    setSuccess("");
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      return "Please enter your full name.";
    }

    if (!formData.phone.trim()) {
      return "Please enter your phone number.";
    }

    if (
      formData.phone.replace(/\D/g, "").length < 10
    ) {
      return "Please enter a valid phone number.";
    }

    if (!formData.addressLine.trim()) {
      return "Please enter your address.";
    }

    if (!formData.city.trim()) {
      return "Please enter your city.";
    }

    if (!formData.state.trim()) {
      return "Please enter your state.";
    }

    if (!formData.pincode.trim()) {
      return "Please enter your PIN code.";
    }

    if (
      formData.pincode.replace(/\D/g, "").length !== 6
    ) {
      return "PIN code must contain 6 digits.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine: formData.addressLine.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        landmark: formData.landmark.trim(),
      };

      let response;

      if (editingId) {
        response = await api.patch(
          `/customer/addresses/${editingId}`,
          payload
        );
      } else {
        response = await api.post(
          "/customer/addresses",
          payload
        );
      }

      if (!response.data?.success) {
        setError(
          response.data?.message ||
            "Unable to save address."
        );
        return;
      }

      await loadAddresses();

      setSuccess(
        editingId
          ? "Address updated successfully."
          : "Address added successfully."
      );

      setIsFormOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error(
        "Save address error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to save address."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(addressId);
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/customer/addresses/${addressId}`
      );

      if (!response.data?.success) {
        setError(
          response.data?.message ||
            "Unable to delete address."
        );
        return;
      }

      await loadAddresses();

      setSuccess(
        "Address deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete address error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to delete address."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      setDefaultId(addressId);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/customer/addresses/${addressId}/default`
      );

      if (!response.data?.success) {
        setError(
          response.data?.message ||
            "Unable to set default address."
        );
        return;
      }

      await loadAddresses();

      setSuccess(
        "Default address updated successfully."
      );
    } catch (error) {
      console.error(
        "Set default address error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to set default address."
      );
    } finally {
      setDefaultId(null);
    }
  };

  return (
    <main className="min-h-screen bg-black px-5 py-12 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">

        {/* Back */}
        <Link
          to="/account"
          className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
        >
          <FiArrowLeft />
          Back to Account
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              Account
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              My Addresses
            </h1>

            <p className="mt-3 text-sm text-neutral-400">
              Manage your saved delivery addresses.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            <FiPlus />
            Add Address
          </button>
        </div>

        {/* Messages */}
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

        {/* Address Form */}
        {isFormOpen && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-neutral-950 p-6 sm:p-8">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                  {editingId
                    ? "Edit Address"
                    : "New Address"}
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  {editingId
                    ? "Update delivery address"
                    : "Add delivery address"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-full border border-white/10 p-2 text-neutral-400 transition hover:border-white/20 hover:text-white"
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-5 sm:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
                  Full Name
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
                  Phone
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition focus:border-white/30"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
                  Address
                </label>

                <textarea
                  name="addressLine"
                  value={formData.addressLine}
                  onChange={handleChange}
                  placeholder="House no., street, area"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
                  City
                </label>

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
                  State
                </label>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
                  PIN Code
                </label>

                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength={6}
                  placeholder="Enter PIN code"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-400">
                  Landmark
                </label>

                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition focus:border-white/30"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:col-span-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Address"
                    : "Save Address"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-neutral-950 p-10 text-center">
            <p className="text-sm text-neutral-400">
              Loading addresses...
            </p>
          </div>
        ) : addresses.length === 0 ? (
          /* Empty */
          <div className="rounded-3xl border border-white/10 bg-neutral-950 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
              <FiMapPin className="text-xl text-neutral-400" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No saved addresses
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Add an address to make checkout faster.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              <FiPlus />
              Add Your First Address
            </button>
          </div>
        ) : (
          /* Address List */
          <div className="grid gap-5 md:grid-cols-2">
            {addresses.map((address) => {
              const addressId =
                address._id || address.id;

              const isDefault =
                Boolean(address.isDefault);

              return (
                <div
                  key={addressId}
                  className={`rounded-3xl border bg-neutral-950 p-6 transition ${
                    isDefault
                      ? "border-white/30"
                      : "border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.05]">
                        <FiMapPin className="text-neutral-300" />
                      </div>

                      <div>
                        <h2 className="font-semibold">
                          {address.fullName}
                        </h2>

                        {isDefault && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-green-300">
                            <FiCheck />
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(address)
                        }
                        className="rounded-full border border-white/10 p-2.5 text-neutral-400 transition hover:border-white/20 hover:text-white"
                        aria-label="Edit address"
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(addressId)
                        }
                        disabled={
                          deletingId === addressId
                        }
                        className="rounded-full border border-red-500/10 p-2.5 text-red-400 transition hover:border-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete address"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-1.5 text-sm text-neutral-400">
                    <p>{address.addressLine}</p>

                    <p>
                      {address.city},{" "}
                      {address.state} -{" "}
                      {address.pincode}
                    </p>

                    {address.landmark && (
                      <p>
                        Landmark:{" "}
                        {address.landmark}
                      </p>
                    )}

                    <p className="pt-2 text-neutral-300">
                      {address.phone}
                    </p>
                  </div>

                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSetDefault(addressId)
                      }
                      disabled={
                        defaultId === addressId
                      }
                      className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {defaultId === addressId
                        ? "Updating..."
                        : "Set as Default"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default Addresses;
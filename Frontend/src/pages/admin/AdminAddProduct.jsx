import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiImage, FiPlus } from "react-icons/fi";
import api from "../../services/api";

const SHOE_SIZES = [6, 7, 8, 9, 10, 11];

const AdminAddProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    deliveryCharge: "0",
    category: "Sneakers",
    gender: "unisex",
    description: "",
    newArrival: false,
    bestSeller: false,
  });

  const [sizeStocks, setSizeStocks] = useState(
    SHOE_SIZES.reduce((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {})
  );

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSizeStockChange = (size, value) => {
    setSizeStocks((prev) => ({
      ...prev,
      [size]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter product name.");
      return;
    }

    if (!formData.price || Number(formData.price) < 0) {
      alert("Please enter a valid price.");
      return;
    }

    const sizes = SHOE_SIZES.map((size) => ({
      size,
      stock: Number(sizeStocks[size] || 0),
    }));

    const totalStock = sizes.reduce(
      (total, item) => total + item.stock,
      0
    );

    if (totalStock <= 0) {
      alert("Please add stock for at least one shoe size.");
      return;
    }

    if (!imageFile) {
      alert("Please upload a product image.");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      data.append("name", formData.name.trim());
      data.append("price", Number(formData.price));
      data.append("deliveryCharge", Number(formData.deliveryCharge || 0));
      data.append("sizes", JSON.stringify(sizes));
      data.append("category", formData.category);
      data.append("gender", formData.gender);
      data.append("description", formData.description.trim());
      data.append("newArrival", formData.newArrival);
      data.append("bestSeller", formData.bestSeller);
      data.append("image", imageFile);

      await api.post("/products", data);

      alert("Product added successfully! 🛍️");

      navigate("/admin/products");
    } catch (error) {
      console.error(
        "Failed to add product:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Failed to add product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-white/40">
              NAMIKOL ADMIN
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Add Product
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Add a new product to your NAMIKOL store.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#151515] px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:border-white/20 hover:bg-white hover:text-black"
          >
            <FiArrowLeft size={15} />
            Back to Products
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-white/10 bg-[#111111] p-5 md:p-8">

            <div className="grid gap-8 lg:grid-cols-[1fr_280px]">

              {/* LEFT */}
              <div className="space-y-6">

                {/* Product Name */}
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Product Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Price
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="1699"
                    min="0"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Delivery charge per unit (₹)
                  </label>
                  <input
                    type="number"
                    name="deliveryCharge"
                    value={formData.deliveryCharge}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                  />
                  <p className="mt-1 text-xs text-white/35">Set 0 for free delivery.</p>
                </div>

                {/* Size-wise Stock */}
                <div>
                  <div className="mb-3">
                    <label className="block text-sm text-white/70">
                      Size-wise Stock
                    </label>

                    <p className="mt-1 text-xs text-white/35">
                      Enter available quantity for each shoe size.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {SHOE_SIZES.map((size) => (
                      <div
                        key={size}
                        className="rounded-xl border border-white/10 bg-[#0b0b0b] p-3"
                      >
                        <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-white/50">
                          Size {size}
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={sizeStocks[size]}
                          onChange={(e) =>
                            handleSizeStockChange(size, e.target.value)
                          }
                          className="w-full rounded-lg border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category + Gender */}
                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Category
                    </label>

                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                    >
                      <option value="Sneakers">Sneakers</option>
                      <option value="Formals">Formals</option>
                      <option value="Loafers">Loafers</option>
                      <option value="Heels">Heels</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Gender
                    </label>

                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                    >
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>

                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Write product description..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </div>

                {/* Checkboxes */}
                <div className="grid gap-3 sm:grid-cols-2">

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-4">
                    <input
                      type="checkbox"
                      name="newArrival"
                      checked={formData.newArrival}
                      onChange={handleChange}
                      className="h-4 w-4 accent-white"
                    />

                    <span className="text-sm text-white/80">
                      New Arrival
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-4">
                    <input
                      type="checkbox"
                      name="bestSeller"
                      checked={formData.bestSeller}
                      onChange={handleChange}
                      className="h-4 w-4 accent-white"
                    />

                    <span className="text-sm text-white/80">
                      Best Seller
                    </span>
                  </label>

                </div>

              </div>

              {/* RIGHT: IMAGE */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Product Image
                </label>

                <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-[#0b0b0b] transition hover:border-white/30">

                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="h-full min-h-[280px] w-full object-cover"
                    />
                  ) : (
                    <>
                      <FiImage
                        size={32}
                        className="mb-4 text-white/30"
                      />

                      <span className="text-sm text-white/70">
                        Upload Product Image
                      </span>

                      <span className="mt-2 text-xs text-white/30">
                        PNG, JPG, WEBP
                      </span>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

            </div>

            {/* ACTIONS */}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="rounded-full border border-white/10 px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiPlus size={16} />

                {loading ? "Adding..." : "Add Product"}
              </button>

            </div>

          </div>
        </form>

      </div>
    </div>
  );
};

export default AdminAddProduct;
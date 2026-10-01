import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiImage,
  FiSave,
} from "react-icons/fi";

import {
  getProductById,
  updateProduct,
} from "../../services/productService";

const SHOE_SIZES = [6, 7, 8, 9, 10, 11];

const AdminEditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    deliveryCharge: "0",
    description: "",
    category: "Sneakers",
    gender: "unisex",
    newArrival: false,
    bestSeller: false,
    image: "",
  });

  const [sizeStocks, setSizeStocks] = useState(
    SHOE_SIZES.reduce((acc, size) => {
      acc[size] = 0;
      return acc;
    }, {})
  );

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);

        const response = await getProductById(id);

        if (!response?.success || !response?.product) {
          throw new Error("Product not found.");
        }

        const product = response.product;

        const stockMap = SHOE_SIZES.reduce((acc, size) => {
          const existingSize = Array.isArray(product.sizes)
            ? product.sizes.find(
                (item) => Number(item.size) === Number(size)
              )
            : null;

          acc[size] = existingSize
            ? Number(existingSize.stock || 0)
            : 0;

          return acc;
        }, {});

        setFormData({
          name: product.name || "",
          price: product.price ?? "",
          deliveryCharge: product.deliveryCharge ?? 0,
          description: product.description || "",
          category: product.category || "Sneakers",
          gender: product.gender || "unisex",
          newArrival: Boolean(product.newArrival),
          bestSeller: Boolean(product.bestSeller),
          image: product.image || "",
        });

        setSizeStocks(stockMap);
      } catch (error) {
        console.error(
          "Failed to load product:",
          error.response?.data || error.message
        );

        alert(
          error.response?.data?.message ||
            "Product could not be loaded."
        );

        navigate("/admin/products");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id, navigate]);

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
      setFormData((prev) => ({
        ...prev,
        image: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter product name.");
      return;
    }

    if (
      formData.price === "" ||
      Number(formData.price) < 0
    ) {
      alert("Please enter a valid price.");
      return;
    }

    const sizes = SHOE_SIZES.map((size) => ({
      size,
      stock: Number(sizeStocks[size] || 0),
    }));

    const hasInvalidStock = sizes.some(
      (item) =>
        !Number.isInteger(item.stock) ||
        item.stock < 0
    );

    if (hasInvalidStock) {
      alert("Stock must be a whole number and cannot be negative.");
      return;
    }

    const totalStock = sizes.reduce(
      (total, item) => total + item.stock,
      0
    );

    if (totalStock <= 0) {
      alert("Please add stock for at least one size.");
      return;
    }

    try {
      setSaving(true);

      const productData = new FormData();
      productData.append("name", formData.name.trim());
      productData.append("price", String(Number(formData.price)));
      productData.append("deliveryCharge", String(Number(formData.deliveryCharge || 0)));
      productData.append("sizes", JSON.stringify(sizes));
      productData.append("category", formData.category);
      productData.append("gender", formData.gender);
      productData.append("description", formData.description.trim());
      productData.append("newArrival", String(formData.newArrival));
      productData.append("bestSeller", String(formData.bestSeller));
      if (imageFile) {
        productData.append("image", imageFile);
      }

      const response = await updateProduct(id, productData);

      if (!response?.success) {
        throw new Error(
          response?.message || "Product update failed."
        );
      }

      alert("Product updated successfully! ✅");

      navigate("/admin/products");
    } catch (error) {
      console.error(
        "Failed to update product:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to update product."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />

          <p className="mt-4 text-sm text-neutral-500">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-white/40">
              NAMIKOL ADMIN
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Edit Product
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Update your product information.
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

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-white/10 bg-[#111111] p-5 md:p-8">

            <div className="grid gap-8 lg:grid-cols-[1fr_280px]">

              {/* LEFT */}
              <div className="space-y-6">

                {/* NAME */}
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

                {/* PRICE */}
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Price
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
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

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={5000}
                    rows={4}
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                  />
                </div>

                {/* SIZE STOCK */}
                <div>
                  <div className="mb-3">
                    <label className="block text-sm text-white/70">
                      Size-wise Stock
                    </label>

                    <p className="mt-1 text-xs text-white/30">
                      Set available quantity for each shoe size.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {SHOE_SIZES.map((size) => (
                      <div
                        key={size}
                        className="rounded-xl border border-white/10 bg-[#0b0b0b] p-3"
                      >
                        <label className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/40">
                          Size {size}
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={sizeStocks[size]}
                          onChange={(e) =>
                            handleSizeStockChange(
                              size,
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-white/10 bg-[#151515] px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* CATEGORY + GENDER */}
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

                {/* NEW ARRIVAL + BEST SELLER */}
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

              {/* IMAGE */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Product Image
                </label>

                <div className="flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-[#0b0b0b]">

                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt={formData.name}
                      className="h-[280px] w-full object-cover"
                    />
                  ) : (
                    <>
                      <FiImage
                        size={32}
                        className="mb-4 text-white/30"
                      />

                      <span className="text-sm text-white/70">
                        Current image
                      </span>
                    </>
                  )}
                </div>

                <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-xs uppercase tracking-[0.12em] text-white/60 transition hover:border-white/20 hover:text-white">
                  Change Image

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-[11px] leading-5 text-white/30">
                  Image upload will remain unchanged for now. Product
                  data and size inventory are updated through MongoDB.
                </p>
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
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiSave size={16} />

                {saving ? "Saving..." : "Save Changes"}
              </button>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditProduct;
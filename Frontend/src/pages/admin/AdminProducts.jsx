import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBox,
  FiPackage,
  FiAlertCircle,
  FiStar,
  FiTrendingUp,
  FiRefreshCw,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiArrowUpRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import {
  getProducts,
  deleteProduct,
} from "../../services/productService";

const SHOE_SIZES = [6, 7, 8, 9, 10, 11];

const getProductId = (product) => {
  return product?._id || product?.id;
};

const getSizeStock = (product, size) => {
  if (!Array.isArray(product?.sizes)) {
    return 0;
  }

  const sizeItem = product.sizes.find(
    (item) => Number(item?.size) === Number(size)
  );

  return Number(sizeItem?.stock || 0);
};

const getTotalStock = (product) => {
  if (Array.isArray(product?.sizes)) {
    return product.sizes.reduce((total, item) => {
      const stock = Number(item?.stock);

      return (
        total +
        (Number.isFinite(stock) && stock > 0 ? stock : 0)
      );
    }, 0);
  }

  return Math.max(Number(product?.stock) || 0, 0);
};

const isProductOutOfStock = (product) => {
  if (Array.isArray(product?.sizes)) {
    if (product.sizes.length === 0) {
      return true;
    }

    return product.sizes.every(
      (item) => Number(item?.stock || 0) <= 0
    );
  }

  return Number(product?.stock || 0) <= 0;
};

function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getProducts();

      const apiProducts = Array.isArray(data?.products)
        ? data.products
        : [];

      setProducts(apiProducts);
    } catch (err) {
      console.error("Admin Products Fetch Error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load products. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchProducts();
    });
  }, [fetchProducts]);

  /*
   * INVENTORY STATS
   *
   * TOTAL STOCK:
   * Sum of every size stock across every product.
   *
   * OUT OF STOCK:
   * Counts products where ALL available sizes
   * have zero stock.
   */
  const stats = useMemo(() => {
    const totalStock = products.reduce(
      (total, product) => total + getTotalStock(product),
      0
    );

    const outOfStock = products.filter(
      (product) => isProductOutOfStock(product)
    ).length;

    const newArrivals = products.filter(
      (product) => product.newArrival
    ).length;

    const bestSellers = products.filter(
      (product) => product.bestSeller
    ).length;

    return {
      products: products.length,
      totalStock,
      outOfStock,
      newArrivals,
      bestSellers,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name?.toLowerCase().includes(value) ||
        product.category?.toLowerCase().includes(value) ||
        product.gender?.toLowerCase().includes(value)
      );
    });
  }, [products, search]);

  const handleDelete = async (product) => {
    const productId = getProductId(product);

    if (!productId) {
      alert("Product ID not found.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(productId);

      setProducts((currentProducts) =>
        currentProducts.filter(
          (item) => getProductId(item) !== productId
        )
      );

      alert("Product deleted successfully.");
    } catch (err) {
      console.error("Delete Product Error:", err);

      alert(
        err?.response?.data?.message ||
          "Unable to delete product."
      );
    }
  };

  const statCards = [
    {
      title: "PRODUCTS",
      value: stats.products,
      icon: FiBox,
    },
    {
      title: "TOTAL STOCK",
      value: stats.totalStock,
      icon: FiPackage,
    },
    {
      title: "OUT OF STOCK",
      value: stats.outOfStock,
      icon: FiAlertCircle,
    },
    {
      title: "NEW ARRIVALS",
      value: stats.newArrivals,
      icon: FiStar,
    },
    {
      title: "BEST SELLERS",
      value: stats.bestSellers,
      icon: FiTrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-black px-5 py-8 text-white md:px-8 lg:px-10">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">
            NAMIKOL Administration
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Products
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Manage your NAMIKOL product inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#151515] px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:border-white/20 hover:bg-white hover:text-black"
          >
            ← Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/products/add")}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-neutral-200"
          >
            <FiPlus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-[#151515] p-5 transition duration-200 hover:border-white/20 hover:bg-[#181818]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.2em] text-neutral-500">
                    {card.title}
                  </p>

                  <p className="mt-3 text-3xl font-semibold text-white">
                    {loading ? "..." : card.value}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0d0d0d]">
                  <Icon
                    size={18}
                    className="text-neutral-300"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SEARCH + REFRESH */}
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <FiSearch
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            className="w-full rounded-full border border-white/10 bg-[#151515] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
          />
        </div>

        <button
          type="button"
          onClick={() => fetchProducts(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#151515] px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:border-white/20 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiRefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}
      {error && !loading && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-start gap-3">
            <FiAlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div>
              <p className="text-sm font-medium text-red-300">
                Unable to load products
              </p>

              <p className="mt-1 text-xs text-red-300/60">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      <div className="mt-8">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-12 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />

            <p className="mt-4 text-sm text-neutral-500">
              Loading products...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-12 text-center">
            <FiBox
              size={28}
              className="mx-auto text-neutral-600"
            />

            <h2 className="mt-4 text-lg font-medium text-white">
              No products found
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              {search
                ? "Try a different search term."
                : "Add your first product to get started."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={() => navigate("/admin/products/add")}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-neutral-200"
              >
                <FiPlus size={15} />
                Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const productId = getProductId(product);
              const totalStock = getTotalStock(product);
              const productOutOfStock =
                isProductOutOfStock(product);

              return (
                <div
                  key={productId}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#151515] transition duration-200 hover:-translate-y-0.5 hover:border-white/20"
                >
                  {/* IMAGE */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#0d0d0d]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FiBox
                          size={42}
                          className="text-neutral-700"
                        />
                      </div>
                    )}

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {product.newArrival && (
                        <span className="rounded-full border border-white/10 bg-black/80 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                          New Arrival
                        </span>
                      )}

                      {product.bestSeller && (
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-black">
                          Best Seller
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-white">
                          {product.name}
                        </h2>

                        <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
                          {product.category} · {product.gender}
                        </p>
                      </div>

                      <p className="shrink-0 text-base font-semibold text-white">
                        ₹
                        {Number(product.price || 0).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    {/* SIZE-WISE INVENTORY */}
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                            Size-wise Stock
                          </p>

                          <p className="mt-1 text-xs text-neutral-600">
                            Inventory by size
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                            Total
                          </p>

                          <p
                            className={`mt-1 text-sm font-semibold ${
                              productOutOfStock
                                ? "text-red-400"
                                : "text-white"
                            }`}
                          >
                            {totalStock} units
                          </p>
                        </div>
                      </div>

                      {/* SIZE GRID */}
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {SHOE_SIZES.map((size) => {
                          const stock = getSizeStock(
                            product,
                            size
                          );

                          const isOutOfStock = stock === 0;

                          return (
                            <div
                              key={size}
                              className={`rounded-xl border px-3 py-2.5 ${
                                isOutOfStock
                                  ? "border-red-500/10 bg-red-500/5"
                                  : "border-white/10 bg-[#0d0d0d]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                                  Size
                                </span>

                                <span className="text-xs font-semibold text-white">
                                  {size}
                                </span>
                              </div>

                              <div
                                className={`mt-1 text-sm font-semibold ${
                                  isOutOfStock
                                    ? "text-red-400"
                                    : "text-white"
                                }`}
                              >
                                {isOutOfStock
                                  ? "Out of Stock"
                                  : `${stock} units`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                          Inventory Status
                        </p>

                        <p
                          className={`mt-1 text-xs font-medium ${
                            productOutOfStock
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {productOutOfStock
                            ? "Out of Stock"
                            : "In Stock"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {/* EDIT */}
                        <button
                          type="button"
                          title="Edit Product"
                          onClick={() =>
                            navigate(
                              `/admin/products/edit/${productId}`
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#0d0d0d] text-neutral-300 transition hover:border-white/20 hover:bg-white hover:text-black"
                        >
                          <FiEdit2 size={15} />
                        </button>

                        {/* DELETE */}
                        <button
                          type="button"
                          title="Delete Product"
                          onClick={() =>
                            handleDelete(product)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#0d0d0d] text-neutral-400 transition hover:border-red-500/30 hover:bg-red-500 hover:text-white"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* PRODUCT ID */}
                    <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-neutral-600">
                      <span>Product ID</span>

                      <span className="max-w-[150px] truncate">
                        {productId}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER INFO */}
      {!loading && filteredProducts.length > 0 && (
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-neutral-600">
          <span>
            Showing {filteredProducts.length} of{" "}
            {products.length} products
          </span>

          <span className="hidden items-center gap-1 sm:flex">
            NAMIKOL Admin
            <FiArrowUpRight size={13} />
          </span>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;

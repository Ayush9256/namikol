import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBarChart2,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiTrendingUp,
  FiTruck,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const getItems = (order) =>
  Array.isArray(order?.items) ? order.items : [];

const getQuantity = (item) => Number(item?.quantity || 0);

function StatCard({ icon, label, value, helper }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#141414] p-7">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black">
        {icon}
      </div>
      <p className="text-xs uppercase tracking-[3px] text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {helper && <p className="mt-2 text-xs text-gray-600">{helper}</p>}
    </div>
  );
}

function AdminAnalytics() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    try {
      setError("");
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [adminRes, productsRes, ordersRes, customersRes] = await Promise.all([
        api.get("/admin/auth/me"),
        api.get("/products"),
        api.get("/orders/admin"),
        api.get("/customer/admin/count"),
      ]);

      if (!adminRes.data?.success || !adminRes.data?.admin) {
        navigate("/admin/login", { replace: true });
        return;
      }

      if (!productsRes.data?.success) {
        throw new Error(productsRes.data?.message || "Unable to load products.");
      }

      if (!ordersRes.data?.success) {
        throw new Error(ordersRes.data?.message || "Unable to load orders.");
      }

      if (!customersRes.data?.success) {
        throw new Error(customersRes.data?.message || "Unable to load customers.");
      }

      setProducts(Array.isArray(productsRes.data.products) ? productsRes.data.products : []);
      setOrders(Array.isArray(ordersRes.data.orders) ? ordersRes.data.orders : []);
      setCustomerCount(Number(customersRes.data.count || 0));
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError(err.response?.data?.message || err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAnalytics();
    });
  }, [loadAnalytics]);

  const paidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === "Paid"),
    [orders]
  );

  const statistics = useMemo(() => {
    const revenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const productsSold = paidOrders.reduce(
      (sum, order) =>
        sum + getItems(order).reduce((itemSum, item) => itemSum + getQuantity(item), 0),
      0
    );

    return {
      revenue,
      orders: orders.length,
      paidOrders: paidOrders.length,
      productsSold,
      averageOrderValue: paidOrders.length ? revenue / paidOrders.length : 0,
    };
  }, [orders, paidOrders]);

  const statusStats = useMemo(() => {
    const counts = {
      Placed: 0,
      Processing: 0,
      Shipped: 0,
      "Out for Delivery": 0,
      Delivered: 0,
      Cancelled: 0,
    };

    orders.forEach((order) => {
      if (Object.prototype.hasOwnProperty.call(counts, order.orderStatus)) {
        counts[order.orderStatus] += 1;
      }
    });

    return counts;
  }, [orders]);

  const topProducts = useMemo(() => {
    const map = new Map();

    paidOrders.forEach((order) => {
      getItems(order).forEach((item) => {
        const key = String(item.productId || item._id || item.id || item.name || "unknown");
        const existing = map.get(key) || {
          name: item.name || item.productName || "Unknown Product",
          quantity: 0,
          revenue: 0,
        };

        const quantity = getQuantity(item);
        existing.quantity += quantity;
        existing.revenue += Number(item.price || 0) * quantity;
        map.set(key, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [paidOrders]);

  const revenueByDay = useMemo(() => {
    const map = new Map();

    paidOrders.forEach((order) => {
      const dateValue = order.paidAt || order.createdAt;
      if (!dateValue) return;

      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return;

      const key = date.toISOString().slice(0, 10);
      const existing = map.get(key) || { date: key, revenue: 0, orders: 0 };
      existing.revenue += Number(order.total || 0);
      existing.orders += 1;
      map.set(key, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7);
  }, [paidOrders]);

  const maxRevenue = Math.max(...revenueByDay.map((item) => item.revenue), 1);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="text-center">
          <FiBarChart2 size={32} className="mx-auto animate-pulse text-neutral-700" />
          <p className="mt-5 text-xs uppercase tracking-[4px] text-gray-500">Loading Analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-white/10 bg-black">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 lg:px-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-500">NAMIKOL ADMIN</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Analytics</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadAnalytics(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-neutral-300 transition hover:border-white/20 hover:bg-white/5 disabled:opacity-50"
            >
              <FiRefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>

            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-neutral-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              <FiArrowLeft size={15} />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-10 lg:px-10 lg:py-14">
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-red-300">
            <FiAlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Analytics Error</p>
              <p className="mt-1 text-sm text-red-300/70">{error}</p>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<FiDollarSign size={22} />} label="Total Revenue" value={formatCurrency(statistics.revenue)} helper="Paid orders only" />
          <StatCard icon={<FiShoppingBag size={22} />} label="Total Orders" value={statistics.orders} helper={`${statistics.paidOrders} paid`} />
          <StatCard icon={<FiPackage size={22} />} label="Products Sold" value={statistics.productsSold} helper="Units from paid orders" />
          <StatCard icon={<FiUsers size={22} />} label="Customers" value={customerCount} helper="Registered customer accounts" />
        </section>

        <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-[#141414] p-7">
            <p className="text-xs uppercase tracking-[3px] text-gray-500">Average Order Value</p>
            <p className="mt-3 text-4xl font-black">{formatCurrency(statistics.averageOrderValue)}</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[#141414] p-7">
            <p className="text-xs uppercase tracking-[3px] text-gray-500">Delivered Orders</p>
            <p className="mt-3 text-4xl font-black">{statusStats.Delivered}</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[#141414] p-7">
            <p className="text-xs uppercase tracking-[3px] text-gray-500">Cancelled Orders</p>
            <p className="mt-3 text-4xl font-black">{statusStats.Cancelled}</p>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-white/10 bg-[#141414] p-7 md:p-9">
          <div className="mb-10 flex items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <FiTrendingUp size={20} />
                <h2 className="text-2xl font-black">Revenue Overview</h2>
              </div>
              <p className="mt-2 text-sm text-gray-500">Last 7 available paid-order dates.</p>
            </div>
            <FiBarChart2 size={25} className="text-gray-600" />
          </div>

          {revenueByDay.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-gray-600">No paid revenue data available yet.</div>
          ) : (
            <div className="space-y-6">
              {revenueByDay.map((day) => {
                const width = Math.max((day.revenue / maxRevenue) * 100, 4);
                return (
                  <div key={day.date}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="text-gray-400">{formatDate(day.date)}</span>
                      <div className="flex items-center gap-5">
                        <span className="text-gray-600">{day.orders} {day.orders === 1 ? "order" : "orders"}</span>
                        <span className="font-bold">{formatCurrency(day.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#080808]">
                      <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
          <div className="rounded-[30px] border border-white/10 bg-[#141414] p-7 md:p-9">
            <div className="mb-8 flex items-center gap-3">
              <FiPackage size={20} />
              <div>
                <h2 className="text-2xl font-black">Top Products</h2>
                <p className="mt-1 text-sm text-gray-500">Units sold from paid orders.</p>
              </div>
            </div>

            {topProducts.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-600">No product sales yet.</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={`${product.name}-${index}`} className="flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-[#0d0d0d] p-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-black">{index + 1}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{product.name}</p>
                        <p className="mt-1 text-xs text-gray-600">{product.quantity} units</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-bold">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#141414] p-7 md:p-9">
            <div className="mb-8 flex items-center gap-3">
              <FiBarChart2 size={20} />
              <div>
                <h2 className="text-2xl font-black">Order Status</h2>
                <p className="mt-1 text-sm text-gray-500">Current status distribution.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatusBox icon={<FiClock size={17} />} label="Placed" value={statusStats.Placed} />
              <StatusBox icon={<FiClock size={17} />} label="Processing" value={statusStats.Processing} />
              <StatusBox icon={<FiTruck size={17} />} label="Shipped" value={statusStats.Shipped} />
              <StatusBox icon={<FiTruck size={17} />} label="Out for Delivery" value={statusStats["Out for Delivery"]} />
              <StatusBox icon={<FiCheckCircle size={17} />} label="Delivered" value={statusStats.Delivered} />
              <StatusBox icon={<FiXCircle size={17} />} label="Cancelled" value={statusStats.Cancelled} />
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Link to="/admin/products" className="rounded-2xl border border-white/10 bg-[#141414] p-6 transition hover:border-white/20 hover:bg-[#181818]">
            <FiBox size={20} className="text-gray-400" />
            <p className="mt-5 text-lg font-semibold">Products</p>
            <p className="mt-2 text-sm text-gray-500">{products.length} products currently in the store.</p>
          </Link>
          <Link to="/admin/orders" className="rounded-2xl border border-white/10 bg-[#141414] p-6 transition hover:border-white/20 hover:bg-[#181818]">
            <FiShoppingBag size={20} className="text-gray-400" />
            <p className="mt-5 text-lg font-semibold">Orders</p>
            <p className="mt-2 text-sm text-gray-500">Open the live MongoDB order management page.</p>
          </Link>
          <Link to="/admin/customers" className="rounded-2xl border border-white/10 bg-[#141414] p-6 transition hover:border-white/20 hover:bg-[#181818]">
            <FiUsers size={20} className="text-gray-400" />
            <p className="mt-5 text-lg font-semibold">Customers</p>
            <p className="mt-2 text-sm text-gray-500">{customerCount} registered customer accounts.</p>
          </Link>
        </section>
      </main>
    </div>
  );
}

function StatusBox({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-gray-500">{icon}</span>
        <span className="text-2xl font-black">{value}</span>
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-[2px] text-gray-600">{label}</p>
    </div>
  );
}

export default AdminAnalytics;

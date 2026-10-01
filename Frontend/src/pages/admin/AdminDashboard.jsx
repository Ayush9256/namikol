import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBox,
  FiShoppingBag,
  FiUsers,
  FiTrendingUp,
  FiSearch,
  FiBell,
  FiLogOut,
  FiArrowUpRight,
  FiSettings,
  FiMail,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const avatarInputRef = useRef(null);

  // ===============================
  // ADMIN SESSION
  // ===============================

  useEffect(() => {
    let mounted = true;

    const loadAdmin = async () => {
      try {
        const response = await api.get("/admin/auth/me");

        if (!response.data?.success || !response.data?.admin) {
          throw new Error("Admin session not found.");
        }

        if (mounted) {
          setAdmin(response.data.admin);
        }
      } catch (error) {
        console.error("Failed to load admin session:", error);

        if (mounted) {
          navigate("/admin/login", { replace: true });
        }
      } finally {
        if (mounted) {
          setAdminLoading(false);
        }
      }
    };

    loadAdmin();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // ===============================
  // DASHBOARD DATA
  // ===============================

  useEffect(() => {
    if (!admin) {
      return;
    }

    let mounted = true;

    const loadDashboardData = async () => {
      try {
        setDataLoading(true);
        setDataError("");

        const [
          productsResponse,
          ordersResponse,
          customersResponse,
        ] = await Promise.all([
          api.get("/products"),
          api.get("/orders/admin"),
          api.get("/customer/admin/count"),
        ]);

        if (!mounted) {
          return;
        }

        if (productsResponse.data?.success) {
          setProducts(productsResponse.data.products || []);
        } else {
          setProducts([]);
        }

        if (ordersResponse.data?.success) {
          setOrders(ordersResponse.data.orders || []);
        } else {
          setOrders([]);
        }

        if (customersResponse.data?.success) {
          setCustomerCount(Number(customersResponse.data.count || 0));
        } else {
          setCustomerCount(0);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);

        if (mounted) {
          setDataError(
            error.response?.data?.message ||
              "Unable to load dashboard data."
          );
        }
      } finally {
        if (mounted) {
          setDataLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, [admin]);

  useEffect(() => {
    if (!admin) return undefined;

    let active = true;
    const loadUnreadCount = async () => {
      try {
        const response = await api.get("/admin/messages/unread-count");
        if (active) {
          setUnreadMessageCount(Number(response.data?.unreadCount || 0));
        }
      } catch {
        if (active) setUnreadMessageCount(0);
      }
    };

    void loadUnreadCount();
    const intervalId = window.setInterval(loadUnreadCount, 60000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [admin]);

  // ===============================
  // REVENUE
  // ===============================

  const totalRevenue = useMemo(() => {
    return orders
      .filter((order) => order.paymentStatus === "Paid")
      .reduce((total, order) => {
        return total + Number(order.total || 0);
      }, 0);
  }, [orders]);

  // ===============================
  // DASHBOARD STATS
  // ===============================

  const stats = useMemo(
    () => [
      {
        title: "TOTAL PRODUCTS",
        value: dataLoading ? "..." : products.length,
        icon: FiBox,
        link: "/admin/products",
      },
      {
        title: "TOTAL ORDERS",
        value: dataLoading ? "..." : orders.length,
        icon: FiShoppingBag,
        link: "/admin/orders",
      },
      {
        title: "CUSTOMERS",
        value: dataLoading ? "..." : customerCount,
        icon: FiUsers,
        link: "/admin/customers",
      },
      {
        title: "REVENUE",
        value: dataLoading
          ? "..."
          : `₹${totalRevenue.toLocaleString("en-IN")}`,
        icon: FiTrendingUp,
        link: "/admin/analytics",
      },
    ],
    [
      products.length,
      orders.length,
      customerCount,
      totalRevenue,
      dataLoading,
    ]
  );

  const dashboardLinks = [
    {
      title: "PRODUCTS",
      description: "Manage products, pricing and inventory.",
      icon: FiBox,
      path: "/admin/products",
    },
    {
      title: "ORDERS",
      description: "View and manage customer orders.",
      icon: FiShoppingBag,
      path: "/admin/orders",
    },
    {
      title: "CUSTOMERS",
      description: "View customer accounts and order history.",
      icon: FiUsers,
      path: "/admin/customers",
    },
    {
      title: "ANALYTICS",
      description: "Track sales, revenue and performance.",
      icon: FiTrendingUp,
      path: "/admin/analytics",
    },
    {
      title: "SETTINGS",
      description: "Manage store and administrator settings.",
      icon: FiSettings,
      path: "/admin/settings",
    },
    {
      title: "MESSAGES",
      description: "Read customer enquiries and manage public contact details.",
      icon: FiMail,
      path: "/admin/messages",
    },
  ];

  // ===============================
  // LOGOUT
  // ===============================

  const handleLogout = async () => {
    try {
      await api.post("/admin/auth/logout");
    } catch (error) {
      console.error("Admin logout failed:", error);
    } finally {
      navigate("/admin/login", { replace: true });
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setAvatarSaving(true);
      const response = await api.patch("/admin/auth/profile-picture", formData);
      if (response.data?.admin) setAdmin(response.data.admin);
    } catch (error) {
      window.alert(
        error.response?.data?.message || "Unable to upload profile picture."
      );
    } finally {
      setAvatarSaving(false);
      event.target.value = "";
    }
  };

  // ===============================
  // LOADING
  // ===============================

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Checking admin session...
        </p>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  const adminName = admin.name || "Administrator";
  const adminEmail = admin.email || "Admin";
  const adminInitial = adminName.charAt(0).toUpperCase();
  const adminAvatar = admin.avatar || "";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-[270px] shrink-0 border-r border-white/10 bg-[#0a0a0a] lg:flex lg:flex-col">
          {/* BRAND */}
          <div className="border-b border-white/10 px-7 py-7">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
              NAMIKOL
            </p>

            <h1 className="mt-2 text-lg font-semibold tracking-tight text-white">
              Admin Dashboard
            </h1>
          </div>

          {/* ADMIN INFO */}
          <div className="border-b border-white/10 px-6 py-6">
              <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarSaving}
                title="Upload admin profile picture"
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-semibold text-black disabled:opacity-60"
              >
                {adminAvatar ? (
                  <img src={adminAvatar} alt="Admin profile" className="h-full w-full object-cover" />
                ) : adminInitial}
              </button>

              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {adminName}
                </p>

                <p className="mt-1 truncate text-xs text-neutral-500">
                  {adminEmail}
                </p>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 px-4 py-6">
            <p className="px-3 pb-3 text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-600">
              Management
            </p>

            <div className="space-y-1">
              <Link
                to="/admin/dashboard"
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white px-3 py-3 text-sm font-medium text-black"
              >
                <FiTrendingUp size={17} />
                <span>DASHBOARD</span>
              </Link>

              {dashboardLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-neutral-400 transition hover:bg-white/5 hover:text-white"
                  >
                    <Icon
                      size={17}
                      className="transition group-hover:scale-105"
                    />

                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* LOGOUT */}
          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-neutral-400 transition hover:bg-white/5 hover:text-white"
            >
              <FiLogOut size={17} />
              <span>LOGOUT</span>
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="min-w-0 flex-1 bg-black">
          {/* TOP BAR */}
          <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between border-b border-white/10 bg-black/95 px-5 backdrop-blur-md md:px-8">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="hidden text-xs font-medium uppercase tracking-[0.18em] text-neutral-400 transition hover:text-white sm:block"
              >
                Go to Website
              </Link>

              <span className="hidden h-4 w-px bg-white/10 sm:block" />

              <p className="text-sm font-medium text-white">Dashboard</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen((current) => !current)}
                  aria-label={mobileNavOpen ? "Close admin navigation" : "Open admin navigation"}
                  aria-expanded={mobileNavOpen}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#151515] text-neutral-300"
                >
                  {mobileNavOpen ? <FiX size={17} /> : <FiMenu size={17} />}
                </button>

                {mobileNavOpen && (
                  <nav className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-white/10 bg-[#111111] p-2 shadow-2xl">
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMobileNavOpen(false)}
                      className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-sm font-medium text-black"
                    >
                      <FiTrendingUp size={17} />
                      DASHBOARD
                    </Link>
                    {dashboardLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.title}
                          to={item.path}
                          onClick={() => setMobileNavOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-neutral-400 transition hover:bg-white/5 hover:text-white"
                        >
                          <Icon size={17} />
                          {item.title}
                        </Link>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileNavOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-neutral-400 transition hover:bg-white/5 hover:text-white"
                    >
                      <FiLogOut size={17} />
                      LOGOUT
                    </button>
                  </nav>
                )}
              </div>

              {/* SEARCH */}
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#151515] text-neutral-300 transition hover:border-white/20 hover:bg-white hover:text-black"
                title="Search"
              >
                <FiSearch size={17} />
              </button>

              {/* NOTIFICATIONS */}
              <Link
                to="/admin/messages"
                aria-label={`Messages, ${unreadMessageCount} unread`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#151515] text-neutral-300 transition hover:border-white/20 hover:bg-white hover:text-black"
                title="Customer messages"
              >
                <FiBell size={17} />
                {unreadMessageCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                  </span>
                )}
              </Link>

              {/* PROFILE */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarSaving}
                title="Upload admin profile picture"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-semibold text-black disabled:opacity-60"
              >
                {adminAvatar ? (
                  <img src={adminAvatar} alt="Admin profile" className="h-full w-full object-cover" />
                ) : adminInitial}
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </header>

          {/* CONTENT */}
          <section className="px-5 py-8 md:px-8 lg:px-10">
            {/* PAGE INTRO */}
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
                  NAMIKOL Administration
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Welcome back, {adminName}.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
                  Manage your products, orders, customers and store
                  performance from one place.
                </p>
              </div>

              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-white/15 bg-[#151515] px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:border-white hover:bg-white hover:text-black md:self-auto"
              >
                Go to Website
                <FiArrowUpRight size={15} />
              </Link>
            </div>

            {/* ERROR */}
            {dataError && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {dataError}
              </div>
            )}

            {/* STATS */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    to={item.link}
                    className="group rounded-2xl border border-white/10 bg-[#151515] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#181818]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-medium tracking-[0.2em] text-neutral-500">
                          {item.title}
                        </p>

                        <p className="mt-4 text-3xl font-semibold text-white">
                          {item.value}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0d0d0d] text-neutral-300">
                        <Icon size={18} />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-xs text-neutral-500">
                      <span>Open section</span>

                      <FiArrowUpRight
                        size={14}
                        className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* MANAGEMENT */}
            <div className="mt-10">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500">
                  Management
                </p>

                <h3 className="mt-2 text-xl font-semibold text-white">
                  Store Overview
                </h3>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                {dashboardLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.title}
                      to={item.path}
                      className="group rounded-2xl border border-white/10 bg-[#151515] p-6 transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#181818]"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0d0d0d] text-neutral-300">
                          <Icon size={20} />
                        </div>

                        <FiArrowUpRight
                          size={18}
                          className="text-neutral-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                        />
                      </div>

                      <h4 className="mt-6 text-lg font-semibold text-white">
                        {item.title}
                      </h4>

                      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
                        {item.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* QUICK INFO */}
            <div className="mt-10 rounded-2xl border border-white/10 bg-[#151515] p-6 md:p-8">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500">
                Admin Workspace
              </p>

              <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-white">
                    Your store, one control center.
                  </h3>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                    Product, order, customer and analytics management
                    now use live backend store data.
                  </p>
                </div>

                <Link
                  to="/admin/products"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-neutral-200"
                >
                  Manage Products
                  <FiArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
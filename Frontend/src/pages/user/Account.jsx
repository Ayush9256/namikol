import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FiUser,
  FiPackage,
  FiHeart,
  FiMapPin,
  FiSettings,
  FiLogOut,
  FiChevronRight,
  FiArrowUpRight,
} from "react-icons/fi";

function Account() {
  const navigate = useNavigate();
  const [customer] = useState(() => {
    try {
      const session = localStorage.getItem("namikol_customer_session");
      return session ? JSON.parse(session) : null;
    } catch {
      localStorage.removeItem("namikol_customer_session");
      return null;
    }
  });

  useEffect(() => {
    if (!customer) {
      navigate("/login");
    }
  }, [customer, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("namikol-token")
    localStorage.removeItem("namikol_customer_session")
    window.dispatchEvent(new Event("namikol-auth-changed"))
    navigate("/")
  }

  if (!customer) {
    return null;
  }

  const menuItems = [
    {
      title: "Overview",
      icon: FiUser,
      path: "/account",
      active: true,
    },
    {
      title: "My Orders",
      icon: FiPackage,
      path: "/orders",
    },
    {
      title: "Wishlist",
      icon: FiHeart,
      path: "/wishlist",
    },
    {
      title: "Addresses",
      icon: FiMapPin,
      path: "/addresses",
    },
    {
      title: "Settings",
      icon: FiSettings,
      path: "/settings",
    },
  ];

  const quickActions = [
    {
      title: "My Orders",
      description: "Track your purchases and view order details.",
      icon: FiPackage,
      path: "/orders",
    },
    {
      title: "Wishlist",
      description: "View the products you've saved for later.",
      icon: FiHeart,
      path: "/wishlist",
    },
    {
      title: "My Profile",
      description: "Update your personal information.",
      icon: FiUser,
      path: "/profile",
    },
    {
      title: "Addresses",
      description: "Manage your shipping and delivery addresses.",
      icon: FiMapPin,
      path: "/addresses",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* PAGE HEADER */}
      <section className="border-b border-white/10 bg-black">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">

          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.55em] text-neutral-600">
                CUSTOMER ACCOUNT
              </p>

              <h1 className="mt-4 text-5xl font-black leading-[0.9] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                Welcome
                <br />
                <span className="text-neutral-500">
                  {customer.firstName}
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-6 text-neutral-500">
                Manage your NAMIKOL account, orders, wishlist and personal
                information from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-fit items-center gap-3 rounded-full border border-white/15 bg-[#111111] px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-neutral-300 transition hover:border-white/30 hover:bg-[#181818] hover:text-white"
            >
              <FiLogOut
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
              Logout
            </button>

          </div>
        </div>
      </section>

      {/* ACCOUNT CONTENT */}
      <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10 lg:px-16 lg:py-14">

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">

          {/* SIDEBAR */}
          <aside className="h-fit rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-5 lg:sticky lg:top-28">

            {/* CUSTOMER INFO */}
            <div className="border-b border-white/10 pb-6">

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#151515] text-lg font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                  {customer.firstName?.charAt(0)?.toUpperCase() || "N"}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {customer.firstName} {customer.lastName}
                  </p>

                  <p className="mt-1 truncate text-xs text-neutral-600">
                    {customer.email}
                  </p>
                </div>

              </div>

            </div>

            {/* MENU */}
            <nav className="mt-4 space-y-1">

              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    className={`group flex items-center justify-between rounded-xl border px-4 py-3.5 transition ${
                      item.active
                        ? "border-white/10 bg-white text-black"
                        : "border-transparent text-neutral-500 hover:border-white/10 hover:bg-[#151515] hover:text-white"
                    }`}
                  >

                    <div className="flex items-center gap-3">

                      <Icon
                        size={17}
                        strokeWidth={1.7}
                      />

                      <span className="text-xs font-medium uppercase tracking-[0.14em]">
                        {item.title}
                      </span>

                    </div>

                    <FiChevronRight
                      size={14}
                      className={`transition-transform ${
                        item.active
                          ? "text-black"
                          : "text-neutral-700 group-hover:translate-x-1 group-hover:text-neutral-300"
                      }`}
                    />

                  </Link>
                );
              })}

            </nav>

            {/* SIDEBAR LOGOUT */}
            <div className="mt-4 border-t border-white/10 pt-4">

              <button
                type="button"
                onClick={handleLogout}
                className="group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-neutral-600 transition hover:bg-[#151515] hover:text-white"
              >
                <FiLogOut
                  size={17}
                  className="transition-transform group-hover:translate-x-0.5"
                />

                <span className="text-xs font-medium uppercase tracking-[0.14em]">
                  Logout
                </span>
              </button>

            </div>

          </aside>

          {/* MAIN CONTENT */}
          <section className="min-w-0">

            {/* OVERVIEW CARD */}
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d] shadow-[0_30px_100px_rgba(0,0,0,0.35)]">

              {/* CARD HEADER */}
              <div className="border-b border-white/10 p-7 sm:p-9">

                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-neutral-600">
                      ACCOUNT OVERVIEW
                    </p>

                    <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                      Your Account
                    </h2>

                    <p className="mt-3 text-sm text-neutral-500">
                      Everything you need to manage your NAMIKOL account.
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    className="group flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500 transition hover:text-white"
                  >
                    Edit Profile

                    <FiArrowUpRight
                      size={14}
                      className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </Link>

                </div>

              </div>

              {/* QUICK ACTIONS */}
              <div className="grid sm:grid-cols-2">

                {quickActions.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.title}
                      to={item.path}
                      className={`group relative min-h-[220px] overflow-hidden p-7 transition duration-300 hover:bg-[#141414] sm:p-8 ${
                        index % 2 === 0
                          ? "sm:border-r sm:border-white/10"
                          : ""
                      } ${
                        index < 2
                          ? "border-b border-white/10"
                          : ""
                      }`}
                    >

                      {/* SUBTLE GLOW */}
                      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/[0.025] blur-3xl transition duration-500 group-hover:bg-white/[0.06]" />

                      <div className="relative flex items-start justify-between">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#151515] text-neutral-300 transition duration-300 group-hover:border-white/20 group-hover:bg-white group-hover:text-black">
                          <Icon
                            size={19}
                            strokeWidth={1.6}
                          />
                        </div>

                        <FiArrowUpRight
                          size={18}
                          className="text-neutral-700 transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white"
                        />

                      </div>

                      <div className="relative mt-12">

                        <h3 className="text-xl font-semibold tracking-tight text-white">
                          {item.title}
                        </h3>

                        <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-600 transition group-hover:text-neutral-500">
                          {item.description}
                        </p>

                      </div>

                    </Link>
                  );
                })}

              </div>

            </div>

            {/* PROFILE SECTION */}
            <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-7 sm:p-9">

              <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-neutral-600">
                    PROFILE
                  </p>

                  <h2 className="mt-3 text-2xl font-bold tracking-tight">
                    Personal Information
                  </h2>
                </div>

                <Link
                  to="/profile"
                  className="group flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500 transition hover:text-white"
                >
                  Edit Profile

                  <FiArrowUpRight
                    size={14}
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>

              </div>

              <div className="grid gap-7 pt-7 sm:grid-cols-2">

                <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                    Full Name
                  </p>

                  <p className="mt-3 text-sm font-medium text-white">
                    {customer.firstName} {customer.lastName}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                    Email Address
                  </p>

                  <p className="mt-3 break-all text-sm font-medium text-white">
                    {customer.email}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                    Customer ID
                  </p>

                  <p className="mt-3 break-all font-mono text-xs text-neutral-500">
                    {customer.id}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                    Member Since
                  </p>

                  <p className="mt-3 text-sm font-medium text-white">
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString(
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

            </div>

          </section>
        </div>
      </main>
    </div>
  );
}

export default Account;
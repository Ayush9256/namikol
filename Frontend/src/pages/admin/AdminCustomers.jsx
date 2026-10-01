import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiBox,
  FiMail,
  FiPhone,
  FiSearch,
  FiTrash2,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../../services/api";

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===============================
  // LOAD CUSTOMERS + ORDERS
  // ===============================

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);

        const [customersRes, ordersRes] = await Promise.all([
          api.get("/customer/admin/list"),
          api.get("/orders/admin"),
        ]);

        const customerList = Array.isArray(customersRes.data?.customers)
          ? customersRes.data.customers
          : [];

        const orderList = Array.isArray(ordersRes.data?.orders)
          ? ordersRes.data.orders
          : [];

        setCustomers(customerList);
        setOrders(orderList);
      } catch (error) {
        console.error("Failed to load customers:", error);

        setCustomers([]);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // ===============================
  // CUSTOMER DATA
  // ===============================

  const customerData = useMemo(() => {
    return customers.map((customer) => {
      const customerId = String(customer._id || customer.id);

      const customerOrders = orders.filter(
        (order) => String(order.customerId || "") === customerId
      );

      const totalSpent = customerOrders
        .filter((order) => order.paymentStatus === "Paid")
        .reduce(
          (total, order) => total + Number(order.total || 0),
          0
        );

      return {
        ...customer,
        id: customerId,
        orderCount: customerOrders.length,
        totalSpent,
      };
    });
  }, [customers, orders]);

  // ===============================
  // SEARCH
  // ===============================

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customerData;
    }

    return customerData.filter((customer) => {
      const fullName =
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim();

      return (
        fullName.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
      );
    });
  }, [customerData, search]);

  // ===============================
  // FORMAT DATE
  // ===============================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ===============================
  // DELETE
  // ===============================

  const handleDelete = async (customer) => {
  const fullName =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim();

  const confirmed = window.confirm(
    `Delete customer "${fullName || customer.email}"?`
  );

  if (!confirmed) {
    return;
  }

  try {
    await api.delete(`/customer/admin/${customer.id}`);

    setCustomers((previousCustomers) =>
      previousCustomers.filter(
        (item) => item.id !== customer.id
      )
    );

    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer(null);
    }

    window.alert("Customer deleted successfully.");
  } catch (error) {
    console.error("Failed to delete customer:", error);

    window.alert(
      error.response?.data?.message ||
        "Unable to delete customer."
    );
  }
};

  // ===============================
  // RENDER
  // ===============================

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 lg:px-10">
        {/* HEADER */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-neutral-500 transition hover:text-white"
            >
              <FiArrowLeft size={14} />
              Dashboard
            </Link>

            <p className="mt-7 text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">
              NAMIKOL Administration
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Customers
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
              View and manage registered customer accounts and their order
              activity.
            </p>
          </div>

          <Link
            to="/admin/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#151515] px-5 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:border-white/20 hover:bg-white hover:text-black"
          >
            Admin Dashboard
            <FiArrowUpRight size={15} />
          </Link>
        </div>

        {/* STATS */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* TOTAL CUSTOMERS */}
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Total Customers
                </p>

                <p className="mt-4 text-3xl font-semibold">
                  {loading ? "..." : customers.length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0d0d0d] text-neutral-300">
                <FiUsers size={18} />
              </div>
            </div>
          </div>

          {/* CUSTOMERS WITH ORDERS */}
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Customers With Orders
                </p>

                <p className="mt-4 text-3xl font-semibold">
                  {loading
                    ? "..."
                    : customerData.filter(
                        (customer) => customer.orderCount > 0
                      ).length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0d0d0d] text-neutral-300">
                <FiBox size={18} />
              </div>
            </div>
          </div>

          {/* REGISTERED ACCOUNTS */}
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Registered Accounts
                </p>

                <p className="mt-4 text-3xl font-semibold">
                  {loading ? "..." : customers.length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0d0d0d] text-neutral-300">
                <FiUser size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mt-8">
          <div className="relative max-w-xl">
            <FiSearch
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full rounded-xl border border-white/10 bg-[#151515] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/25"
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          {/* CUSTOMER LIST */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
            <div className="border-b border-white/10 px-5 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    Customer Accounts
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    {loading
                      ? "Loading customers..."
                      : `${filteredCustomers.length} customer${
                          filteredCustomers.length === 1 ? "" : "s"
                        } found`}
                  </p>
                </div>
              </div>
            </div>

            {/* LOADING */}
            {loading ? (
              <div className="px-6 py-16 text-center">
                <FiUsers
                  size={30}
                  className="mx-auto animate-pulse text-neutral-700"
                />

                <p className="mt-4 text-sm font-medium text-neutral-300">
                  Loading customers
                </p>

                <p className="mt-2 text-xs text-neutral-600">
                  Fetching registered customers from MongoDB.
                </p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              /* EMPTY */
              <div className="px-6 py-16 text-center">
                <FiUsers
                  size={30}
                  className="mx-auto text-neutral-700"
                />

                <p className="mt-4 text-sm font-medium text-neutral-300">
                  No customers found
                </p>

                <p className="mt-2 text-xs text-neutral-600">
                  Registered customers will appear here.
                </p>
              </div>
            ) : (
              /* LIST */
              <div className="divide-y divide-white/10">
                {filteredCustomers.map((customer) => {
                  const fullName =
                    `${customer.firstName || ""} ${
                      customer.lastName || ""
                    }`.trim() || "Unnamed Customer";

                  const isSelected =
                    selectedCustomer?.id === customer.id;

                  return (
                    <div
                      key={customer.id}
                      className={`p-5 transition ${
                        isSelected
                          ? "bg-white/[0.04]"
                          : "hover:bg-white/[0.025]"
                      }`}
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        {/* CUSTOMER */}
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(customer)}
                          className="flex min-w-0 items-center gap-4 text-left"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                            {(
                              customer.firstName?.[0] ||
                              customer.email?.[0] ||
                              "C"
                            ).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {fullName}
                            </p>

                            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-neutral-500">
                              <FiMail size={12} />
                              {customer.email}
                            </p>
                          </div>
                        </button>

                        {/* STATS */}
                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:min-w-[430px]">
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                              Orders
                            </p>

                            <p className="mt-2 text-sm font-medium text-white">
                              {customer.orderCount}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                              Spent
                            </p>

                            <p className="mt-2 text-sm font-medium text-white">
                              ₹
                              {customer.totalSpent.toLocaleString("en-IN")}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                              Joined
                            </p>

                            <p className="mt-2 text-sm font-medium text-white">
                              {formatDate(customer.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCustomer(customer)
                            }
                            className="rounded-lg border border-white/10 px-4 py-2.5 text-xs text-neutral-300 transition hover:border-white/20 hover:bg-white hover:text-black"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(customer)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-neutral-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                            title="Delete customer"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* CUSTOMER DETAILS */}
          <aside className="h-fit rounded-2xl border border-white/10 bg-[#111111]">
            <div className="border-b border-white/10 px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                Customer Details
              </p>
            </div>

            {!selectedCustomer ? (
              <div className="px-6 py-16 text-center">
                <FiUser
                  size={28}
                  className="mx-auto text-neutral-700"
                />

                <p className="mt-4 text-sm text-neutral-400">
                  Select a customer
                </p>

                <p className="mt-2 text-xs leading-5 text-neutral-600">
                  Customer details and order activity will appear here.
                </p>
              </div>
            ) : (
              <div className="p-6">
                {/* CUSTOMER HEADER */}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-semibold text-black">
                    {(
                      selectedCustomer.firstName?.[0] ||
                      selectedCustomer.email?.[0] ||
                      "C"
                    ).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">
                      {`${selectedCustomer.firstName || ""} ${
                        selectedCustomer.lastName || ""
                      }`.trim() || "Unnamed Customer"}
                    </h2>

                    <p className="mt-1 truncate text-xs text-neutral-500">
                      {selectedCustomer.email}
                    </p>
                  </div>
                </div>

                {/* DETAILS */}
                <div className="mt-7 space-y-5">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-600">
                      Customer ID
                    </p>

                    <p className="mt-2 break-all text-xs text-neutral-300">
                      {selectedCustomer.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-600">
                      Email
                    </p>

                    <p className="mt-2 break-all text-sm text-neutral-300">
                      {selectedCustomer.email || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-600">
                      Phone
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-sm text-neutral-300">
                      <FiPhone size={14} />
                      {selectedCustomer.phone || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-600">
                      Registered
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {formatDate(selectedCustomer.createdAt)}
                    </p>
                  </div>

                  {/* ORDER INFO */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-neutral-600">
                        Orders
                      </p>

                      <p className="mt-2 text-xl font-semibold text-white">
                        {selectedCustomer.orderCount}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-neutral-600">
                        Spent
                      </p>

                      <p className="mt-2 text-xl font-semibold text-white">
                        ₹
                        {selectedCustomer.totalSpent.toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* DELETE */}
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedCustomer)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs font-medium uppercase tracking-[0.12em] text-red-400 transition hover:bg-red-500/10"
                  >
                    <FiTrash2 size={14} />
                    Delete Customer
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default AdminCustomers;
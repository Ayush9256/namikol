import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiChevronDown,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";

import api from "../../services/api";

const ORDER_STATUSES = [
  "Placed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const PAYMENT_STATUSES = [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
];

const RETURN_STATUSES = [
  "Not Requested",
  "Requested",
  "Accepted",
  "Received",
  "Completed",
  "Rejected",
];

function formatDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusIcon(status) {
  switch (status) {
    case "Delivered":
      return <FiCheckCircle size={15} />;

    case "Cancelled":
      return <FiXCircle size={15} />;

    case "Shipped":
    case "Out for Delivery":
      return <FiTruck size={15} />;

    case "Processing":
      return <FiClock size={15} />;

    default:
      return <FiPackage size={15} />;
  }
}

function getStatusClass(status) {
  switch (status) {
    case "Delivered":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "Cancelled":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "Shipped":
    case "Out for Delivery":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "Processing":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";

    default:
      return "border-white/10 bg-white/5 text-neutral-300";
  }
}

function getPaymentClass(status) {
  switch (status) {
    case "Paid":
      return "text-emerald-400";

    case "Refunded":
      return "text-purple-400";

    case "Failed":
      return "text-red-400";

    case "Pending":
      return "text-amber-400";

    default:
      return "text-neutral-400";
  }
}

function getReturnClass(status) {
  switch (status) {
    case "Requested":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";

    case "Accepted":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "Received":
      return "border-violet-500/20 bg-violet-500/10 text-violet-400";

    case "Completed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "Rejected":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    default:
      return "border-white/10 bg-white/5 text-neutral-400";
  }
}

function normalizeOrder(order) {
  return {
    ...order,
    id: order?._id || order?.id,
  };
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
  const [updatingReturnId, setUpdatingReturnId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [returnFilter, setReturnFilter] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/orders/admin");

      const fetchedOrders = Array.isArray(response.data?.orders)
        ? response.data.orders.map(normalizeOrder)
        : [];

      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Admin orders load error:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    api.get("/orders/admin")
      .then((response) => {
        if (active) {
          const fetchedOrders = Array.isArray(response.data?.orders)
            ? response.data.orders.map(normalizeOrder)
            : [];
          setOrders(fetchedOrders);
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(
            error.response?.data?.message ||
              "Unable to load orders. Please try again."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleOrderStatusChange = async (
    orderId,
    newStatus
  ) => {
    try {
      setUpdatingOrderId(orderId);
      setErrorMessage("");

      const response = await api.patch(
        `/orders/${orderId}/status`,
        {
          status: newStatus,
        }
      );

      const updatedOrder = response.data?.order;

      if (updatedOrder) {
        const normalizedOrder = normalizeOrder(
          updatedOrder
        );

        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === orderId
              ? normalizedOrder
              : order
          )
        );
      } else {
        await loadOrders();
      }
    } catch (error) {
      console.error(
        "Order status update error:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to update order status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handlePaymentStatusChange = async (
    orderId,
    newStatus
  ) => {
    try {
      setUpdatingPaymentId(orderId);
      setErrorMessage("");

      const response = await api.patch(
        `/orders/${orderId}/payment-status`,
        {
          status: newStatus,
        }
      );

      const updatedOrder = response.data?.order;

      if (updatedOrder) {
        const normalizedOrder = normalizeOrder(
          updatedOrder
        );

        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === orderId
              ? normalizedOrder
              : order
          )
        );
      } else {
        await loadOrders();
      }
    } catch (error) {
      console.error(
        "Payment status update error:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to update payment status."
      );
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleReturnStatusChange = async (orderId, status) => {
    if (!status) return;

    if (
      status === "Completed" &&
      !window.confirm("Issue a Razorpay refund and complete this return?")
    ) {
      return;
    }

    try {
      setUpdatingReturnId(orderId);
      setErrorMessage("");
      const response = await api.patch(
        `/orders/${orderId}/return-status`,
        { status }
      );
      const updatedOrder = response.data?.order;

      if (updatedOrder) {
        const normalizedOrder = normalizeOrder(updatedOrder);
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === orderId ? normalizedOrder : order
          )
        );
      } else {
        await loadOrders();
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to update return status."
      );
    } finally {
      setUpdatingReturnId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const customerName =
        `${order.customer?.firstName || ""} ${
          order.customer?.lastName || ""
        }`.trim();

      const matchesSearch =
        !query ||
        order.orderNumber
          ?.toLowerCase()
          .includes(query) ||
        customerName
          .toLowerCase()
          .includes(query) ||
        order.customer?.email
          ?.toLowerCase()
          .includes(query) ||
        order.shippingAddress?.phone
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        order.orderStatus === statusFilter;

      const matchesPayment =
        paymentFilter === "All" ||
        order.paymentStatus === paymentFilter;

      const matchesReturn =
        returnFilter === "All" ||
        (order.returnStatus || "Not Requested") ===
          returnFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesReturn
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    paymentFilter,
    returnFilter,
  ]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce(
      (total, order) => {
        if (order.paymentStatus !== "Paid") {
          return total;
        }

        return total + Number(order.total || 0);
      },
      0
    );

    return {
      total: orders.length,

      placed: orders.filter(
        (order) => order.orderStatus === "Placed"
      ).length,

      processing: orders.filter(
        (order) =>
          order.orderStatus === "Processing"
      ).length,

      shipped: orders.filter(
        (order) =>
          order.orderStatus === "Shipped" ||
          order.orderStatus === "Out for Delivery"
      ).length,

      delivered: orders.filter(
        (order) =>
          order.orderStatus === "Delivered"
      ).length,

      returnRequests: orders.filter(
        (order) =>
          order.returnStatus === "Requested"
      ).length,

      refunded: orders.filter(
        (order) =>
          order.paymentStatus === "Refunded"
      ).length,

      revenue: totalRevenue,
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 lg:px-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-500">
              NAMIKOL ADMIN
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Orders
            </h1>
          </div>

          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-neutral-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <FiArrowLeft size={15} />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">
        {/* Error */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4">
            <div className="flex items-start gap-3">
              <FiXCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <p className="text-sm font-semibold text-red-300">
                  Unable to process request
                </p>

                <p className="mt-1 text-xs text-red-300/70">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-7">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Total Orders
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Placed
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {stats.placed}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Processing
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {stats.processing}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Shipped
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {stats.shipped}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Delivered
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {stats.delivered}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500/70">
              Return Requests
            </p>

            <p className="mt-3 text-2xl font-semibold text-amber-400">
              {stats.returnRequests}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400/70">
              Refunded
            </p>

            <p className="mt-3 text-2xl font-semibold text-purple-400">
              {stats.refunded}
            </p>
          </div>
        </section>

        {/* Revenue */}
        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Paid Revenue
              </p>

              <p className="mt-2 text-2xl font-semibold">
                ₹{stats.revenue.toLocaleString("en-IN")}
              </p>
            </div>

            <FiCheckCircle
              size={24}
              className="text-emerald-400"
            />
          </div>
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <FiSearch
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search order number, customer or email..."
                className="w-full rounded-xl border border-white/10 bg-black py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/25"
              />
            </div>

            {/* Order Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-white/10 bg-black px-4 py-3 pr-10 text-sm text-neutral-300 outline-none focus:border-white/25 lg:w-48"
              >
                <option value="All">
                  All Order Status
                </option>

                {ORDER_STATUSES.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>

              <FiChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
              />
            </div>

            {/* Payment */}
            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(event) =>
                  setPaymentFilter(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-white/10 bg-black px-4 py-3 pr-10 text-sm text-neutral-300 outline-none focus:border-white/25 lg:w-48"
              >
                <option value="All">
                  All Payment Status
                </option>

                {PAYMENT_STATUSES.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>

              <FiChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
              />
            </div>

            {/* Return */}
            <div className="relative">
              <select
                value={returnFilter}
                onChange={(event) =>
                  setReturnFilter(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-white/10 bg-black px-4 py-3 pr-10 text-sm text-neutral-300 outline-none focus:border-white/25 lg:w-48"
              >
                <option value="All">
                  All Return Status
                </option>

                {RETURN_STATUSES.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>

              <FiChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
              />
            </div>
          </div>
        </section>

        {/* Orders */}
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Order Management
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {filteredOrders.length}{" "}
                {filteredOrders.length === 1
                  ? "Order"
                  : "Orders"}
              </h2>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-neutral-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={14}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
              <FiRefreshCw
                size={30}
                className="mx-auto animate-spin text-neutral-600"
              />

              <h3 className="mt-5 text-lg font-semibold">
                Loading orders...
              </h3>

              <p className="mt-2 text-sm text-neutral-500">
                Fetching orders from the NAMIKOL backend.
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
              <FiPackage
                size={35}
                className="mx-auto text-neutral-700"
              />

              <h3 className="mt-5 text-lg font-semibold">
                No orders found
              </h3>

              <p className="mt-2 text-sm text-neutral-500">
                {orders.length === 0
                  ? "Customer orders will appear here after checkout."
                  : "Try changing your search or filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const customerName =
                  `${order.customer?.firstName || ""} ${
                    order.customer?.lastName || ""
                  }`.trim() ||
                  "Customer";

                const returnStatus =
                  order.returnStatus ||
                  "Not Requested";

                const isExpanded =
                  expandedOrder === order.id;

                const isUpdatingStatus =
                  updatingOrderId === order.id;

                const isUpdatingPayment =
                  updatingPaymentId === order.id;

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                  >
                    {/* Order Header */}
                    <div className="p-5 lg:p-6">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-sm font-semibold">
                              {order.orderNumber}
                            </h3>

                            <span
                              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                                order.orderStatus
                              )}`}
                            >
                              {getStatusIcon(
                                order.orderStatus
                              )}

                              {order.orderStatus}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getReturnClass(
                                returnStatus
                              )}`}
                            >
                              Return: {returnStatus}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500">
                            <span>
                              {formatDate(
                                order.createdAt
                              )}
                            </span>

                            <span>
                              {order.skuCount ||
                                order.items?.length ||
                                0}{" "}
                              SKU
                            </span>

                            <span>
                              {order.itemCount || 0}{" "}
                              Items
                            </span>

                            <span>
                              {order.source ===
                              "buy_now"
                                ? "Buy Now"
                                : "Cart"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                              Customer
                            </p>

                            <p className="mt-1 text-sm text-neutral-200">
                              {customerName}
                            </p>

                            <p className="mt-1 text-xs text-neutral-500">
                              {order.customer?.email ||
                                "N/A"}
                            </p>
                          </div>

                          <div className="min-w-[110px]">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                              Total
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                              ₹
                              {Number(
                                order.total || 0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex flex-col gap-3 sm:flex-row">
                            {/* Order Status */}
                            <div className="relative">
                              <select
                                value={
                                  order.orderStatus ||
                                  "Placed"
                                }
                                disabled={
                                  isUpdatingStatus
                                }
                                onChange={(event) =>
                                  handleOrderStatusChange(
                                    order.id,
                                    event.target.value
                                  )
                                }
                                className="appearance-none rounded-xl border border-white/10 bg-black px-4 py-2.5 pr-9 text-xs font-medium text-neutral-300 outline-none focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {ORDER_STATUSES.map(
                                  (status) => (
                                    <option
                                      key={status}
                                      value={status}
                                    >
                                      {status}
                                    </option>
                                  )
                                )}
                              </select>

                              <FiChevronDown
                                size={13}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                              />
                            </div>

                            {/* Payment Status */}
                            <div className="relative">
                              <select
                                value={
                                  order.paymentStatus ||
                                  "Pending"
                                }
                                disabled={
                                  isUpdatingPayment
                                }
                                onChange={(event) =>
                                  handlePaymentStatusChange(
                                    order.id,
                                    event.target.value
                                  )
                                }
                                className={`appearance-none rounded-xl border border-white/10 bg-black px-4 py-2.5 pr-9 text-xs font-semibold outline-none focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-50 ${getPaymentClass(
                                  order.paymentStatus
                                )}`}
                              >
                                {PAYMENT_STATUSES.map(
                                  (status) => (
                                    <option
                                      key={status}
                                      value={status}
                                    >
                                      Payment: {status}
                                    </option>
                                  )
                                )}
                              </select>

                              <FiChevronDown
                                size={13}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrder(
                                isExpanded
                                  ? null
                                  : order.id
                              )
                            }
                            className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-neutral-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                          >
                            {isExpanded
                              ? "Hide Details"
                              : "View Details"}
                          </button>
                        </div>

                        {/* Return Status Information */}
                        {returnStatus ===
                          "Requested" && (
                          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                            <p className="text-sm font-semibold text-amber-300">
                              Return request pending
                            </p>

                            <p className="mt-1 text-xs text-neutral-500">
                              Choose whether to accept or reject this request.
                            </p>
                            <select
                              value=""
                              disabled={updatingReturnId === order.id}
                              onChange={(event) =>
                                handleReturnStatusChange(order.id, event.target.value)
                              }
                              className="mt-3 rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-white"
                            >
                              <option value="" disabled>Update return</option>
                              <option value="Accepted">Accept return</option>
                              <option value="Rejected">Reject return</option>
                            </select>
                          </div>
                        )}

                        {returnStatus ===
                          "Accepted" && (
                          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4">
                            <p className="text-sm font-semibold text-blue-300">
                              Return accepted
                            </p>

                            <p className="mt-1 text-xs text-neutral-500">
                              Waiting for the returned
                              product to be received.
                            </p>
                            <select
                              value=""
                              disabled={updatingReturnId === order.id}
                              onChange={(event) =>
                                handleReturnStatusChange(order.id, event.target.value)
                              }
                              className="mt-3 rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-white"
                            >
                              <option value="" disabled>Update return</option>
                              <option value="Received">Mark as received</option>
                            </select>
                          </div>
                        )}

                        {returnStatus ===
                          "Received" && (
                          <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
                            <p className="text-sm font-semibold text-violet-300">
                              Return received
                            </p>

                            <p className="mt-1 text-xs text-neutral-500">
                              Return is ready for completion
                              and refund processing.
                            </p>
                            <select
                              value=""
                              disabled={updatingReturnId === order.id}
                              onChange={(event) =>
                                handleReturnStatusChange(order.id, event.target.value)
                              }
                              className="mt-3 rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-white"
                            >
                              <option value="" disabled>Update return</option>
                              <option value="Completed">Issue refund and complete</option>
                            </select>
                          </div>
                        )}

                        {returnStatus ===
                          "Completed" && (
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                            <div className="flex items-center gap-3">
                              <FiCheckCircle
                                size={18}
                                className="text-emerald-400"
                              />

                              <div>
                                <p className="text-sm font-semibold text-emerald-300">
                                  Return completed
                                </p>

                                <p className="mt-1 text-xs text-neutral-500">
                                  Payment has been marked as
                                  refunded.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {returnStatus ===
                          "Rejected" && (
                          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
                            <div className="flex items-center gap-3">
                              <FiXCircle
                                size={18}
                                className="text-red-400"
                              />

                              <div>
                                <p className="text-sm font-semibold text-red-300">
                                  Return rejected
                                </p>

                                <p className="mt-1 text-xs text-neutral-500">
                                  Payment remains unchanged.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-white/10 bg-black/30 p-5 lg:p-6">
                        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                          {/* Products */}
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                              Ordered Products
                            </p>

                            <div className="mt-4 space-y-3">
                              {(order.items || []).map(
                                (item, index) => (
                                  <div
                                    key={`${item.productId}-${item.size}-${index}`}
                                    className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-3"
                                  >
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                          <FiPackage
                                            size={20}
                                            className="text-neutral-700"
                                          />
                                        </div>
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold">
                                        {item.name}
                                      </p>

                                      <p className="mt-1 text-xs text-neutral-500">
                                        {item.category ||
                                          "Product"}{" "}
                                        • Size{" "}
                                        {item.size ||
                                          "N/A"}
                                      </p>

                                      <p className="mt-2 text-xs text-neutral-400">
                                        Qty:{" "}
                                        {item.quantity}
                                        {" × ₹"}
                                        {Number(
                                          item.price || 0
                                        ).toLocaleString(
                                          "en-IN"
                                        )}
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <p className="text-sm font-semibold">
                                        ₹
                                        {Number(
                                          item.itemTotal ??
                                            Number(
                                              item.price || 0
                                            ) *
                                              Number(
                                                item.quantity ||
                                                  0
                                              )
                                        ).toLocaleString(
                                          "en-IN"
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Customer + Address + Payment + Return */}
                          <div className="space-y-5">
                            {/* Customer */}
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                Customer
                              </p>

                              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                <p className="text-sm font-semibold">
                                  {customerName}
                                </p>

                                <p className="mt-1 text-xs text-neutral-500">
                                  {order.customer?.email ||
                                    "N/A"}
                                </p>
                              </div>
                            </div>

                            {/* Address */}
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                Delivery Address
                              </p>

                              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-6 text-neutral-400">
                                <p className="font-semibold text-neutral-200">
                                  {
                                    order
                                      .shippingAddress
                                      ?.fullName
                                  }
                                </p>

                                <p>
                                  {
                                    order
                                      .shippingAddress
                                      ?.phone
                                  }
                                </p>

                                <p>
                                  {
                                    order
                                      .shippingAddress
                                      ?.addressLine
                                  }
                                </p>

                                <p>
                                  {
                                    order
                                      .shippingAddress
                                      ?.city
                                  }
                                  ,{" "}
                                  {
                                    order
                                      .shippingAddress
                                      ?.state
                                  }{" "}
                                  -{" "}
                                  {
                                    order
                                      .shippingAddress
                                      ?.pincode
                                  }
                                </p>

                                {order
                                  .shippingAddress
                                  ?.landmark && (
                                  <p>
                                    Landmark:{" "}
                                    {
                                      order
                                        .shippingAddress
                                        .landmark
                                    }
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Payment */}
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                Payment
                              </p>

                              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">
                                    Method
                                  </span>

                                  <span className="text-neutral-300">
                                    {order.paymentMethod ||
                                      "Razorpay"}
                                  </span>
                                </div>

                                <div className="mt-3 flex justify-between text-xs">
                                  <span className="text-neutral-500">
                                    Status
                                  </span>

                                  <span
                                    className={`font-semibold ${getPaymentClass(
                                      order.paymentStatus
                                    )}`}
                                  >
                                    {order.paymentStatus ||
                                      "Pending"}
                                  </span>
                                </div>

                                <div className="mt-3 border-t border-white/10 pt-3">
                                  <div className="flex justify-between text-sm font-semibold">
                                    <span>
                                      Total
                                    </span>

                                    <span>
                                      ₹
                                      {Number(
                                        order.total || 0
                                      ).toLocaleString(
                                        "en-IN"
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Return */}
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                Return
                              </p>

                              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-neutral-500">
                                    Return Status
                                  </span>

                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getReturnClass(
                                      returnStatus
                                    )}`}
                                  >
                                    {returnStatus}
                                  </span>
                                </div>

                                {order.returnReason && (
                                  <div className="mt-3">
                                    <span className="text-xs text-neutral-500">
                                      Reason
                                    </span>

                                    <p className="mt-1 text-xs text-neutral-300">
                                      {order.returnReason}
                                    </p>
                                  </div>
                                )}

                                {order.returnRequestedAt && (
                                  <div className="mt-3 flex justify-between text-xs">
                                    <span className="text-neutral-500">
                                      Requested
                                    </span>

                                    <span className="text-neutral-300">
                                      {formatDate(
                                        order.returnRequestedAt
                                      )}
                                    </span>
                                  </div>
                                )}

                                {order.returnAcceptedAt && (
                                  <div className="mt-3 flex justify-between text-xs">
                                    <span className="text-neutral-500">
                                      Accepted
                                    </span>

                                    <span className="text-neutral-300">
                                      {formatDate(
                                        order.returnAcceptedAt
                                      )}
                                    </span>
                                  </div>
                                )}

                                {order.returnReceivedAt && (
                                  <div className="mt-3 flex justify-between text-xs">
                                    <span className="text-neutral-500">
                                      Received
                                    </span>

                                    <span className="text-neutral-300">
                                      {formatDate(
                                        order.returnReceivedAt
                                      )}
                                    </span>
                                  </div>
                                )}

                                {order.returnCompletedAt && (
                                  <div className="mt-3 flex justify-between text-xs">
                                    <span className="text-neutral-500">
                                      Completed
                                    </span>

                                    <span className="text-neutral-300">
                                      {formatDate(
                                        order.returnCompletedAt
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminOrders;
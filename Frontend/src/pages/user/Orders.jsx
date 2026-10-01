import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import {
  FiPackage,
  FiCalendar,
  FiArrowRight,
  FiShoppingBag,
  FiXCircle,
  FiRotateCcw,
} from "react-icons/fi"

import api from "../../services/api"

function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [session] = useState(() => {
    try {
      const savedSession = localStorage.getItem(
        "namikol_customer_session"
      )

      return savedSession
        ? JSON.parse(savedSession)
        : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const loadOrders = async () => {
      if (!session) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setErrorMessage("")

        const response = await api.get("/orders")

        setOrders(response.data.orders || [])
      } catch (error) {
        console.error("Failed to load orders:", error)

        setErrorMessage(
          error.response?.data?.message ||
            "Unable to load your orders."
        )
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [session])

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    )

    if (!confirmed) return

    try {
      const response = await api.patch(
        `/orders/${orderId}/cancel`
      )

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                orderStatus:
                  response.data.order?.orderStatus ||
                  "Cancelled",
              }
            : order
        )
      )

      window.alert(
        "Order cancelled successfully."
      )
    } catch (error) {
      console.error(
        "Cancel order error:",
        error
      )

      window.alert(
        error.response?.data?.message ||
          "Unable to cancel this order."
      )
    }
  }

  const handleReturnOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Do you want to request a return for this order?"
    )

    if (!confirmed) return

    try {
      const response = await api.patch(
        `/orders/${orderId}/return`
      )

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                returnStatus:
                  response.data.order?.returnStatus ||
                  "Requested",
              }
            : order
        )
      )

      window.alert(
        "Return request submitted successfully."
      )
    } catch (error) {
      console.error(
        "Return request error:",
        error
      )

      window.alert(
        error.response?.data?.message ||
          "Unable to submit return request."
      )
    }
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-black px-6 py-20 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
            <FiPackage size={30} />
          </div>

          <h1 className="mt-8 text-4xl font-black uppercase tracking-[0.08em]">
            Login Required
          </h1>

          <p className="mt-4 text-sm text-neutral-500">
            Please login to view your orders.
          </p>

          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200"
          >
            Login
            <FiArrowRight size={16} />
          </Link>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-5 py-20 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
            <FiPackage
              size={28}
              className="animate-pulse"
            />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-neutral-500">
            Loading Orders
          </p>
        </div>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-black px-5 py-20 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-red-400/20 bg-red-500/5 px-6 py-16 text-center">
          <FiXCircle
            size={40}
            className="mx-auto text-red-400"
          />

          <h1 className="mt-6 text-2xl font-bold">
            Unable to Load Orders
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-8 rounded-full bg-white px-7 py-4 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200"
          >
            Try Again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black px-5 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.5em] text-neutral-600">
            NAMIKOL
          </p>

          <h1 className="mt-4 text-5xl font-black uppercase tracking-[0.06em] sm:text-6xl">
            My Orders
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500">
            Track and view all the orders placed from your
            NAMIKOL account.
          </p>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <FiShoppingBag
                size={36}
                className="text-neutral-500"
              />
            </div>

            <h2 className="mt-8 text-3xl font-bold">
              No Orders Yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">
              You haven't placed any orders yet. Explore our
              collection and find something you love.
            </p>

            <Link
              to="/shop"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200"
            >
              Start Shopping
              <FiArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const orderId = order._id

              const formattedDate = new Date(
                order.createdAt
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })

              const itemPreview = order.items
                ?.slice(0, 2)
                .map((item) => item.name)
                .join(", ")

              const remainingItems =
                Math.max(
                  (order.items?.length || 0) - 2,
                  0
                )

              const canCancel =
                order.orderStatus === "Placed" ||
                order.orderStatus === "Processing"

              const canReturn = order.returnEligible === true
              const returnDaysLeft = Number(order.returnDaysLeft || 0)

              return (
                <div
                  key={orderId}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 sm:p-6"
                >
                  {/* Top */}
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-lg font-bold">
                          {order.orderNumber}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                            order.orderStatus ===
                            "Cancelled"
                              ? "border-red-400/20 bg-red-500/10 text-red-400"
                              : order.orderStatus ===
                                "Delivered"
                              ? "border-green-400/20 bg-green-500/10 text-green-400"
                              : "border-amber-400/20 bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-2">
                          <FiCalendar size={14} />
                          {formattedDate}
                        </span>

                        <span>
                          {order.skuCount ||
                            order.items?.length ||
                            0}{" "}
                          {(
                            order.skuCount ||
                            order.items?.length ||
                            0
                          ) === 1
                            ? "SKU"
                            : "SKUs"}
                        </span>

                        <span>
                          {order.itemCount || 0}{" "}
                          {order.itemCount === 1
                            ? "Item"
                            : "Items"}
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
                        Total
                      </p>

                      <p className="mt-1 text-2xl font-black">
                        ₹
                        {Number(
                          order.total || 0
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Product Preview */}
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="flex flex-col gap-5">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
                          Products
                        </p>

                        <p className="mt-2 truncate text-sm text-neutral-300">
                          {itemPreview || "Order items"}
                          {remainingItems > 0 &&
                            ` + ${remainingItems} more`}
                        </p>

                        <p className="mt-2 text-xs text-neutral-600">
                          Payment:{" "}
                          <span className="text-neutral-400">
                            {order.paymentStatus}
                          </span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/order-details/${orderId}`}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 px-6 text-xs font-bold uppercase tracking-[0.12em] transition hover:border-white/30 hover:bg-white hover:text-black"
                        >
                          View Details
                          <FiArrowRight size={15} />
                        </Link>

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCancelOrder(
                                orderId
                              )
                            }
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-400/20 bg-red-500/5 px-6 text-xs font-bold uppercase tracking-[0.12em] text-red-400 transition hover:border-red-400/40 hover:bg-red-500/10"
                          >
                            <FiXCircle size={15} />
                            Cancel Order
                          </button>
                        )}

                        {canReturn && (
                          <button
                            type="button"
                            onClick={() =>
                              handleReturnOrder(
                                orderId
                              )
                            }
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/5 px-6 text-xs font-bold uppercase tracking-[0.12em] text-amber-400 transition hover:border-amber-400/40 hover:bg-amber-500/10"
                          >
                            <FiRotateCcw size={15} />
                            Return Order
                          </button>
                        )}

                        {order.returnStatus ===
                          "Requested" && (
                          <span className="inline-flex h-11 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/5 px-6 text-xs font-bold uppercase tracking-[0.12em] text-blue-400">
                            Return Requested
                          </span>
                        )}

                        {order.orderStatus ===
                          "Delivered" &&
                          order.deliveredAt &&
                          order.returnStatus ===
                            "Not Requested" &&
                          !canReturn && (
                            <span className="text-xs text-neutral-600">
                              Return window expired
                            </span>
                          )}

                        {canReturn && (
                          <span className="text-xs text-neutral-600">
                            {returnDaysLeft}{" "}
                            {returnDaysLeft === 1
                              ? "day"
                              : "days"}{" "}
                            left to return
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Back to Account */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/account"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 transition hover:text-white"
          >
            ← Back To Account
          </Link>
        </div>
      </div>
    </main>
  )
}

export default Orders
import { Link, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiMapPin,
  FiPackage,
  FiShoppingBag,
} from "react-icons/fi"

import api from "../../services/api"

function OrderDetails() {
  const { orderId } = useParams()

  const [loadedOrder, setLoadedOrder] = useState({
    orderId: "",
    order: null,
  })

  const loading = loadedOrder.orderId !== orderId
  const order = loading ? null : loadedOrder.order

  useEffect(() => {
    let cancelled = false

    const loadOrder = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`)

        if (!cancelled) {
          setLoadedOrder({
            orderId,
            order: response.data?.order || null,
          })
        }
      } catch (error) {
        console.error("Failed to load order details:", error)

        if (!cancelled) {
          setLoadedOrder({
            orderId,
            order: null,
          })
        }
      }
    }

    loadOrder()

    return () => {
      cancelled = true
    }
  }, [orderId])

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-20 text-center text-white">
        Loading order details...
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-black px-6 py-20 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-400">
            <FiPackage size={30} />
          </div>

          <h1 className="mt-8 text-4xl font-black uppercase tracking-[0.08em]">
            Order Not Found
          </h1>

          <p className="mt-4 text-sm text-neutral-500">
            This order could not be found.
          </p>

          <Link
            to="/orders"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200"
          >
            Back To My Orders
            <FiArrowRight size={16} />
          </Link>
        </div>
      </main>
    )
  }

  const formattedDate = new Date(
    order.createdAt
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const formattedTime = new Date(
    order.createdAt
  ).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <main className="min-h-screen bg-black px-5 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Back */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 transition hover:text-white"
        >
          <FiArrowLeft size={15} />
          Back To My Orders
        </Link>

        {/* Header */}
        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-neutral-600">
              NAMIKOL / ORDER
            </p>

            <h1 className="mt-4 text-4xl font-black uppercase tracking-[0.06em] sm:text-5xl">
              {order.orderNumber}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-2">
                <FiCalendar size={14} />
                {formattedDate}
              </span>

              <span>{formattedTime}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-green-400/20 bg-green-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-green-400">
              {order.orderStatus}
            </span>

            <span
              className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] ${
                order.paymentStatus === "Refunded"
                  ? "border-purple-400/20 bg-purple-500/10 text-purple-400"
                  : order.paymentStatus === "Paid"
                    ? "border-green-400/20 bg-green-500/10 text-green-400"
                    : "border-white/10 bg-white/[0.04] text-neutral-400"
              }`}
            >
              Payment: {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Order Progress */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500/10 text-green-400">
              <FiCheckCircle size={21} />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.1em]">
                Order Placed
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Your order has been successfully placed.
              </p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                Order Items
              </h2>

              <p className="mt-1 text-xs text-neutral-500">
                {order.skuCount || order.items?.length || 0}{" "}
                {(order.skuCount || order.items?.length || 0) === 1
                  ? "SKU"
                  : "SKUs"}{" "}
                • {order.itemCount || 0}{" "}
                {order.itemCount === 1 ? "Item" : "Items"}
              </p>
            </div>

            <FiShoppingBag size={20} className="text-neutral-600" />
          </div>

          <div className="mt-6 space-y-4">
            {order.items?.map((item) => (
              <div
                key={item.cartId}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center"
              >
                <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-neutral-900 sm:h-28 sm:w-28">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-contain p-3"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                    {item.category}
                  </p>

                  <h3 className="mt-1 text-base font-bold">
                    {item.name}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
                    <span>
                      Size:{" "}
                      <span className="text-white">
                        {item.size}
                      </span>
                    </span>

                    <span>
                      Quantity:{" "}
                      <span className="text-white">
                        {item.quantity}
                      </span>
                    </span>
                  </div>

                  {item.quantity > 1 && (
                    <p className="mt-2 text-[10px] text-neutral-600">
                      ₹
                      {Number(item.price).toLocaleString("en-IN")} ×{" "}
                      {item.quantity}
                    </p>
                  )}
                </div>

                <div className="shrink-0 sm:text-right">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
                    Item Total
                  </p>

                  <p className="mt-1 text-xl font-black">
                    ₹
                    {Number(item.itemTotal).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Details */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Delivery Address */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                <FiMapPin size={18} />
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                  Delivery Address
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                  Shipping information
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold">
                {order.shippingAddress?.fullName}
              </p>

              <p className="mt-3 text-xs leading-6 text-neutral-400">
                {order.shippingAddress?.addressLine}
                <br />
                {order.shippingAddress?.city},{" "}
                {order.shippingAddress?.state} -{" "}
                {order.shippingAddress?.pincode}
              </p>

              <p className="mt-3 text-xs text-neutral-500">
                +91 {order.shippingAddress?.phone}
              </p>

              <span className="mt-4 inline-flex rounded-full border border-white/10 px-3 py-1.5 text-[9px] uppercase tracking-[0.12em] text-neutral-400">
                {order.shippingAddress?.type}
              </span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
              Payment Summary
            </h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>

                <span>
                  ₹
                  {Number(order.subtotal || 0).toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              <div className="flex justify-between text-neutral-400">
                <span>Shipping</span>

                <span>
                  {Number(order.shipping || 0) === 0
                    ? "FREE"
                    : `₹${Number(
                        order.shipping
                      ).toLocaleString("en-IN")}`}
                </span>
              </div>

              <div className="border-t border-white/10 pt-5">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-[0.08em]">
                    Total
                  </span>

                  <span className="text-2xl font-black">
                    ₹
                    {Number(order.total || 0).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-600">
                Payment Method
              </p>

              <p className="mt-2 text-sm font-semibold">
                {order.paymentMethod || "Pending"}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-xs text-neutral-500">
                  Payment Status
                </span>

                <span
                  className={`text-xs font-semibold ${
                    order.paymentStatus === "Refunded"
                      ? "text-purple-400"
                      : order.paymentStatus === "Paid"
                        ? "text-green-400"
                        : "text-neutral-400"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {order.refundStatus && order.refundStatus !== "Not Requested" && (
          <div role="status" className="mt-6 rounded-xl border border-white/10 p-4 text-sm text-amber-300">
            Refund: {order.refundStatus === "Review Required" ? "Support is checking your refund" : order.refundStatus}
          </div>
        )}

        {/* Return & Refund Status */}
        {order.returnStatus &&
          order.returnStatus !== "Not Requested" && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                  <FiPackage size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                    Return & Refund
                  </h2>

                  <p className="mt-1 text-xs text-neutral-500">
                    Current status of your return request
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-neutral-500">
                    Return Status
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      order.returnStatus === "Requested"
                        ? "border-amber-400/20 bg-amber-500/10 text-amber-400"
                        : order.returnStatus === "Accepted"
                          ? "border-blue-400/20 bg-blue-500/10 text-blue-400"
                          : order.returnStatus === "Received"
                            ? "border-violet-400/20 bg-violet-500/10 text-violet-400"
                            : order.returnStatus === "Completed"
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-400"
                              : order.returnStatus === "Rejected"
                                ? "border-red-400/20 bg-red-500/10 text-red-400"
                                : "border-white/10 bg-white/[0.04] text-neutral-300"
                    }`}
                  >
                    {order.returnStatus}
                  </span>
                </div>

                {order.returnStatus === "Requested" && (
                  <p className="mt-4 text-xs leading-5 text-amber-400">
                    Your return request has been submitted and is
                    waiting for admin approval.
                  </p>
                )}

                {order.returnStatus === "Accepted" && (
                  <p className="mt-4 text-xs leading-5 text-blue-400">
                    Your return request has been accepted. The returned
                    product is waiting to be received.
                  </p>
                )}

                {order.returnStatus === "Received" && (
                  <p className="mt-4 text-xs leading-5 text-violet-400">
                    Your returned product has been received. Refund
                    processing is pending.
                  </p>
                )}

                {order.returnStatus === "Completed" &&
                  order.paymentStatus === "Refunded" && (
                    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <p className="text-sm font-semibold text-emerald-400">
                        Refund completed
                      </p>

                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Your Razorpay payment has been refunded
                        successfully.
                      </p>
                    </div>
                  )}

                {order.returnStatus === "Rejected" && (
                  <p className="mt-4 text-xs leading-5 text-red-400">
                    Your return request was rejected.
                  </p>
                )}

                {order.returnRequestedAt && (
                  <div className="mt-4 flex justify-between gap-4 border-t border-white/10 pt-4 text-xs">
                    <span className="text-neutral-500">
                      Requested
                    </span>

                    <span className="text-neutral-300">
                      {new Date(
                        order.returnRequestedAt
                      ).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}

                {order.returnAcceptedAt && (
                  <div className="mt-3 flex justify-between gap-4 text-xs">
                    <span className="text-neutral-500">
                      Accepted
                    </span>

                    <span className="text-neutral-300">
                      {new Date(
                        order.returnAcceptedAt
                      ).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}

                {order.returnReceivedAt && (
                  <div className="mt-3 flex justify-between gap-4 text-xs">
                    <span className="text-neutral-500">
                      Received
                    </span>

                    <span className="text-neutral-300">
                      {new Date(
                        order.returnReceivedAt
                      ).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}

                {order.returnCompletedAt && (
                  <div className="mt-3 flex justify-between gap-4 text-xs">
                    <span className="text-neutral-500">
                      Refunded
                    </span>

                    <span className="text-neutral-300">
                      {new Date(
                        order.returnCompletedAt
                      ).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}

                {order.razorpayRefundId && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-600">
                      Refund ID
                    </p>

                    <p className="mt-2 break-all text-xs text-neutral-400">
                      {order.razorpayRefundId}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/shop"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200"
          >
            Continue Shopping
            <FiArrowRight size={16} />
          </Link>

          <Link
            to="/orders"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 px-7 text-xs font-semibold uppercase tracking-[0.14em] transition hover:border-white/30 hover:bg-white hover:text-black"
          >
            Back To My Orders
          </Link>
        </div>
      </div>
    </main>
  )
}

export default OrderDetails
import { Link, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../../services/api"
import {
  FiCheckCircle,
  FiPackage,
  FiMapPin,
  FiCalendar,
  FiArrowRight,
  FiShoppingBag,
} from "react-icons/fi"


function OrderConfirmation() {
  const { orderId } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadOrder = async () => {
      if (!orderId) {
        setNotFound(true)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setNotFound(false)

        const response = await api.get(`/orders/${orderId}`)
        const fetchedOrder = response?.data?.order || response?.data

        if (!cancelled && fetchedOrder) {
          setOrder(fetchedOrder)
        } else if (!cancelled) {
          setNotFound(true)
        }
      } catch (error) {
        console.error("Order confirmation load error:", error)

        if (!cancelled) {
          setNotFound(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
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
      <section className="min-h-[70vh] bg-black px-6 py-20 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-neutral-300">
            <FiPackage size={30} />
          </div>

          <h1 className="mt-8 text-4xl font-bold uppercase tracking-[0.1em]">
            Loading Order
          </h1>

          <p className="mt-4 text-neutral-400">
            Please wait while we load your order details.
          </p>
        </div>
      </section>
    )
  }

  if (notFound || !order) {
    return (
      <section className="min-h-[70vh] bg-black px-6 py-20 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-400">
            <FiPackage size={30} />
          </div>

          <h1 className="mt-8 text-4xl font-bold uppercase tracking-[0.1em]">
            Order Not Found
          </h1>

          <p className="mt-4 text-neutral-400">
            We couldn't find this order.
          </p>

          <Link
            to="/account"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:bg-neutral-200"
          >
            Go To Account
            <FiArrowRight size={17} />
          </Link>
        </div>
      </section>
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
    <section className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Success Header */}
        <div className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-green-400/20 bg-green-500/10 text-green-400">
            <FiCheckCircle size={42} />
          </div>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            NAMIKOL
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] sm:text-5xl">
            Order Placed Successfully
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-neutral-400">
            Thank you for shopping with NAMIKOL.
            Your order has been successfully placed
            and is now being processed.
          </p>
        </div>

        {/* Order Info */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <FiPackage className="text-neutral-400" />

              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Order Number
              </p>
            </div>

            <p className="mt-4 text-lg font-bold">
              {order.orderNumber}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <FiCalendar className="text-neutral-400" />

              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Order Date
              </p>
            </div>

            <p className="mt-4 text-sm font-semibold">
              {formattedDate}
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              {formattedTime}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <FiShoppingBag className="text-neutral-400" />

              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Order Status
              </p>
            </div>

            <p className="mt-4 text-sm font-bold text-green-400">
              {order.orderStatus}
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              Payment: {order.paymentStatus}
            </p>
          </div>
        </div>

        {/* Main Details */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Products */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                  Ordered Products
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                  {order.skuCount}{" "}
                  {order.skuCount === 1
                    ? "SKU"
                    : "SKUs"}{" "}
                  • {order.itemCount}{" "}
                  {order.itemCount === 1
                    ? "Item"
                    : "Items"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {(order.items || []).map((item, index) => (
                <div
                  key={
                    item.cartId ||
                    item.productId ||
                    item._id ||
                    item.id ||
                    `${item.name || "item"}-${item.size || ""}-${index}`
                  }
                  className="flex gap-4 rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-900">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name || "Product"}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.15em] text-neutral-600">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">
                      {item.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
                      <span>
                        Size {item.size}
                      </span>

                      <span>
                        Quantity × {item.quantity}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-bold">
                      ₹
                      {Number(
                        item.itemTotal ??
                        Number(item.price || 0) * Number(item.quantity || 0)
                      ).toLocaleString("en-IN")}
                    </p>

                    {item.quantity > 1 && (
                      <p className="mt-1 text-[10px] text-neutral-600">
                        ₹
                        {Number(item.price || 0).toLocaleString(
                          "en-IN"
                        )}{" "}
                        × {item.quantity}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Address + Summary */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                  <FiMapPin size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                    Delivery Address
                  </h2>

                  <p className="mt-1 text-xs text-neutral-500">
                    Shipping details
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold">
                  {order.shippingAddress?.fullName || "Customer"}
                </p>

                <p className="mt-3 text-xs leading-6 text-neutral-400">
                  {order.shippingAddress?.addressLine || ""}
                  <br />
                  {order.shippingAddress.city},{" "}
                  {order.shippingAddress.state} -{" "}
                  {order.shippingAddress.pincode}
                </p>

                <p className="mt-3 text-xs text-neutral-500">
                  +91 {order.shippingAddress?.phone || ""}
                </p>

                <span className="mt-4 inline-flex rounded-full border border-white/10 px-3 py-1.5 text-[9px] uppercase tracking-[0.12em] text-neutral-400">
                  {order.shippingAddress?.type || "Delivery"}
                </span>
              </div>
            </div>

            {/* Price Summary */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
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
                    {order.shipping === 0
                      ? "FREE"
                      : `₹${order.shipping}`}
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

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  Payment Status
                </p>

                <p className="mt-2 text-sm font-bold">
                  {order.paymentStatus}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/orders"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200"
          >
            View My Orders
            <FiArrowRight size={16} />
          </Link>

          <Link
            to="/account"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 px-7 text-xs font-semibold uppercase tracking-[0.14em] transition hover:border-white/30 hover:bg-white hover:text-black"
          >
            Go To Account
          </Link>

          <Link
            to="/shop"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 px-7 text-xs font-semibold uppercase tracking-[0.14em] transition hover:border-white/30 hover:bg-white hover:text-black"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </section>
  )
}

export default OrderConfirmation
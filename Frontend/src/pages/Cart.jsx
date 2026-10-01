import { Link, useNavigate } from "react-router-dom"
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  X,
  Heart,
} from "lucide-react"

import { useCart } from "../context/useCart"
import { useWishlist } from "../context/useWishlist"

function Cart() {
  const navigate = useNavigate()

  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = useCart()

  const {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
  } = useWishlist()

  const isFavourite = (productId) => {
    return wishlistItems?.some(
      (item) => (item.id || item._id) === productId
    )
  }

  const handleFavourite = (item) => {
    if (isFavourite(item.productId)) {
      removeFromWishlist(item.productId)
      return
    }

    addToWishlist({
      id: item.productId,
      name: item.name,
      category: item.category,
      price: item.price,
      image: item.image || null,
      gender: item.gender,
    })
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#080808] px-6 py-24 text-white lg:px-12">
        <div className="mx-auto flex max-w-[1000px] flex-col items-center justify-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-[#151515]">
            <ShoppingBag size={38} strokeWidth={1.4} />
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.5em] text-neutral-500">
            YOUR BAG
          </p>

          <h1 className="mt-4 text-5xl font-black">
            Your Cart Is Empty
          </h1>

          <p className="mt-4 max-w-md text-neutral-500">
            Looks like you haven't added anything to your cart yet.
          </p>

          <Link
            to="/shop"
            className="mt-8 inline-flex cursor-pointer items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:bg-neutral-200"
          >
            Continue Shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-16 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-neutral-500">
              NAMIKOL
            </p>

            <h1 className="mt-4 text-5xl font-black md:text-7xl">
              Your Cart
            </h1>

            <p className="mt-3 text-neutral-500">
              {cartItems.length}{" "}
              {cartItems.length === 1 ? "item" : "items"} in your bag.
            </p>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400 transition hover:border-red-400/30 hover:text-red-400"
          >
            <X size={15} />
            Clear Cart
          </button>
        </div>

        {/* Cart Items */}
        <div className="space-y-4">
          {cartItems.map((item, index) => {
            const productId = item.productId || item.id || item._id
            const cartId = item.cartId || `${productId}-${item.size || "default"}-${index}`
            const favourite = isFavourite(productId)
            const imageSrc = item.image || null

            return (
              <div
                key={cartId}
                className="rounded-[2rem] border border-white/10 bg-[#111111] p-3 transition hover:border-white/15 sm:p-5"
              >
                <div className="flex gap-3 sm:gap-5">
                  {/* Product Image */}
                  <Link
                    to={`/product/${productId}`}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#181818] sm:h-32 sm:w-28"
                  >
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.name || "Product"}
                        className="h-full w-full object-contain p-3"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.15em] text-neutral-600">
                        No Image
                      </div>
                    )}
                  </Link>

                  {/* Product Details */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
                        {item.category}
                      </p>

                      <h2 className="mt-1 truncate text-lg font-bold">
                        {item.name}
                      </h2>

                      <p className="mt-1 text-sm text-neutral-500">
                        Size:{" "}
                        <span className="text-white">
                          {item.size}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      {/* Quantity */}
                      <div className="flex h-10 items-center rounded-full border border-white/10 bg-[#181818]">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(item.cartId)
                          }
                          className="flex h-full w-10 cursor-pointer items-center justify-center text-neutral-400 transition hover:text-white"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={15} />
                        </button>

                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(item.cartId)
                          }
                          className="flex h-full w-10 cursor-pointer items-center justify-center text-neutral-400 transition hover:text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      {/* Product Price */}
                      <p className="text-lg font-bold">
                        ₹
                        {(
                          Number(item.price || 0) *
                          Number(item.quantity || 0)
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() =>
                      removeFromCart(item.cartId)
                    }
                    aria-label={`Remove ${item.name}`}
                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-600 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row">
                  {/* Buy This */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/checkout?product=${encodeURIComponent(
                          item.productId || item.id || item._id
                        )}`
                      )
                    }
                    className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-7 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200"
                  >
                    Buy This
                    <ArrowRight size={16} />
                  </button>

                  {/* Favourite */}
                  <button
                    type="button"
                    onClick={() =>
                      handleFavourite(item)
                    }
                    className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-6 text-xs font-bold uppercase tracking-[0.12em] transition ${
                      favourite
                        ? "border-red-400/30 bg-red-500/10 text-red-400"
                        : "border-white/10 text-neutral-400 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <Heart
                      size={16}
                      fill={favourite ? "currentColor" : "none"}
                    />

                    {favourite
                      ? "Added To Favourite"
                      : "Add To Favourite"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Continue Shopping */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/shop"
            className="flex h-12 cursor-pointer items-center justify-center rounded-full border border-white/10 px-8 text-xs font-semibold uppercase tracking-[0.14em] transition hover:border-white/30 hover:bg-white hover:text-black"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  )
}

export default Cart
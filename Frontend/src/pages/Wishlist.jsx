import { Link, useNavigate } from "react-router-dom"
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
} from "lucide-react"

import { useWishlist } from "../context/useWishlist"
import { useCart } from "../context/useCart"

function Wishlist() {
  const navigate = useNavigate()

  const {
    wishlistItems,
    wishlistCount,
    removeFromWishlist,
  } = useWishlist()

  const {
    addToCart,
    isInCart,
    removeProductFromCart,
  } = useCart()

  const isLoggedIn = Boolean(
    localStorage.getItem("namikol_customer_session")
  )

  const handleCartAction = (product) => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    const productId = product?.id || product?._id
    const selectedSize = "6"

    if (isInCart(productId, selectedSize)) {
      removeProductFromCart(productId, selectedSize)
      return
    }

    addToCart(
      {
        ...product,
        id: productId,
      },
      selectedSize,
      1
    )
  }

  /* EMPTY WISHLIST */

  if (wishlistItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#080808] px-6 py-24 text-white lg:px-12">
        <div className="mx-auto flex max-w-[1000px] flex-col items-center justify-center text-center">

          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-[#151515]">
            <Heart
              size={38}
              strokeWidth={1.4}
            />
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.5em] text-neutral-500">
            YOUR FAVORITES
          </p>

          <h1 className="mt-4 text-5xl font-black">
            Your Wishlist Is Empty
          </h1>

          <p className="mt-4 max-w-md text-neutral-500">
            Save the products you love and come back to them anytime.
          </p>

          <Link
            to="/shop"
            className="mt-8 inline-flex cursor-pointer items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:bg-neutral-200"
          >
            Explore Collection
            <ArrowRight size={18} />
          </Link>

        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-16 text-white lg:px-12">

      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}

        <div className="mb-12">

          <p className="text-xs uppercase tracking-[0.5em] text-neutral-500">
            NAMIKOL
          </p>

          <h1 className="mt-4 text-5xl font-black md:text-7xl">
            Your Wishlist
          </h1>

          <p className="mt-3 text-neutral-500">
            {wishlistCount}{" "}
            {wishlistCount === 1
              ? "product"
              : "products"}{" "}
            saved in your favorites.
          </p>

        </div>

        {/* PRODUCTS */}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {wishlistItems.map((product) => {

            const productId = product?.id || product?._id
            const productInCart = isInCart(productId, "6")

            return (
              <article
                key={productId}
                className="group"
              >

                {/* IMAGE */}

                <div className="relative overflow-hidden rounded-[2rem] bg-[#151515]">

                  <Link
                    to={`/product/${productId}`}
                    className="block cursor-pointer"
                  >

                    <div className="relative aspect-[4/5] overflow-hidden">

                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#292929_0%,#151515_55%,#0b0b0b_100%)]" />

                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="relative z-10 h-full w-full object-contain p-8 transition duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="relative z-10 flex h-full items-center justify-center text-neutral-600">
                          No Image
                        </div>
                      )}

                      {product.badge && (
                        <span className="absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                          {product.badge}
                        </span>
                      )}

                    </div>

                  </Link>

                  {/* REMOVE FROM WISHLIST */}

                  <button
                    type="button"
                    onClick={() =>
                      removeFromWishlist(productId)
                    }
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="absolute right-4 top-4 z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/70 text-white backdrop-blur-sm transition hover:border-red-400/30 hover:text-red-400"
                  >
                    <Trash2 size={17} />
                  </button>

                </div>

                {/* PRODUCT INFO */}

                <div className="mt-5">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-500">
                        {product.category}
                      </p>

                      <Link
                        to={`/product/${productId}`}
                        className="block cursor-pointer"
                      >

                        <h2 className="mt-2 text-xl font-semibold text-white transition hover:text-neutral-400">
                          {product.name}
                        </h2>

                      </Link>

                    </div>

                    <p className="whitespace-nowrap text-lg font-semibold">
                      ₹{Number(product.price || 0).toLocaleString("en-IN")}
                    </p>

                  </div>

                  {/* CART ACTION */}

                  <button
                    type="button"
                    onClick={() => handleCartAction(product)}
                    className={`mt-5 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full py-4 text-sm font-bold tracking-[0.15em] transition ${
                      productInCart
                        ? "border border-white bg-transparent text-white hover:bg-white hover:text-black"
                        : "bg-white text-black hover:bg-neutral-200"
                    }`}
                  >

                    <ShoppingBag
                      size={18}
                      strokeWidth={2}
                    />

                    {productInCart
                      ? "REMOVE FROM CART"
                      : "ADD TO CART"}

                  </button>

                </div>

              </article>
            )
          })}

        </div>

      </div>

    </main>
  )
}

export default Wishlist
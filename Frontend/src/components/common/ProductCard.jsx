import { useState } from "react"
import { motion } from "framer-motion"
import { ShoppingBag } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { useCart } from "../../context/useCart"

function ProductCard({ product }) {
  const [cartMessage, setCartMessage] = useState("")
  const {
    addToCart,
    isInCart,
    removeProductFromCart,
  } = useCart()

  const navigate = useNavigate()

  const isLoggedIn = Boolean(localStorage.getItem("namikol-token"))

  const productId = product?.id || product?._id
  const selectedSize =
    product?.sizes?.find((item) => Number(item.stock) > 0)?.size || ""

  const productInCart = isInCart(
    productId,
    selectedSize
  )

  const handleCartAction = async () => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    if (productInCart) {
      const result = await removeProductFromCart(
        productId,
        selectedSize
      )
      setCartMessage(result?.message || "")
      return
    }

    const result = await addToCart(
      {
        ...product,
        id: productId,
      },
      selectedSize,
      1
    )
    setCartMessage(result?.success ? "Added to cart." : result?.message || "Unable to add this item.")
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      {/* Product Image */}
      <Link
        to={`/product/${productId}`}
        className="block"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#151515]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#292929_0%,#151515_55%,#0b0b0b_100%)]" />

          <img
            src={product.image}
            alt={product.name}
            className="relative z-10 h-full w-full object-contain p-8 transition duration-500 group-hover:scale-110"
          />

          {product.badge && (
            <span className="absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm">
              {product.badge}
            </span>
          )}
        </div>
      </Link>

      {/* Product Information */}
      <div className="mt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-500">
              {product.category}
            </p>

            <Link
              to={`/product/${productId}`}
              className="block"
            >
              <h3 className="mt-2 text-xl font-semibold text-white transition hover:text-neutral-400">
                {product.name}
              </h3>
            </Link>
          </div>

          <p className="whitespace-nowrap text-lg font-semibold text-white">
            ₹{Number(product.price || 0).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Cart Action */}
        <button
          type="button"
          onClick={handleCartAction}
          disabled={!selectedSize && !productInCart}
          className={`mt-5 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full py-4 text-sm font-bold tracking-[0.15em] transition duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
            productInCart
              ? "bg-neutral-800 text-white hover:bg-neutral-700"
              : "bg-white text-black hover:bg-neutral-200"
          }`}
        >
          <ShoppingBag
            size={18}
            strokeWidth={2}
          />

          {!selectedSize && !productInCart
            ? "OUT OF STOCK"
            : productInCart
            ? "REMOVE FROM CART"
            : "ADD TO CART"}
        </button>
        {cartMessage && (
          <p className="mt-2 text-center text-xs text-neutral-400" role="status">
            {cartMessage}
          </p>
        )}
      </div>
    </motion.article>
  )
}

export default ProductCard
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import {
  ChevronLeft,
  Minus,
  Plus,
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Star,
} from "lucide-react"

import { getProductById } from "../services/productService"
import { useCart } from "../context/useCart"
import { useWishlist } from "../context/useWishlist"

function ProductDetails() {
  const { productId } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  const {
    addToCart,
    isInCart,
    removeProductFromCart,
  } = useCart()

  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist()

  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [cartMessage, setCartMessage] = useState("")

  // =========================
  // LOAD PRODUCT FROM MONGODB
  // =========================
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)

        const response = await getProductById(productId)

        const productData =
          response?.product || response

        setProduct(productData)
      } catch (error) {
        console.error(
          "Product details load error:",
          error
        )

        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      loadProduct()
    }
  }, [productId])

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 text-white">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.5em] text-neutral-500">
            NAMIKOL
          </p>

          <h1 className="mt-5 text-3xl font-black">
            Loading Product...
          </h1>
        </div>
      </main>
    )
  }

  // =========================
  // PRODUCT NOT FOUND
  // =========================
  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 text-white">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.5em] text-neutral-500">
            NAMIKOL
          </p>

          <h1 className="mt-5 text-4xl font-black">
            Product Not Found
          </h1>

          <p className="mt-3 text-neutral-500">
            The product you're looking for doesn't exist.
          </p>

          <Link
            to="/shop"
            className="mt-8 inline-flex cursor-pointer rounded-full bg-white px-7 py-3 text-sm font-bold text-black transition hover:bg-neutral-200"
          >
            BACK TO SHOP
          </Link>
        </div>
      </main>
    )
  }

  // =========================
  // PRODUCT DATA
  // =========================
  const productIdValue =
    product._id || product.id

  const stock = Math.max(
    0,
    Number(product.stock || 0)
  )

  // =========================
  // AVAILABLE SIZES
  // =========================
  const availableSizes =
    Array.isArray(product.sizes) &&
    product.sizes.length > 0
      ? product.sizes
          .map((size) => ({
            size: String(size.size),
            stock: Number(size.stock || 0),
          }))
          .filter((size) =>
            ["6", "7", "8", "9", "10", "11"].includes(size.size)
          )
      : []

  const isFavorite =
    isInWishlist(productIdValue)

  const selectedSizeInCart = isInCart(
    productIdValue,
    selectedSize
  )

  // =========================
  // QUANTITY
  // =========================
  const selectedSizeStock = Number(
    availableSizes.find((item) => item.size === selectedSize)?.stock || 0
  )
  const maxQuantity = Math.min(20, selectedSizeStock)

  const increaseQuantity = () => {
    setQuantity((current) =>
      Math.min(current + 1, maxQuantity)
    )
  }

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(1, current - 1)
    )
  }

  // =========================
  // ADD TO CART
  // =========================
  const handleAddToCart = async () => {
    const isLoggedIn = Boolean(
      localStorage.getItem("namikol_customer_session")
    )

    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    if (!selectedSize) {
      return
    }

    if (stock <= 0) {
      return
    }

    if (selectedSizeStock <= 0) {
      setCartMessage("This size is out of stock.")
      return
    }

    if (selectedSizeInCart) {
      const result = await removeProductFromCart(
        productIdValue,
        selectedSize
      )
      setCartMessage(result?.message || "")
      return
    }

    const result = await addToCart(
      {
        ...product,
        id: productIdValue,
      },
      selectedSize,
      quantity
    )
    setCartMessage(result?.success ? "Added to cart." : result?.message || "Unable to add this item.")
  }

  // =========================
  // WISHLIST
  // =========================
  const handleWishlist = () => {
    const isLoggedIn = Boolean(
      localStorage.getItem("namikol_customer_session")
    )

    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    toggleWishlist({
      ...product,
      id: productIdValue,
    })
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto max-w-[1900px] px-0 lg:px-6">

        {/* BACK TO SHOP */}

        <div className="px-6 pt-8 lg:px-6">
          <Link
            to="/shop"
            className="inline-flex cursor-pointer items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500 transition hover:text-white"
          >
            <ChevronLeft size={15} />
            Back to Shop
          </Link>
        </div>

        {/* PRODUCT */}

        <div className="grid gap-8 px-0 py-8 lg:grid-cols-[1fr_1fr] lg:gap-12 lg:py-10">

          {/* IMAGE */}

          <div className="relative">
            <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-[#151515] sm:min-h-[650px] lg:min-h-[700px] lg:rounded-[2rem]">

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#292929_0%,#171717_45%,#101010_100%)]" />

              <img
                src={product.image}
                alt={product.name}
                className="relative z-10 h-full w-full object-contain p-8 transition duration-500 hover:scale-105 sm:p-14 lg:p-16"
              />

              {product.newArrival && (
                <span className="absolute left-6 top-6 z-20 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                  New Arrival
                </span>
              )}

              {!product.newArrival &&
                product.bestSeller && (
                  <span className="absolute left-6 top-6 z-20 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                    Best Seller
                  </span>
                )}

            </div>
          </div>

          {/* INFORMATION */}

          <div className="flex flex-col justify-center px-6 pb-10 lg:px-6 lg:pb-0">

            <p className="text-xs uppercase tracking-[0.5em] text-[#687286]">
              {product.category}
            </p>

            <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              {product.name}
            </h1>

            {/* RATING */}

            <div className="mt-5 flex items-center gap-2">
              <Star
                size={20}
                fill="currentColor"
                className="text-yellow-400"
              />

              <span className="font-medium">
                5
              </span>

              <span className="text-[#687286]">
                (0 Reviews)
              </span>
            </div>

            {/* PRICE */}

            <p className="mt-3 text-4xl font-bold">
              ₹{Number(product.price || 0).toLocaleString("en-IN")}
            </p>

            {/* DESCRIPTION */}

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#8b97aa]">
              {product.description ||
                `Discover ${product.name?.toLowerCase()}, crafted for modern style, comfort, and timeless luxury.`}
            </p>

            {/* SIZE */}

            <div className="mt-8">
              <h2 className="text-xl font-bold">
                Select Size
              </h2>

              <div className="mt-4 flex flex-wrap gap-3">
                {availableSizes.map((sizeItem) => (
                  <button
                    key={sizeItem.size}
                    type="button"
                    disabled={sizeItem.stock < 1}
                    onClick={() =>
                      {
                        setSelectedSize(sizeItem.size)
                        setQuantity(1)
                        setCartMessage("")
                      }
                    }
                    className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border text-sm font-semibold transition ${
                      selectedSize === sizeItem.size
                        ? "border-white bg-white text-black"
                        : "border-white/20 text-white hover:border-white"
                    } disabled:cursor-not-allowed disabled:opacity-30`}
                    aria-label={`Size ${sizeItem.size}, ${sizeItem.stock} available`}
                  >
                    {sizeItem.size}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-sm text-[#8b97aa]">
                Selected:{" "}
                <span className="font-semibold text-white">
                  {selectedSize || "Please select a size"}
                </span>
              </p>
            </div>

            {/* QUANTITY */}

            <div className="mt-7">
              <h2 className="text-xl font-bold">
                Quantity
              </h2>

              <div className="mt-3 flex h-12 w-fit items-center rounded-full border border-white/10 bg-[#151515]">

                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className="flex h-full w-12 cursor-pointer items-center justify-center text-neutral-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus size={18} />
                </button>

                <span className="flex w-12 justify-center font-semibold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={
                    stock <= 0 ||
                    quantity >= maxQuantity
                  }
                  className="flex h-full w-12 cursor-pointer items-center justify-center text-neutral-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus size={18} />
                </button>

              </div>

              <p className="mt-2 text-xs text-neutral-500">
                Maximum 20 items per purchase
              </p>
            </div>

            {/* STOCK */}

                {selectedSize && selectedSizeStock > 0 ? (
              <p className="mt-4 font-semibold text-green-500">
                In Stock ({selectedSizeStock} available in size {selectedSize})
              </p>
            ) : (
              <p className="mt-4 font-semibold text-red-500">
                Out of Stock
              </p>
            )}

            {/* ADD TO CART */}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                selectedSizeStock <= 0 ||
                !selectedSize ||
                quantity < 1 ||
                quantity > maxQuantity
              }
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-white py-4 text-sm font-bold tracking-[0.15em] text-black transition duration-300 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
            >
              <ShoppingBag
                size={23}
                strokeWidth={1.8}
              />

              {stock <= 0
                ? "Out Of Stock"
                : !selectedSize
                  ? "Select Size"
                  : selectedSizeStock <= 0
                    ? "Size Out Of Stock"
                  : selectedSizeInCart
                    ? "Remove From Cart"
                    : "Add To Cart"}
            </button>

            {cartMessage && (
              <p className="mt-3 text-sm text-neutral-400" role="status">
                {cartMessage}
              </p>
            )}

            {/* WISHLIST */}

            <button
              type="button"
              onClick={handleWishlist}
              className={`mt-4 flex h-[70px] w-full cursor-pointer items-center justify-center gap-3 rounded-full border text-base font-bold transition ${
                isFavorite
                  ? "border-white bg-white text-black"
                  : "border-white/20 text-white hover:border-white"
              }`}
            >
              <Heart
                size={21}
                fill={
                  isFavorite
                    ? "currentColor"
                    : "none"
                }
              />

              {isFavorite
                ? "Added To Wishlist"
                : "Add To Wishlist"}
            </button>

          </div>
        </div>

        {/* FEATURES */}

        <div className="grid gap-5 px-6 pb-12 pt-2 md:grid-cols-3">

          {/* FREE SHIPPING */}

          <div className="rounded-[2rem] border border-white/5 bg-[#151515] px-6 py-9 text-center">
            <Truck
              size={38}
              strokeWidth={1.5}
              className="mx-auto"
            />

            <h3 className="mt-5 text-xl font-bold">
              Free Shipping
            </h3>

            <p className="mt-2 text-[#687286]">
              Delivery within 3–5 days.
            </p>
          </div>

          {/* RETURNS */}

          <div className="rounded-[2rem] border border-white/5 bg-[#151515] px-6 py-9 text-center">
            <RotateCcw
              size={38}
              strokeWidth={1.5}
              className="mx-auto"
            />

            <h3 className="mt-5 text-xl font-bold">
              Easy Returns
            </h3>

            <p className="mt-2 text-[#687286]">
              3-day return policy.
            </p>
          </div>

          {/* PAYMENT */}

          <div className="rounded-[2rem] border border-white/5 bg-[#151515] px-6 py-9 text-center">
            <ShieldCheck
              size={38}
              strokeWidth={1.5}
              className="mx-auto"
            />

            <h3 className="mt-5 text-xl font-bold">
              Secure Payment
            </h3>

            <p className="mt-2 text-[#687286]">
              100% encrypted checkout.
            </p>
          </div>

        </div>

      </div>
    </main>
  )
}

export default ProductDetails
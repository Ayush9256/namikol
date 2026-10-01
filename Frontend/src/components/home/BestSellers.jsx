import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import ProductCard from "../common/ProductCard"
import { getProducts } from "../../services/productService"

function BestSellers() {
  const sliderRef = useRef(null)

  const [gender, setGender] = useState("men")
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // =========================
  // LOAD PRODUCTS FROM MONGODB
  // =========================
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)

        const response = await getProducts()

        const productList = Array.isArray(response)
          ? response
          : response?.products || []

        setProducts(productList)
      } catch (error) {
        console.error(
          "Best sellers load error:",
          error
        )
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // =========================
  // BEST SELLERS
  // =========================
  const bestSellers = products.filter(
    (product) =>
      product.bestSeller === true &&
      (
        product.gender === gender ||
        product.gender === "unisex"
      )
  )

  const featuredProducts = bestSellers.slice(0, 8)

  // =========================
  // CAROUSEL SCROLL
  // =========================
  const scrollProducts = (direction) => {
    if (!sliderRef.current) return

    const scrollAmount =
      sliderRef.current.clientWidth * 0.8

    sliderRef.current.scrollBy({
      left:
        direction === "left"
          ? -scrollAmount
          : scrollAmount,
      behavior: "smooth",
    })
  }

  return (
    <section className="bg-[#080808] px-6 py-24 text-white lg:px-12">
      <div className="mx-auto max-w-[1600px]">

        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.5em] text-neutral-500">
              Customer Favorites
            </p>

            <h2 className="text-5xl font-black tracking-tight md:text-7xl">
              Best Sellers
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-6">

            {/* Gender Toggle */}
            <div className="flex items-center rounded-full border border-white/10 bg-[#141414] p-1">

              <button
                type="button"
                onClick={() => setGender("men")}
                className={`cursor-pointer rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition ${
                  gender === "men"
                    ? "bg-white text-black"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                Men
              </button>

              <button
                type="button"
                onClick={() => setGender("women")}
                className={`cursor-pointer rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition ${
                  gender === "women"
                    ? "bg-white text-black"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                Women
              </button>

            </div>

            {/* Carousel Controls */}
            <div className="hidden items-center gap-2 sm:flex">

              <button
                type="button"
                onClick={() => scrollProducts("left")}
                className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-white hover:bg-white hover:text-black"
                aria-label="Previous products"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() => scrollProducts("right")}
                className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-white hover:bg-white hover:text-black"
                aria-label="Next products"
              >
                <ChevronRight size={20} />
              </button>

            </div>

            {/* View Collection */}
            <Link
              to={`/shop/best-sellers?gender=${gender}`}
              className="cursor-pointer group flex items-center gap-3 text-sm font-medium text-white transition hover:text-neutral-400"
            >
              VIEW COLLECTION

              <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

          </div>
        </div>

        {/* Products */}
        <div
          ref={sliderRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >

          {loading ? (
            <div className="flex min-h-[300px] w-full items-center justify-center">
              <p className="text-neutral-500">
                Loading best sellers...
              </p>
            </div>
          ) : featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <div
                key={product._id || product.id}
                className="w-[82%] shrink-0 snap-start sm:w-[48%] lg:w-[calc(25%-15px)]"
              >
                <ProductCard
                  product={{
                    ...product,
                    id: product._id || product.id,
                  }}
                />
              </div>
            ))
          ) : (
            <div className="flex min-h-[300px] w-full items-center justify-center">
              <p className="text-neutral-500">
                No {gender} best sellers available.
              </p>
            </div>
          )}

        </div>

        {/* Mobile Hint */}
        {!loading && featuredProducts.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-neutral-600 sm:hidden">
            <span>Swipe to explore</span>
            <ChevronRight size={14} />
          </div>
        )}

      </div>
    </section>
  )
}

export default BestSellers
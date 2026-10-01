import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import ProductCard from "../components/common/ProductCard"
import { useProducts } from "../hooks/useProducts"

function BestSellers() {
  const [searchParams] = useSearchParams()

  const urlGender = searchParams.get("gender")
  const { products, loading, error } = useProducts()

  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("best-sellers")

  const selectedGender =
    urlGender === "women" ? "women" : "men"

  const bestSellers = useMemo(() => products.filter(
    (product) =>
      product.bestSeller === true &&
      product.gender === selectedGender
  ), [products, selectedGender])

  const filteredProducts = useMemo(() => {
    let result = [...bestSellers]

    if (search.trim()) {
      const query = search.toLowerCase()

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      )
    }

    switch (sort) {
      case "price-low":
        result.sort((a, b) => a.price - b.price)
        break

      case "price-high":
        result.sort((a, b) => b.price - a.price)
        break

      case "newest":
        result.sort((a, b) => {
          const aNew = a.badge === "New" ? 1 : 0
          const bNew = b.badge === "New" ? 1 : 0

          return bNew - aNew
        })
        break

      case "best-sellers":
      default:
        break
    }

    return result
  }, [search, sort, bestSellers])

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-20 text-white lg:px-12">
      <div className="mx-auto max-w-[1600px]">

        {/* Header */}
        <div className="mb-12">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500 transition hover:text-white"
          >
            ← Back Home
          </Link>

          <p className="mb-4 text-xs uppercase tracking-[0.6em] text-neutral-500">
            {selectedGender === "men"
              ? "Men's Collection"
              : "Women's Collection"}
          </p>

          <h1 className="text-5xl font-black tracking-tight sm:text-6xl md:text-8xl">
            Best Sellers
          </h1>

          <p className="mt-4 max-w-2xl text-base text-neutral-400 md:text-lg">
            Discover the most-loved NAMIKOL footwear for{" "}
            {selectedGender === "men" ? "men" : "women"}.
          </p>
        </div>

        {/* Search + Sort */}
        <div className="mb-16 flex flex-col gap-4 border-y border-white/10 py-4 lg:flex-row">

          <div className="relative flex-1">
            <Search
              size={22}
              strokeWidth={1.5}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="h-14 w-full rounded-full border border-white/10 bg-[#141414] pl-16 pr-6 text-base text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30 sm:h-[70px]"
            />
          </div>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-14 rounded-full border border-white/10 bg-[#141414] px-6 text-base text-white outline-none transition focus:border-white/30 sm:h-[70px] lg:w-[270px]"
          >
            <option value="best-sellers">Best Sellers</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
          </select>

        </div>

        {/* Product Count */}
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing{" "}
            <span className="text-white">
              {filteredProducts.length}
            </span>{" "}
            {filteredProducts.length === 1
              ? "product"
              : "products"}
          </p>

          <span className="text-xs uppercase tracking-[0.2em] text-neutral-600">
            {selectedGender}
          </span>
        </div>

        {/* Products */}
        {loading ? (
          <p className="py-20 text-center text-neutral-500">Loading products...</p>
        ) : error ? (
          <p className="py-20 text-center text-red-400">{error}</p>
        ) : filteredProducts.length > 0 ? (
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <p className="text-2xl font-semibold">
              No products found
            </p>

            <p className="mt-3 text-sm text-neutral-500">
              Try searching with a different product name or category.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              Clear Search
            </button>
          </div>
        )}

      </div>
    </main>
  )
}

export default BestSellers
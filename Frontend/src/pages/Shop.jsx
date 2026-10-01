import { useEffect, useMemo, useState } from "react"
import {
  FiSearch,
  FiSliders,
  FiX,
} from "react-icons/fi"
import {
  Link,
  useSearchParams,
} from "react-router-dom"

import ProductCard from "../components/common/ProductCard"
import { getProducts } from "../services/productService"

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [gender, setGender] = useState("all")
  const [category, setCategory] = useState("all")
  const [sort, setSort] = useState("featured")

  const categories = [
    "all",
    "formal",
    "casual",
    "premium",
    "lifestyle",
    "heels",
  ]

  // =====================================================
  // READ FILTERS FROM URL
  // =====================================================

  const genderParam = (
    searchParams.get("gender") || ""
  )
    .trim()
    .toLowerCase()

  const categoryParam = (
    searchParams.get("category") || ""
  )
    .trim()
    .toLowerCase()

  // =====================================================
  // SYNC URL FILTERS → STATE
  // =====================================================

  useEffect(() => {
    const nextGender =
      genderParam === "men" ||
      genderParam === "women"
        ? genderParam
        : "all"

    const nextCategory = categories.includes(
      categoryParam
    )
      ? categoryParam
      : "all"

    setGender(nextGender)
    setCategory(nextCategory)
  }, [
    genderParam,
    categoryParam,
  ])

  // =====================================================
  // LOAD PRODUCTS FROM MONGODB
  // =====================================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await getProducts()

        const productList = Array.isArray(response)
          ? response
          : response?.products || []

        setProducts(productList)
      } catch (err) {
        console.error(
          "Shop products load error:",
          err
        )

        setError(
          err?.response?.data?.message ||
            "Unable to load products."
        )
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // =====================================================
  // CHANGE GENDER
  // =====================================================

  const handleGenderChange = (value) => {
    setGender(value)

    const nextParams = new URLSearchParams(
      searchParams
    )

    if (value === "all") {
      nextParams.delete("gender")
    } else {
      nextParams.set("gender", value)
    }

    setSearchParams(nextParams)
  }

  // =====================================================
  // CHANGE CATEGORY
  // =====================================================

  const handleCategoryChange = (value) => {
    setCategory(value)

    const nextParams = new URLSearchParams(
      searchParams
    )

    if (value === "all") {
      nextParams.delete("category")
    } else {
      nextParams.set("category", value)
    }

    setSearchParams(nextParams)
  }

  // =====================================================
  // FILTER + SORT
  // =====================================================

  const filteredProducts = useMemo(() => {
    let result = [...products]

    // ---------------------------------------------------
    // GENDER FILTER
    // ---------------------------------------------------

    if (gender !== "all") {
      result = result.filter((product) => {
        return (
          String(product.gender || "")
            .trim()
            .toLowerCase() === gender
        )
      })
    }

    // ---------------------------------------------------
    // CATEGORY FILTER
    // ---------------------------------------------------

    if (category !== "all") {
      result = result.filter((product) => {
        return (
          String(product.category || "")
            .trim()
            .toLowerCase() === category
        )
      })
    }

    // ---------------------------------------------------
    // SEARCH
    // ---------------------------------------------------

    if (search.trim()) {
      const query = search
        .trim()
        .toLowerCase()

      result = result.filter((product) => {
        return (
          String(product.name || "")
            .toLowerCase()
            .includes(query) ||
          String(product.category || "")
            .toLowerCase()
            .includes(query)
        )
      })
    }

    // ---------------------------------------------------
    // SORT
    // ---------------------------------------------------

    switch (sort) {
      case "price-low":
        result.sort(
          (a, b) =>
            Number(a.price || 0) -
            Number(b.price || 0)
        )
        break

      case "price-high":
        result.sort(
          (a, b) =>
            Number(b.price || 0) -
            Number(a.price || 0)
        )
        break

      case "newest":
        result.sort(
          (a, b) =>
            Number(Boolean(b.newArrival)) -
            Number(Boolean(a.newArrival))
        )
        break

      case "best-sellers":
        result.sort(
          (a, b) =>
            Number(Boolean(b.bestSeller)) -
            Number(Boolean(a.bestSeller))
        )
        break

      default:
        break
    }

    return result
  }, [
    products,
    search,
    gender,
    category,
    sort,
  ])

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("")
    setGender("all")
    setCategory("all")
    setSort("featured")

    const nextParams = new URLSearchParams(
      searchParams
    )

    nextParams.delete("gender")
    nextParams.delete("category")

    setSearchParams(nextParams)
  }

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-20 text-white lg:px-12">
      <div className="mx-auto max-w-[1600px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-12">

          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500 transition hover:text-white"
          >
            ← Back Home
          </Link>

          <p className="mb-4 text-xs uppercase tracking-[0.6em] text-neutral-500">
            NAMIKOL COLLECTION
          </p>

          <h1 className="text-6xl font-black tracking-tight sm:text-7xl md:text-8xl">
            Shop
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-400 md:text-lg">
            Explore the complete NAMIKOL collection, crafted for
            modern movement, timeless style, and everyday comfort.
          </p>

        </div>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="mb-12 border-y border-white/10 py-5">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">

            {/* SEARCH */}

            <div className="relative flex-1">

              <FiSearch
                size={21}
                strokeWidth={1.5}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products..."
                className="h-[64px] w-full rounded-full border border-white/10 bg-[#141414] pl-16 pr-6 text-base text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
              />

            </div>

            {/* GENDER */}

            <div className="flex items-center rounded-full border border-white/10 bg-[#141414] p-1">

              {[
                "all",
                "men",
                "women",
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    handleGenderChange(item)
                  }
                  className={`rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] transition ${
                    gender === item
                      ? "bg-white text-black"
                      : "text-neutral-500 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}

            </div>

            {/* SORT */}

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
              className="h-[64px] rounded-full border border-white/10 bg-[#141414] px-6 text-sm text-white outline-none transition focus:border-white/30 xl:w-[230px]"
            >
              <option value="featured">
                Featured
              </option>

              <option value="newest">
                Newest
              </option>

              <option value="best-sellers">
                Best Sellers
              </option>

              <option value="price-low">
                Price: Low → High
              </option>

              <option value="price-high">
                Price: High → Low
              </option>
            </select>

          </div>

          {/* CATEGORY FILTERS */}

          <div className="mt-5 flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            <div className="mr-2 flex shrink-0 items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-600">
              <FiSliders size={15} />
              Category
            </div>

            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  handleCategoryChange(item)
                }
                className={`shrink-0 rounded-full border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] transition ${
                  category === item
                    ? "border-white bg-white text-black"
                    : "border-white/10 text-neutral-500 hover:border-white/30 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}

          </div>

        </div>

        {/* =================================================
            RESULTS INFO
        ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-neutral-500">
            Showing{" "}
            <span className="font-medium text-white">
              {filteredProducts.length}
            </span>{" "}
            {filteredProducts.length === 1
              ? "product"
              : "products"}
          </p>

          {(search ||
            gender !== "all" ||
            category !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500 transition hover:text-white"
            >
              <FiX size={15} />
              Clear Filters
            </button>
          )}

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="flex min-h-[450px] items-center justify-center">
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">
              Loading NAMIKOL products...
            </p>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div className="flex min-h-[450px] flex-col items-center justify-center text-center">

            <p className="text-2xl font-semibold">
              Unable to load products
            </p>

            <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
              {error}
            </p>

          </div>
        )}

        {/* =================================================
            PRODUCTS
        ================================================= */}

        {!loading &&
          !error &&
          filteredProducts.length > 0 && (
            <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {filteredProducts.map((product) => (
                <ProductCard
                  key={
                    product._id ||
                    product.id
                  }
                  product={{
                    ...product,
                    id:
                      product._id ||
                      product.id,
                  }}
                />
              ))}

            </div>
          )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          filteredProducts.length === 0 && (
            <div className="flex min-h-[450px] flex-col items-center justify-center text-center">

              <p className="text-2xl font-semibold">
                No products found
              </p>

              <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
                Try changing your search, gender, or category
                filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-7 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Clear Filters
              </button>

            </div>
          )}

      </div>
    </main>
  )
}

export default Shop
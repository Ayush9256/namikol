import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  ChevronDown,
  Search as SearchIcon,
  SlidersHorizontal,
} from "lucide-react"

import { useProducts } from "../hooks/useProducts"
import ProductCard from "../components/common/ProductCard"

function ResponsiveSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const selectRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!selectRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  return (
    <div ref={selectRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex h-14 w-full min-w-0 items-center justify-between gap-3 rounded-full border border-white/10 bg-[#111111] px-5 text-left text-sm"
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-[#151515] p-1 shadow-2xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`block w-full truncate rounded-xl px-4 py-3 text-left text-sm transition hover:bg-white/10 ${
                option.value === value
                  ? "bg-white text-black"
                  : "text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Search() {
  const [searchParams] = useSearchParams()

  const initialQuery = searchParams.get("q") || ""
  const { products, loading, error } = useProducts()

  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState("All")
  const [gender, setGender] = useState("All")
  const [sort, setSort] = useState("default")

  const categories = useMemo(() => [
    "All",
    ...new Set(products.map((product) => product.category)),
  ], [products])

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesQuery =
        String(product.name || "")
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        String(product.category || "")
          .toLowerCase()
          .includes(query.toLowerCase())

      const matchesCategory =
        category === "All" ||
        product.category === category

      const matchesGender =
        gender === "All" ||
        product.gender === gender

      return (
        matchesQuery &&
        matchesCategory &&
        matchesGender
      )
    })

    if (sort === "price-low") {
      result.sort((a, b) => a.price - b.price)
    }

    if (sort === "price-high") {
      result.sort((a, b) => b.price - a.price)
    }

    if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [products, query, category, gender, sort])

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-[1500px]">

        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.5em] text-neutral-500">
            NAMIKOL
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl md:text-7xl">
            Search
          </h1>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_140px_140px_180px]">

          <div className="flex h-14 min-w-0 items-center gap-3 rounded-full border border-white/10 bg-[#111111] px-5">
            <SearchIcon
              size={19}
              className="text-neutral-500"
            />

            <input
              type="text"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search products..."
              className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
            />
          </div>

          <ResponsiveSelect
            value={category}
            onChange={setCategory}
            options={categories.map((item) => ({
              label: item,
              value: item,
            }))}
          />

          <ResponsiveSelect
            value={gender === "All" ? "All" : gender}
            onChange={setGender}
            options={[
              { label: "All", value: "All" },
              { label: "Men", value: "men" },
              { label: "Women", value: "women" },
            ]}
          />

          <ResponsiveSelect
            value={
              sort === "default"
                ? "Sort By"
                : sort === "price-low"
                  ? "Price: Low to High"
                  : sort === "price-high"
                    ? "Price: High to Low"
                    : "Name"
            }
            onChange={setSort}
            options={[
              { label: "Sort By", value: "default" },
              { label: "Price: Low to High", value: "price-low" },
              { label: "Price: High to Low", value: "price-high" },
              { label: "Name", value: "name" },
            ]}
          />
        </div>

        <div className="mt-8 flex items-center justify-between border-b border-white/10 pb-5">
          <p className="text-sm text-neutral-500">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1
              ? "product"
              : "products"}{" "}
            found
          </p>

          <SlidersHorizontal
            size={18}
            className="text-neutral-500"
          />
        </div>

        {filteredProducts.length > 0 ? (
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : loading ? (
          <p className="py-20 text-center text-neutral-500">Loading products...</p>
        ) : error ? (
          <p className="py-20 text-center text-red-400">{error}</p>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <SearchIcon
              size={42}
              strokeWidth={1.3}
              className="text-neutral-600"
            />

            <h2 className="mt-6 text-3xl font-bold">
              No Products Found
            </h2>

            <p className="mt-3 text-neutral-500">
              Try another product name or change your filters.
            </p>

            <Link
              to="/shop"
              className="mt-7 rounded-full bg-white px-7 py-3 text-sm font-bold text-black transition hover:bg-neutral-200"
            >
              Browse Shop
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

export default Search
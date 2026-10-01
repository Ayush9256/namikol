import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import ProductCard from "../components/common/ProductCard"
import api from "../services/api"

function Collections() {
  const { gender, category } = useParams()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const formattedGender = gender?.toLowerCase()

  const formattedCategory = category
    ?.toLowerCase()
    .replace(/-/g, " ")

  useEffect(() => {
    let mounted = true

    const loadProducts = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await api.get("/products")

        if (!mounted) return

        setProducts(response.data?.products || [])
      } catch (err) {
        console.error("Failed to load collection products:", err)

        if (!mounted) return

        setError("Unable to load products.")
        setProducts([])
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      mounted = false
    }
  }, [])

  const collectionProducts = useMemo(() => {
    return products.filter((product) => {
      const productGender = product.gender?.toLowerCase()
      const productCategory = product.category?.toLowerCase()

      return (
        productGender === formattedGender &&
        productCategory === formattedCategory
      )
    })
  }, [products, formattedGender, formattedCategory])

  const collectionTitle = `${gender?.toUpperCase()} ${category
    ?.replace(/-/g, " ")
    .toUpperCase()}`

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-14 text-white md:px-10 lg:px-14">

      {/* BACK HOME */}
      <div className="mb-10">
        <Link
          to="/"
          className="
            inline-flex
            items-center
            gap-3
            text-xs
            font-medium
            tracking-[0.28em]
            text-neutral-400
            transition-colors
            duration-200
            hover:text-white
          "
        >
          <ArrowLeft
            size={15}
            strokeWidth={1.5}
          />

          BACK HOME
        </Link>
      </div>

      {/* COLLECTION HEADER */}
      <section className="mb-14">

        <p
          className="
            mb-5
            text-xs
            font-medium
            tracking-[0.38em]
            text-neutral-500
          "
        >
          NAMIKOL COLLECTION
        </p>

        <h1
          className="
            text-5xl
            font-medium
            tracking-[-0.04em]
            text-white
            md:text-6xl
            lg:text-7xl
          "
        >
          {collectionTitle}
        </h1>

        {!loading && !error && (
          <p className="mt-5 text-sm tracking-[0.05em] text-neutral-500">
            {collectionProducts.length}{" "}
            {collectionProducts.length === 1 ? "product" : "products"}
          </p>
        )}

      </section>

      {/* DIVIDER */}
      <div className="mb-10 border-t border-white/10" />

      {/* LOADING */}
      {loading ? (
        <section className="flex min-h-[420px] flex-col items-center justify-center text-center">

          <p className="text-xs tracking-[0.3em] text-neutral-500">
            LOADING COLLECTION
          </p>

        </section>
      ) : error ? (
        /* ERROR */
        <section className="flex min-h-[420px] flex-col items-center justify-center text-center">

          <p className="mb-4 text-xs tracking-[0.3em] text-red-400">
            COLLECTION ERROR
          </p>

          <h2 className="text-2xl font-medium text-white">
            Unable to load products
          </h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
            Please try again after checking that the NAMIKOL backend is running.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="
              mt-8
              rounded-full
              border
              border-white/20
              px-7
              py-3
              text-xs
              font-semibold
              tracking-[0.18em]
              text-white
              transition-all
              duration-200
              hover:border-white
              hover:bg-white
              hover:text-black
            "
          >
            TRY AGAIN
          </button>

        </section>
      ) : collectionProducts.length > 0 ? (
        /* PRODUCTS */
        <section>
          <div
            className="
              grid
              grid-cols-1
              gap-x-6
              gap-y-12
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
            "
          >
            {collectionProducts.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
              />
            ))}
          </div>
        </section>
      ) : (
        /* EMPTY COLLECTION */
        <section className="flex min-h-[420px] flex-col items-center justify-center text-center">

          <p className="mb-4 text-xs tracking-[0.3em] text-neutral-600">
            COLLECTION EMPTY
          </p>

          <h2 className="text-2xl font-medium text-white">
            No products found
          </h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
            There are currently no products available in this collection.
          </p>

          <Link
            to="/shop"
            className="
              mt-8
              rounded-full
              border
              border-white/20
              px-7
              py-3
              text-xs
              font-semibold
              tracking-[0.18em]
              text-white
              transition-all
              duration-200
              hover:border-white
              hover:bg-white
              hover:text-black
            "
          >
            VIEW ALL PRODUCTS
          </Link>

        </section>
      )}

    </main>
  )
}

export default Collections
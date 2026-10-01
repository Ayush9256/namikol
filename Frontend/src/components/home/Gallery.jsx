import { useProducts } from "../../hooks/useProducts"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

function Gallery() {
  const { products, loading, error } = useProducts()
  const galleryItems = products.slice(0, 15)

  return (
    <section className="bg-[#080808] px-6 py-24 text-white lg:px-12">
      <div className="mx-auto max-w-[1600px]">

        {/* Heading */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.6em] text-[#6f88ad]">
              THE NAMIKOL WORLD
            </p>

            <h2 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl">
              Step Into
              <br />
              Our World
            </h2>
          </div>

          <Link
            to="/shop"
            className="group flex w-fit items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:text-neutral-400"
          >
            Explore Collection
            <ArrowUpRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </Link>
        </div>

        {/* Gallery */}
        <div className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <div className="flex min-h-[300px] w-full items-center justify-center text-neutral-500">
              Loading the latest products...
            </div>
          ) : error ? (
            <div className="flex min-h-[300px] w-full items-center justify-center text-center text-red-400">
              {error}
            </div>
          ) : galleryItems.length === 0 ? (
            <div className="flex min-h-[300px] w-full items-center justify-center text-neutral-500">
              No products available yet.
            </div>
          ) : galleryItems.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
              }}
              className={`group relative shrink-0 overflow-hidden rounded-[30px] border border-white/10 bg-[#151515] ${
                index === 0
                  ? "w-[78vw] md:w-[48vw] lg:w-[520px]"
                  : "w-[70vw] md:w-[38vw] lg:w-[360px]"
              }`}
            >

              {/* Image */}
              <div className="relative aspect-[4/5] overflow-hidden">

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#303030_0%,#151515_55%,#080808_100%)]" />

                <Link to={`/product/${item.id}`} className="absolute inset-0 z-30">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="relative z-10 h-full w-full object-contain p-10 transition duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />

                  <div className="absolute bottom-0 left-0 right-0 z-30 p-7">
                    <p className="text-[10px] uppercase tracking-[0.5em] text-neutral-400">
                      {item.category || "NAMIKOL"}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold">
                      {item.name}
                    </h3>
                  </div>
                </Link>

              </div>

            </motion.article>
          ))}

        </div>

        {/* Mobile Hint */}
        <div className="mt-4 flex items-center justify-center text-[10px] uppercase tracking-[0.3em] text-neutral-600 lg:hidden">
          Swipe to explore
        </div>

      </div>
    </section>
  )
}

export default Gallery
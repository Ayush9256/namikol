import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import heroShoe from "../../assets/hero-shoe.png"

function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-black text-white">

      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_50%,#1f1f1f_0%,#090909_45%,#000_75%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-[1600px] items-center px-6 py-16 lg:grid-cols-2 lg:px-12">

        {/* LEFT */}
        <div className="relative z-10">

          <p className="mb-6 text-xs uppercase tracking-[0.7em] text-neutral-400">
            Move Beyond Ordinary
          </p>

          <h1 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-[9rem]">
            NAMIKOL
          </h1>

          <div className="mt-3 h-[3px] w-28 bg-white" />

          <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-400">
            Crafted for modern movement. Premium footwear engineered
            with timeless aesthetics, luxurious materials and
            uncompromising comfort.
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap gap-4">

            <Link
              to="/shop"
              className="rounded-full bg-white px-7 py-3 text-sm font-bold tracking-[0.15em] text-black transition hover:bg-neutral-300"
            >
              SHOP COLLECTION
            </Link>

            <Link
              to="/about"
              className="rounded-full border border-white px-7 py-3 text-sm font-bold tracking-[0.15em] text-white transition hover:bg-white hover:text-black"
            >
              DISCOVER BRAND
            </Link>

          </div>

          {/* Stats */}
          <div className="mt-12 flex flex-wrap gap-8 sm:gap-12">

            <div>
              <h3 className="text-4xl font-bold">
                50K+
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                Customers
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold">
                4.9★
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                Rating
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold">
                2026
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                Collection
              </p>
            </div>

          </div>

        </div>

        {/* RIGHT: SHOE */}
        <div className="relative flex h-[600px] items-center justify-center lg:h-[700px]">

          {/* Glow */}
          <div className="absolute h-[450px] w-[450px] rounded-full bg-white/10 blur-[100px]" />

          {/* Floating Shoe */}
          <motion.img
            src={heroShoe}
            alt="NAMIKOL premium footwear"
            className="relative z-10 w-[80%] max-w-[650px] object-contain drop-shadow-[0_35px_45px_rgba(255,255,255,0.15)]"
            animate={{
              y: [0, -18, 0, 18, 0],
              rotate: [0, 1, 0, -1, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

        </div>

      </div>

    </section>
  )
}

export default Hero
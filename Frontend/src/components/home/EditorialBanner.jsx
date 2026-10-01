import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import editorialShoe from "../../assets/editorial-shoe.png"

function EditorialBanner() {
  return (
    <section className="relative overflow-hidden bg-[#111111] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,#292929_0%,#111111_45%,#080808_100%)]" />

      <div className="relative mx-auto grid min-h-[650px] max-w-[1600px] items-center px-6 py-20 lg:grid-cols-2 lg:px-12">

        {/* Content */}
        <div className="relative z-10 max-w-2xl">
          <p className="mb-5 text-xs uppercase tracking-[0.6em] text-neutral-500">
            The NAMIKOL Edits
          </p>

          <h2 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Designed
            <br />
            To Be
            <br />
            Remembered.
          </h2>

          <p className="mt-7 max-w-lg text-base leading-7 text-neutral-400 md:text-lg">
            A refined expression of modern footwear. Clean silhouettes,
            premium details and effortless comfort made for every move.
          </p>

          <Link
            to="/shop"
            className="mt-9 inline-flex items-center gap-4 rounded-full bg-white px-7 py-4 text-sm font-bold tracking-[0.15em] text-black transition duration-300 hover:bg-neutral-200"
          >
            EXPLORE COLLECTION
            <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Shoe */}
        <div className="relative flex min-h-[400px] items-center justify-center lg:min-h-[600px]">
          <div className="absolute h-[350px] w-[350px] rounded-full bg-white/10 blur-[100px] md:h-[450px] md:w-[450px]" />

          <motion.img
            src={editorialShoe}
            alt="NAMIKOL editorial footwear"
            className="relative z-10 w-[90%] max-w-[700px] object-contain drop-shadow-[0_35px_50px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

      </div>
    </section>
  )
}

export default EditorialBanner
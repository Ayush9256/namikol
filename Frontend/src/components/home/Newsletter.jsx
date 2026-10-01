import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import api from "../../services/api"

function Newsletter() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim()) return

    try {
      setSubmitting(true)
      setError("")
      await api.post("/public/newsletter", { email })
      setSubmitted(true)
      setEmail("")
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "Unable to subscribe right now. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-[#080808] px-6 py-24 text-white lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#151515] px-6 py-16 text-center sm:px-10 md:py-20 lg:px-20"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#292929_0%,#151515_45%,#0b0b0b_100%)]" />

          <div className="relative z-10 mx-auto max-w-3xl">

            <p className="mb-5 text-xs uppercase tracking-[0.6em] text-[#6f88ad]">
              STAY IN THE LOOP
            </p>

            <h2 className="text-4xl font-black tracking-tight sm:text-5xl md:text-7xl">
              Join the NAMIKOL World
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#8ba1c0] md:text-lg">
              Be the first to discover new collections, exclusive releases,
              special offers, and everything happening at NAMIKOL.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                required
                className="h-14 flex-1 rounded-full border border-white/10 bg-black/40 px-6 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
              />

              <button
                type="submit"
                disabled={submitting}
                className="group flex h-14 items-center justify-center gap-3 rounded-full bg-white px-7 text-sm font-bold tracking-[0.12em] text-black transition hover:bg-neutral-200"
              >
                {submitting ? "SUBMITTING..." : "SUBSCRIBE"}
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
            </form>

            {submitted && (
              <p className="mt-5 text-sm text-neutral-400">
                Thank you for joining the NAMIKOL world.
              </p>
            )}

            {error && (
              <p className="mt-5 text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
              No spam. Only NAMIKOL.
            </p>

          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Newsletter
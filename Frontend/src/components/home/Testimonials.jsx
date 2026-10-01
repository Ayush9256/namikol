import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    quote:
      "The quality and comfort are exceptional. NAMIKOL has completely changed the way I look at everyday footwear.",
    name: "Rahul Mehta",
    location: "Mumbai, India",
  },
  {
    quote:
      "Beautiful design, premium feel and incredibly comfortable. The attention to detail is what stood out to me.",
    name: "Aarav Sharma",
    location: "Delhi, India",
  },
  {
    quote:
      "From the packaging to the footwear itself, everything feels thoughtfully designed and premium.",
    name: "Ananya Kapoor",
    location: "Bengaluru, India",
  },
]

function Testimonials() {
  return (
    <section className="bg-[#080808] px-6 py-24 text-white lg:px-12">
      <div className="mx-auto max-w-[1600px]">

        {/* Heading */}
        <div className="mb-14 text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.6em] text-[#6f88ad]">
            CUSTOMER STORIES
          </p>

          <h2 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Loved Worldwide
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#8ba1c0] md:text-lg">
            Discover what our customers have to say about the NAMIKOL
            experience.
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              className="rounded-[32px] border border-white/10 bg-[#151515] p-8 transition duration-300 hover:border-white/25"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="mt-7 text-lg leading-8 text-neutral-300">
                “{testimonial.quote}”
              </p>

              {/* Customer */}
              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-base font-bold">
                  {testimonial.name}
                </h3>

                <p className="mt-1 text-sm text-[#6f88ad]">
                  {testimonial.location}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Testimonials
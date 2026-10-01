import { Headphones, Medal, ShieldCheck, Truck } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: ShieldCheck,
    title: "Premium Quality",
    description:
      "Crafted from carefully selected materials for exceptional durability, comfort, and timeless luxury.",
  },
  {
    icon: Truck,
    title: "Worldwide Shipping",
    description:
      "Fast, secure, and reliable delivery to customers around the world with complete order tracking.",
  },
  {
    icon: Medal,
    title: "Luxury Craftsmanship",
    description:
      "Every pair is designed with precision and attention to detail, creating footwear that stands apart.",
  },
  {
    icon: Headphones,
    title: "24/7 Customer Support",
    description:
      "Our support team is always ready to assist you before and after your purchase.",
  },
]

function WhyChoose() {
  return (
    <section className="bg-[#080808] px-6 py-24 text-white lg:px-12">
      <div className="mx-auto max-w-[1900px]">

        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.6em] text-[#6f88ad]">
            WHY NAMIKOL
          </p>

          <h2 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Built Around You
          </h2>

          <p className="mx-auto mt-5 max-w-4xl text-base leading-8 text-[#8ba1c0] md:text-xl">
            Experience footwear that combines premium craftsmanship,
            timeless aesthetics, and unmatched comfort for every journey.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
                className="min-h-[275px] rounded-[34px] border border-white/15 bg-[#151515] p-8 transition duration-300 hover:border-white/30 hover:bg-[#191919]"
              >
                {/* Icon */}
                <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-white text-black">
                  <Icon size={34} strokeWidth={2.2} />
                </div>

                {/* Title */}
                <h3 className="mt-5 text-2xl font-black tracking-tight md:text-3xl">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-base leading-10 text-[#8ba1c0] md:text-lg">
                  {feature.description}
                </p>
              </motion.article>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default WhyChoose
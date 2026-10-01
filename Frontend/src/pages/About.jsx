import { Link } from "react-router-dom"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

function About() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">

      {/* =========================================
          HERO
      ========================================= */}
      <section className="relative px-6 pb-24 pt-12 md:px-10 md:pb-32 lg:px-16 lg:pt-14">

        {/* Back Home */}
        <Link
          to="/"
          className="
            group
            inline-flex
            items-center
            gap-3
            text-xs
            font-medium
            tracking-[0.28em]
            text-neutral-500
            transition-colors
            duration-300
            hover:text-white
          "
        >
          <ArrowLeft
            size={15}
            strokeWidth={1.5}
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />

          BACK HOME
        </Link>

        {/* Hero content */}
        <div className="relative mt-24 md:mt-28 lg:mt-32">

          {/* Small label */}
          <p className="mb-7 text-xs font-medium tracking-[0.42em] text-neutral-500">
            ABOUT NAMIKOL
          </p>

          {/* Giant heading */}
          <h1
            className="
              max-w-[1200px]
              text-[clamp(4rem,10vw,10rem)]
              font-semibold
              leading-[0.82]
              tracking-[-0.065em]
            "
          >
            Luxury
            <br />

            <span className="ml-[8vw] text-neutral-400">
              In Every
            </span>

            <br />

            <span className="ml-[18vw]">
              Step
            </span>
          </h1>

          {/* Description */}
          <div className="mt-16 flex justify-end md:mt-20">
            <p
              className="
                max-w-[680px]
                text-base
                leading-8
                text-neutral-400
                md:text-lg
              "
            >
              NAMIKOL is a premium footwear brand dedicated to
              delivering timeless style, exceptional comfort, and
              uncompromising quality. Every pair is crafted with
              precision using carefully selected materials for people
              who appreciate luxury in everyday life.
            </p>
          </div>

        </div>

        {/* Decorative line */}
        <div className="mt-20 h-px w-full bg-white/10 md:mt-28" />

        {/* Small editorial detail */}
        <div className="mt-5 flex items-center justify-between text-[10px] tracking-[0.3em] text-neutral-600">
          <span>EST. NAMIKOL</span>

          <span className="hidden md:block">
            CRAFTED FOR EVERY STEP
          </span>

          <span>01 / 03</span>
        </div>

      </section>


      {/* =========================================
          STORY
      ========================================= */}
      <section className="relative border-t border-white/10 px-6 py-24 md:px-10 md:py-32 lg:px-16">

        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.5fr] lg:gap-24">

          {/* Left */}
          <div>
            <p className="text-xs font-medium tracking-[0.35em] text-neutral-600">
              02
            </p>

            <p className="mt-4 text-xs font-medium tracking-[0.35em] text-neutral-500">
              OUR STORY
            </p>
          </div>

          {/* Right */}
          <div>

            <h2
              className="
                max-w-[900px]
                text-4xl
                font-medium
                leading-[1]
                tracking-[-0.04em]
                md:text-6xl
              "
            >
              A simple vision.
              <br />

              <span className="text-neutral-500">
                A lasting impression.
              </span>
            </h2>

            <div className="mt-12 max-w-[800px] space-y-7 text-base leading-8 text-neutral-400 md:text-lg">

              <p>
                NAMIKOL was created with a simple vision:
                redefine modern footwear by combining premium
                craftsmanship with elegant design.
              </p>

              <p>
                Every collection reflects attention to detail,
                durability, and everyday comfort.
              </p>

              <p>
                We believe luxury isn't just about appearance.
                It's about confidence, quality, and creating
                products that last for years.
              </p>

            </div>

            {/* Explore accent */}
            <div className="mt-12">
              <Link
                to="/shop"
                className="
                  group
                  inline-flex
                  items-center
                  gap-3
                  border-b
                  border-white/20
                  pb-2
                  text-xs
                  font-medium
                  tracking-[0.2em]
                  transition-colors
                  duration-300
                  hover:border-white
                "
              >
                EXPLORE COLLECTION

                <ArrowUpRight
                  size={15}
                  strokeWidth={1.5}
                  className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </Link>
            </div>

          </div>

        </div>

      </section>


      {/* =========================================
          STATS
      ========================================= */}
      <section className="px-6 pb-24 md:px-10 md:pb-32 lg:px-16">

        <div
          className="
            relative
            overflow-hidden
            rounded-[32px]
            border
            border-white/10
            bg-[#111111]
          "
        >

          {/* subtle background detail */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full border border-white/5" />

          <div className="grid md:grid-cols-2">

            {/* 5K */}
            <div className="border-b border-white/10 p-8 md:border-r md:p-14">
              <p
                className="
                  text-6xl
                  font-semibold
                  tracking-[-0.06em]
                  md:text-8xl
                "
              >
                5K+
              </p>

              <p className="mt-3 text-sm tracking-[0.12em] text-neutral-500">
                HAPPY CUSTOMERS
              </p>
            </div>


            {/* 100 */}
            <div className="border-b border-white/10 p-8 md:p-14">
              <p
                className="
                  text-6xl
                  font-semibold
                  tracking-[-0.06em]
                  md:text-8xl
                "
              >
                100+
              </p>

              <p className="mt-3 text-sm tracking-[0.12em] text-neutral-500">
                PREMIUM DESIGNS
              </p>
            </div>


            {/* 25 */}
            <div className="border-b border-white/10 p-8 md:border-b-0 md:border-r md:p-14">
              <p
                className="
                  text-6xl
                  font-semibold
                  tracking-[-0.06em]
                  md:text-8xl
                "
              >
                25+
              </p>

              <p className="mt-3 text-sm tracking-[0.12em] text-neutral-500">
                COUNTRIES SERVED
              </p>
            </div>


            {/* 99 */}
            <div className="p-8 md:p-14">
              <p
                className="
                  text-6xl
                  font-semibold
                  tracking-[-0.06em]
                  md:text-8xl
                "
              >
                99%
              </p>

              <p className="mt-3 text-sm tracking-[0.12em] text-neutral-500">
                CUSTOMER SATISFACTION
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* =========================================
          CLOSING
      ========================================= */}
      <section className="border-t border-white/10 px-6 py-28 md:px-10 md:py-36 lg:px-16">

        <div className="flex flex-col justify-between gap-12 md:flex-row md:items-end">

          <div>
            <p className="text-xs tracking-[0.35em] text-neutral-600">
              NAMIKOL
            </p>

            <h2
              className="
                mt-5
                max-w-[800px]
                text-4xl
                font-medium
                leading-[0.95]
                tracking-[-0.05em]
                md:text-6xl
              "
            >
              Designed to move.
              <br />
              <span className="text-neutral-500">
                Made to last.
              </span>
            </h2>
          </div>

          <Link
            to="/shop"
            className="
              group
              flex
              w-fit
              items-center
              gap-4
              rounded-full
              border
              border-white/15
              px-6
              py-3
              text-xs
              font-medium
              tracking-[0.18em]
              transition-all
              duration-300
              hover:border-white
              hover:bg-white
              hover:text-black
            "
          >
            SHOP NAMIKOL

            <ArrowUpRight
              size={16}
              strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </Link>

        </div>

      </section>

    </main>
  )
}

export default About
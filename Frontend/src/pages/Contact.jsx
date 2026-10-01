import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import api from "../services/api"

import {
  FiArrowLeft,
  FiArrowUpRight,
  FiInstagram,
  FiFacebook,
  FiMail,
  FiPhone,
  FiMapPin,
} from "react-icons/fi"

function Contact() {
  const navigate = useNavigate()
  const location = useLocation()
  const [contactInfo, setContactInfo] = useState(null)
  const [contactInfoError, setContactInfoError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState("")
  const [formError, setFormError] = useState("")

  useEffect(() => {
    let active = true

    api.get("/public/contact-info")
      .then((response) => {
        if (active) setContactInfo(response.data?.contactInfo || {})
      })
      .catch((error) => {
        if (active) {
          setContactInfoError(
            error.response?.data?.message || "Contact details are unavailable."
          )
        }
      })

    return () => {
      active = false
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (
      !localStorage.getItem("namikol-token") ||
      !localStorage.getItem("namikol_customer_session")
    ) {
      navigate("/login", {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
          },
        },
      })
      return
    }

    try {
      setSubmitting(true)
      setFormError("")
      const response = await api.post("/public/contact", formData)
      setFormMessage(response.data?.message || "Your message has been received.")
      setFormData({ name: "", email: "", subject: "", message: "" })
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("namikol-token")
        localStorage.removeItem("namikol_customer_session")
        window.dispatchEvent(new Event("namikol-auth-changed"))
        navigate("/login", {
          state: {
            from: {
              pathname: location.pathname,
              search: location.search,
            },
          },
        })
        return
      }

      setFormError(
        error.response?.data?.message ||
          "Unable to send your message. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">

      {/* HERO */}
      <section className="px-6 pb-20 pt-12 md:px-10 md:pb-28 lg:px-16">
        <Link
          to="/"
          className="group inline-flex items-center gap-3 text-xs font-medium tracking-[0.28em] text-neutral-500 transition-colors duration-300 hover:text-white"
        >
          <FiArrowLeft
            size={15}
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />
          BACK HOME
        </Link>

        <div className="mt-24 md:mt-28 lg:mt-32">
          <p className="mb-7 text-xs font-medium tracking-[0.4em] text-neutral-500">
            CONTACT NAMIKOL
          </p>

          <h1 className="max-w-[1100px] text-[clamp(4rem,10vw,9rem)] font-semibold leading-[0.82] tracking-[-0.065em]">
            Let's
            <br />
            <span className="ml-[12vw] text-neutral-400">Talk.</span>
          </h1>

          <div className="mt-16 flex justify-end md:mt-20">
            <p className="max-w-[620px] text-base leading-8 text-neutral-400 md:text-lg">
              Have a question about a product, an order, or simply want to
              connect with NAMIKOL? We're here to help.
            </p>
          </div>
        </div>

        <div className="mt-20 h-px w-full bg-white/10 md:mt-28" />

        <div className="mt-5 flex justify-between text-[10px] tracking-[0.3em] text-neutral-600">
          <span>WE'RE LISTENING</span>
          <span>CONTACT / 01</span>
        </div>
      </section>

      {/* CONTACT + FORM */}
      <section className="border-t border-white/10 px-6 py-24 md:px-10 md:py-32 lg:px-16">
        <div className="grid gap-20 lg:grid-cols-[0.8fr_1.4fr] lg:gap-28">

          {/* CONTACT DETAILS */}
          <div>
            <p className="text-xs font-medium tracking-[0.35em] text-neutral-600">
              GET IN TOUCH
            </p>

            <h2 className="mt-5 text-3xl font-medium tracking-[-0.04em] md:text-4xl">
              We'd love to
              <br />
              hear from you.
            </h2>

            <div className="mt-14 space-y-9">

              <div className="flex gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#111]">
                  <FiMail size={16} />
                </div>

                <div>
                  <p className="text-[10px] tracking-[0.25em] text-neutral-600">
                    EMAIL
                  </p>

                  <a
                    href={contactInfo?.email ? `mailto:${contactInfo.email}` : undefined}
                    className="mt-2 block text-sm text-neutral-300 transition-colors hover:text-white"
                  >
                    {contactInfo?.email || (contactInfoError ? "Unavailable" : "Loading...")}
                  </a>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#111]">
                  <FiPhone size={16} />
                </div>

                <div>
                  <p className="text-[10px] tracking-[0.25em] text-neutral-600">
                    PHONE
                  </p>

                  <a
                    href={contactInfo?.phone ? `tel:${contactInfo.phone.replace(/[^\d+]/g, "")}` : undefined}
                    className="mt-2 block text-sm text-neutral-300 transition-colors hover:text-white"
                  >
                    {contactInfo?.phone || (contactInfoError ? "Unavailable" : "Loading...")}
                  </a>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#111]">
                  <FiMapPin size={16} />
                </div>

                <div>
                  <p className="text-[10px] tracking-[0.25em] text-neutral-600">
                    LOCATION
                  </p>

                  <p className="mt-2 text-sm text-neutral-300">
                    {contactInfo?.location || (contactInfoError ? "Unavailable" : "Loading...")}
                  </p>
                </div>
              </div>

            </div>

            {/* SOCIAL */}
            <div className="mt-16">
              <p className="text-[10px] tracking-[0.25em] text-neutral-600">
                FOLLOW NAMIKOL
              </p>

              <div className="mt-5 flex gap-3">
                <a
                  href="#"
                  aria-label="Instagram"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#111] transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
                >
                  <FiInstagram size={17} />
                </a>

                <a
                  href="#"
                  aria-label="Facebook"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#111] transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
                >
                  <FiFacebook size={17} />
                </a>
              </div>
            </div>
          </div>

          {/* CONTACT FORM */}
          <div className="rounded-[32px] border border-white/10 bg-[#0d0d0d] p-7 md:p-10 lg:p-12">

            <div className="mb-10">
              <p className="text-xs font-medium tracking-[0.3em] text-neutral-600">
                SEND A MESSAGE
              </p>

              <h2 className="mt-4 text-3xl font-medium tracking-[-0.04em] md:text-4xl">
                How can we help?
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

              {formMessage && <p className="text-sm text-green-400" role="status">{formMessage}</p>}
              {formError && <p className="text-sm text-red-400" role="alert">{formError}</p>}

              <div>
                <label
                  htmlFor="name"
                  className="mb-3 block text-[10px] font-medium tracking-[0.25em] text-neutral-500"
                >
                  FULL NAME
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="h-14 w-full border-b border-white/15 bg-transparent text-sm text-white outline-none placeholder:text-neutral-700 transition-colors focus:border-white"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-3 block text-[10px] font-medium tracking-[0.25em] text-neutral-500"
                >
                  EMAIL ADDRESS
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="h-14 w-full border-b border-white/15 bg-transparent text-sm text-white outline-none placeholder:text-neutral-700 transition-colors focus:border-white"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-3 block text-[10px] font-medium tracking-[0.25em] text-neutral-500"
                >
                  SUBJECT
                </label>

                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What can we help with?"
                  required
                  className="h-14 w-full border-b border-white/15 bg-transparent text-sm text-white outline-none placeholder:text-neutral-700 transition-colors focus:border-white"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-3 block text-[10px] font-medium tracking-[0.25em] text-neutral-500"
                >
                  MESSAGE
                </label>

                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help..."
                  rows={5}
                  required
                  className="w-full resize-none border-b border-white/15 bg-transparent py-3 text-sm leading-7 text-white outline-none placeholder:text-neutral-700 transition-colors focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group mt-3 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-xs font-semibold tracking-[0.2em] text-black transition-all duration-300 hover:bg-neutral-300"
              >
                {submitting ? "SENDING..." : "SEND MESSAGE"}

                <FiArrowUpRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </button>

            </form>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="border-t border-white/10 px-6 py-28 md:px-10 md:py-36 lg:px-16">
        <p className="text-xs tracking-[0.35em] text-neutral-600">
          NAMIKOL
        </p>

        <div className="mt-6 flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <h2 className="max-w-[800px] text-4xl font-medium leading-[0.95] tracking-[-0.05em] md:text-6xl">
            Every question
            <br />
            <span className="text-neutral-500">deserves an answer.</span>
          </h2>

          <Link
            to="/shop"
            className="group flex w-fit items-center gap-4 rounded-full border border-white/15 px-6 py-3 text-xs font-medium tracking-[0.18em] transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
          >
            EXPLORE NAMIKOL

            <FiArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </Link>
        </div>
      </section>

    </main>
  )
}

export default Contact
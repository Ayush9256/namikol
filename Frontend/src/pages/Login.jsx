import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  FiArrowLeft,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
} from "react-icons/fi"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion"
import api from "../services/api"

function Login() {
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const smoothX = useSpring(mouseX, {
    stiffness: 120,
    damping: 20,
    mass: 0.5,
  })

  const smoothY = useSpring(mouseY, {
    stiffness: 120,
    damping: 20,
    mass: 0.5,
  })

  const cardX = useTransform(smoothX, [-1, 1], [-24, 24])
  const cardY = useTransform(smoothY, [-1, 1], [-18, 18])

  const rotateY = useTransform(smoothX, [-1, 1], [-8, 8])
  const rotateX = useTransform(smoothY, [-1, 1], [8, -8])

  const handleMouseMove = (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1
    const y = (event.clientY / window.innerHeight) * 2 - 1

    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const email = formData.email.trim().toLowerCase()
    const password = formData.password

    if (!email || !password) {
      alert("Please enter your email and password.")
      return
    }

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      })

      const { token, customer } = response.data

      localStorage.setItem("namikol-token", token)

      const session = {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || "",
        role: customer.role,
        loginAt: new Date().toISOString(),
      }

      localStorage.setItem(
        "namikol_customer_session",
        JSON.stringify(session)
      )

      window.dispatchEvent(new Event("namikol-auth-changed"))

      alert(`Welcome back, ${customer.firstName}!`)

      navigate("/")
    } catch (error) {
      console.error("Customer login error:", error)

      const message =
        error.response?.data?.message ||
        "Unable to login. Please try again."

      alert(message)
    }
  }

  return (
    <main
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen overflow-hidden bg-[#050505] text-white"
    >
      {/* Go Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111]/80 px-4 py-2.5 text-sm font-semibold text-neutral-400 backdrop-blur-xl transition hover:border-white/20 hover:bg-[#181818] hover:text-white lg:left-8 lg:top-7"
      >
        <FiArrowLeft size={17} />
        Go Back
      </button>

      {/* Background Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Ambient Glow */}
      <div className="pointer-events-none absolute left-[5%] top-[15%] h-[450px] w-[450px] rounded-full bg-white/[0.035] blur-[130px]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1400px] items-center px-6 py-6 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_540px] xl:grid-cols-[1fr_560px]">

          {/* LEFT SIDE */}
          <div className="relative hidden h-[600px] items-center justify-center lg:flex">

            {/* Rings */}
            <motion.div
              style={{
                x: cardX,
                y: cardY,
              }}
              className="absolute h-[200px] w-[460px] rounded-[50%] border border-white/[0.07]"
            />

            <motion.div
              style={{
                x: cardX,
                y: cardY,
              }}
              className="absolute h-[135px] w-[360px] rounded-[50%] border border-white/[0.045]"
            />

            {/* NAMIKOL CARD */}
            <motion.div
              style={{
                x: cardX,
                y: cardY,
                rotateX,
                rotateY,
              }}
              whileHover={{
                scale: 1.035,
              }}
              transition={{
                scale: {
                  duration: 0.25,
                },
              }}
              className="relative z-10 flex h-[280px] w-[280px] items-center justify-center rounded-[2.5rem] border border-white/10 bg-[#111111] shadow-[0_40px_100px_rgba(0,0,0,0.65)]"
            >
              <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_55%)]" />

              <div className="relative flex flex-col items-center">
                <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.65em] text-neutral-600">
                  NAMIKOL
                </p>

                <div className="text-[100px] font-black leading-none tracking-[-0.08em] text-white">
                  N
                </div>

                <div className="mt-4 flex gap-1">
                  <span className="h-1 w-1 rounded-full bg-neutral-600" />
                  <span className="h-1 w-1 rounded-full bg-neutral-500" />
                  <span className="h-1 w-1 rounded-full bg-neutral-400" />
                </div>
              </div>
            </motion.div>

            {/* Small floating decoration */}
            <motion.div
              style={{
                x: cardX,
                y: cardY,
              }}
              className="absolute bottom-[16%] left-[25%] flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#111111] text-xl text-neutral-500"
            >
              ✦
            </motion.div>
          </div>

          {/* RIGHT LOGIN PANEL */}
          <div className="w-full">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#111111]/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">

              <div className="mb-6">
                <p className="text-[10px] font-medium uppercase tracking-[0.55em] text-neutral-600">
                  CUSTOMER ACCOUNT
                </p>

                <h1 className="mt-2 text-5xl font-black leading-[0.9] tracking-[-0.05em] sm:text-6xl">
                  Welcome
                  <br />
                  Back
                </h1>

                <p className="mt-3 text-sm text-neutral-500">
                  Sign in to access your NAMIKOL orders and account.
                </p>
              </div>

              {/* Divider */}
              <div className="my-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />

                <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
                  Namikol
                </span>

                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-neutral-400"
                  >
                    <FiMail size={15} />
                    Email Address
                  </label>

                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="h-[56px] w-full rounded-xl border border-white/10 bg-[#080808] px-5 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="flex items-center gap-2 text-xs font-semibold text-neutral-400"
                    >
                      <FiLock size={15} />
                      Password
                    </label>

                    <Link
                      to="/password-recovery"
                      className="cursor-pointer text-[11px] text-neutral-600 transition hover:text-white"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      className="h-[56px] w-full rounded-xl border border-white/10 bg-[#080808] px-5 pr-12 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      className="absolute right-4 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center text-neutral-600 transition hover:text-white"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign In */}
                <button
                  type="submit"
                  className="group flex h-[58px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-white text-base font-black uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200"
                >
                  <span>Log in</span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-transform duration-300 group-hover:translate-x-1">
                    <FiArrowRight size={19} />
                  </span>
                </button>
              </form>

              {/* Register */}
              <div className="mt-4 border-t border-white/10 pt-4 text-center">
                <p className="text-xs text-neutral-600">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="cursor-pointer font-semibold text-neutral-300 transition hover:text-white"
                  >
                    Create one
                  </Link>
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  )
}

export default Login
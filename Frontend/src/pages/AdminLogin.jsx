import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiShield,
  FiArrowRight,
} from "react-icons/fi";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import api from "../services/api";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, {
    stiffness: 120,
    damping: 20,
    mass: 0.5,
  });

  const smoothY = useSpring(mouseY, {
    stiffness: 120,
    damping: 20,
    mass: 0.5,
  });

  const cardX = useTransform(smoothX, [-1, 1], [-24, 24]);
  const cardY = useTransform(smoothY, [-1, 1], [-18, 18]);

  const rotateY = useTransform(smoothX, [-1, 1], [-8, 8]);
  const rotateX = useTransform(smoothY, [-1, 1], [8, -8]);

  const handleMouseMove = (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = (event.clientY / window.innerHeight) * 2 - 1;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/admin/auth/login", {
        email: email.trim(),
        password,
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(
          data.message || "Admin login failed."
        );
      }

      /*
        Admin authentication is handled
        exclusively by the HTTP-only backend cookie.
      */
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Admin login failed:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to login as admin.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen overflow-hidden bg-[#050505] text-white"
    >
      <Link
        to="/"
        className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-[#111111]/80 px-4 py-2.5 text-sm font-semibold text-neutral-400 backdrop-blur-xl transition hover:border-white/20 hover:bg-[#181818] hover:text-white lg:left-8 lg:top-7"
      >
        <FiArrowLeft size={17} />
        Back to Website
      </Link>

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

      <div className="pointer-events-none absolute left-[5%] top-[15%] h-[450px] w-[450px] rounded-full bg-white/[0.035] blur-[130px]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1400px] items-center px-6 py-6 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_540px] xl:grid-cols-[1fr_560px]">

          {/* LEFT SIDE */}
          <div className="relative hidden h-[600px] items-center justify-center lg:flex">

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
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <FiShield
                    size={27}
                    className="text-neutral-300"
                  />
                </div>

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

          {/* RIGHT SIDE */}
          <div className="w-full">
            <div className="rounded-[1.75rem] border border-white/10 bg-[#111111]/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">

              <div className="mb-6">
                <p className="text-[10px] font-medium uppercase tracking-[0.55em] text-neutral-600">
                  ADMINISTRATION
                </p>

                <h1 className="mt-2 text-5xl font-black leading-[0.9] tracking-[-0.05em] sm:text-6xl">
                  Admin
                  <br />
                  Login
                </h1>

                <p className="mt-3 text-sm text-neutral-500">
                  Sign in to manage your NAMIKOL store.
                </p>
              </div>

              <div className="my-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />

                <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
                  namikol
                </span>

                <div className="h-px flex-1 bg-white/10" />
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-neutral-400"
                  >
                    Email Address
                  </label>

                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();

                        document
                          .getElementById("admin-password")
                          ?.focus();
                      }
                    }}
                    placeholder="Enter admin email"
                    autoComplete="username"
                    required
                    className="h-[56px] w-full rounded-xl border border-white/10 bg-[#080808] px-5 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="admin-password"
                      className="flex items-center gap-2 text-xs font-semibold text-neutral-400"
                    >
                      Password
                    </label>

                    <Link
                      to="/admin/forgot-password"
                      className="cursor-pointer text-[11px] text-neutral-600 transition hover:text-white"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <input
                      id="admin-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="h-[56px] w-full rounded-xl border border-white/10 bg-[#080808] px-5 pr-12 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
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

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-[58px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-white text-base font-black uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    {loading
                      ? "Signing In..."
                      : "Admin Login"}
                  </span>

                  {!loading && (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-transform duration-300 group-hover:translate-x-1">
                      <FiArrowRight size={19} />
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-4 border-t border-white/10 pt-4 text-center">
                <p className="text-xs text-neutral-600">
                  Authorized administrators only.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

export default AdminLogin;
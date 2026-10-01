import { useEffect, useState } from "react"

import {
  FiArrowUpRight,
  FiInstagram,
  FiFacebook,
  FiMail,
  FiShield,
  FiUser,
} from "react-icons/fi"

import { Link, useNavigate } from "react-router-dom"

import api from "../services/api"

function Footer() {
  const navigate = useNavigate()

  // =====================================================
  // ACCOUNT STATE
  // =====================================================

  const [accountType, setAccountType] = useState("guest")
  const [accountName, setAccountName] = useState("")

  const isLoggedIn = Boolean(
    localStorage.getItem("namikol-token")
  )

  // =====================================================
  // DETECT ADMIN / CUSTOMER
  // =====================================================

  useEffect(() => {
    let cancelled = false

    const detectAccount = async () => {
      /*
        ---------------------------------------------------
        1. CHECK ADMIN
        ---------------------------------------------------

        Admin authentication uses the HTTP-only backend
        cookie, so we check the backend session.
      */

      try {
        const adminResponse = await api.get(
          "/admin/auth/me"
        )

        if (
          adminResponse.data?.success === true &&
          adminResponse.data?.admin?.role === "admin"
        ) {
          if (!cancelled) {
            setAccountType("admin")

            setAccountName(
              adminResponse.data?.admin?.name ||
                adminResponse.data?.admin?.fullName ||
                "Admin"
            )
          }

          return
        }
      } catch (error) {
        // Admin is not logged in.
      }

      /*
        ---------------------------------------------------
        2. CHECK CUSTOMER
        ---------------------------------------------------
      */

      if (!isLoggedIn) {
        if (!cancelled) {
          setAccountType("guest")
          setAccountName("")
        }

        return
      }

      try {
        const customerResponse = await api.get(
          "/customer/profile"
        )

        if (
          customerResponse.data?.success === true &&
          customerResponse.data?.customer
        ) {
          const customer =
            customerResponse.data.customer

          const fullName =
            `${customer.firstName || ""} ${
              customer.lastName || ""
            }`.trim()

          if (!cancelled) {
            setAccountType("user")
            setAccountName(
              fullName || "Account"
            )
          }

          return
        }
      } catch (error) {
        console.error(
          "Failed to detect customer account:",
          error
        )
      }

      /*
        ---------------------------------------------------
        3. FALLBACK
        ---------------------------------------------------
      */

      if (!cancelled) {
        setAccountType("guest")
        setAccountName("")
      }
    }

    detectAccount()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleNavigation = (path) => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    })

    navigate(path)
  }

  // =====================================================
  // MY ACCOUNT
  // =====================================================

  const handleAccount = () => {
    // Admin should never open customer account.
    if (accountType === "admin") {
      return
    }

    handleNavigation(
      isLoggedIn ? "/account" : "/login"
    )
  }

  // =====================================================
  // MY ORDERS
  // =====================================================

  const handleOrders = () => {
    // Admin should never open customer orders.
    if (accountType === "admin") {
      return
    }

    handleNavigation(
      isLoggedIn ? "/orders" : "/login"
    )
  }

  // =====================================================
  // DYNAMIC ACCOUNT BUTTON
  // =====================================================

  const handleAccountButton = () => {
    if (accountType === "admin") {
      handleNavigation("/admin/dashboard")
      return
    }

    if (accountType === "user") {
      handleNavigation("/account")
      return
    }

    handleNavigation("/admin/login")
  }

  // =====================================================
  // BACK TO TOP
  // =====================================================

  const backToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <footer className="border-t border-white/10 bg-[#050505] text-white">

      {/* =================================================
          MAIN FOOTER
      ================================================= */}

      <div className="mx-auto grid max-w-[1900px] gap-12 px-6 py-12 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:px-12">

        {/* =================================================
            BRAND
        ================================================= */}

        <div>
          <Link
            to="/"
            onClick={() => window.scrollTo(0, 0)}
            className="inline-block text-4xl font-black tracking-[0.18em]"
          >
            NAMIKOL
          </Link>

          <p className="mt-2 max-w-xl text-base leading-8 text-[#687286]">
            Premium footwear crafted with character, precision, and a
            distinctly modern edge.
          </p>

          {/* SOCIAL ICONS */}

          <div className="mt-7 flex gap-4">

            {/* INSTAGRAM */}

            <a
              href="https://www.instagram.com/namikol.official/"
              aria-label="Instagram"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 text-white transition duration-300 hover:border-white hover:bg-white hover:text-black"
            >
              <FiInstagram size={21} />
            </a>

            {/* FACEBOOK */}

            <a
              href="https://www.facebook.com/namikol.official/"
              aria-label="Facebook"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 text-white transition duration-300 hover:border-white hover:bg-white hover:text-black"
            >
              <FiFacebook size={21} />
            </a>

            {/* EMAIL */}

            <a
              href="mailto:support@namikol.com"
              aria-label="Email"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 text-white transition duration-300 hover:border-white hover:bg-white hover:text-black"
            >
              <FiMail size={21} />
            </a>

          </div>
        </div>

        {/* =================================================
            SHOP
        ================================================= */}

        <div>
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-[#687286]">
            SHOP
          </p>

          <div className="flex flex-col gap-5 text-base">

            <Link
              to="/shop"
              onClick={() => window.scrollTo(0, 0)}
              className="transition duration-300 hover:text-neutral-400"
            >
              All Products
            </Link>

            <Link
              to="/shop?gender=men"
              onClick={() => window.scrollTo(0, 0)}
              className="transition duration-300 hover:text-neutral-400"
            >
              Men
            </Link>

            <Link
              to="/shop?gender=women"
              onClick={() => window.scrollTo(0, 0)}
              className="transition duration-300 hover:text-neutral-400"
            >
              Women
            </Link>

            <Link
              to="/shop/new-arrivals?gender=men"
              onClick={() => window.scrollTo(0, 0)}
              className="transition duration-300 hover:text-neutral-400"
            >
              New Arrivals
            </Link>

            <Link
              to="/shop/best-sellers?gender=men"
              onClick={() => window.scrollTo(0, 0)}
              className="transition duration-300 hover:text-neutral-400"
            >
              Best Sellers
            </Link>

          </div>
        </div>

        {/* =================================================
            COMPANY
        ================================================= */}

        <div>
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-[#687286]">
            COMPANY
          </p>

          <div className="flex flex-col gap-5 text-base">

            <Link
              to="/about"
              onClick={() => window.scrollTo(0, 0)}
              className="transition duration-300 hover:text-neutral-400"
            >
              About
            </Link>

            <Link
              to="/contact"
              onClick={() => window.scrollTo(0, 0)}
              className="transition duration-300 hover:text-neutral-400"
            >
              Contact
            </Link>

            {/* MY ACCOUNT
                HIDDEN FOR ADMIN
            */}

            {accountType !== "admin" && (
              <button
                type="button"
                onClick={handleAccount}
                className="w-fit cursor-pointer text-left transition duration-300 hover:text-neutral-400"
              >
                My Account
              </button>
            )}

            {/* MY ORDERS
                HIDDEN FOR ADMIN
            */}

            {accountType !== "admin" && (
              <button
                type="button"
                onClick={handleOrders}
                className="w-fit cursor-pointer text-left transition duration-300 hover:text-neutral-400"
              >
                My Orders
              </button>
            )}

          </div>
        </div>

        {/* =================================================
            SUPPORT
        ================================================= */}

        <div>
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-[#687286]">
            SUPPORT
          </p>

          <div className="flex flex-col gap-5 text-base">

            <p className="text-[#687286]">
              Premium footwear support
            </p>

            <a
              href="mailto:support@namikol.com"
              className="font-semibold transition duration-300 hover:text-neutral-400"
            >
              support@namikol.com
            </a>

            <p className="text-[#687286]">
              Jaipur, Rajasthan
            </p>

          </div>
        </div>

      </div>

      {/* =================================================
          FOUNDER / CO-FOUNDER / DYNAMIC ACCOUNT
      ================================================= */}

      <div className="border-t border-white/10">

        <div className="mx-auto grid max-w-[1900px] gap-8 px-6 py-5 md:grid-cols-3 md:items-center lg:px-12">

          {/* FOUNDER */}

          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#687286]">
              FOUNDER
            </p>

            <p className="mt-1 text-lg font-bold">
              Nikhil Dev Sharma
            </p>
          </div>

          {/* CO-FOUNDER */}

          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#687286]">
              CO-FOUNDER
            </p>

            <p className="mt-1 text-lg font-bold">
              Anamika Jain
            </p>
          </div>

          {/* =================================================
              DYNAMIC ACCOUNT BUTTON
          ================================================= */}

          <div className="md:flex md:justify-end">

            <button
              type="button"
              onClick={handleAccountButton}
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] transition duration-300 hover:border-white hover:bg-white hover:text-black"
            >

              {/* ICON */}

              {accountType === "admin" ? (
                <FiShield size={16} />
              ) : accountType === "user" ? (
                <FiUser size={16} />
              ) : (
                <FiShield size={16} />
              )}

              {/* NAME */}

              <span>
                {accountType === "admin"
                  ? "ADMIN"
                  : accountType === "user"
                  ? accountName
                  : "ADMIN LOGIN"}
              </span>

              {/* ARROW */}

              <FiArrowUpRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />

            </button>

          </div>

        </div>

      </div>

      {/* =================================================
          BOTTOM BAR
      ================================================= */}

      <div className="border-t border-white/10">

        <div className="mx-auto flex max-w-[1900px] flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-12">

          <p className="text-xs text-[#687286]">
            © 2026 NAMIKOL. All rights reserved.
          </p>

          <button
            type="button"
            onClick={backToTop}
            className="group flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#687286] transition duration-300 hover:text-white"
          >
            BACK TO TOP

            <FiArrowUpRight
              size={15}
              className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </button>

        </div>

      </div>

    </footer>
  )
}

export default Footer
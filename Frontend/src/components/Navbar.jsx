import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  FiSearch,
  FiShoppingBag,
  FiChevronUp,
  FiChevronDown,
  FiHeart,
  FiUser,
  FiLogOut,
  FiShield,
  FiMenu,
  FiX,
} from "react-icons/fi"

import { useCart } from "../context/useCart"
import { useWishlist } from "../context/useWishlist"
import api from "../services/api"

const readCustomerSession = () => {
  try {
    const value = localStorage.getItem("namikol_customer_session")
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function Navbar() {
  const {
    uniqueSkuCount,
  } = useCart()

  const { wishlistCount } = useWishlist()

  const location = useLocation()
  const navigate = useNavigate()

  const [collectionsOpen, setCollectionsOpen] = useState(false)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [customerSession, setCustomerSession] = useState(readCustomerSession)

  const [isAdmin, setIsAdmin] = useState(false)

  const [collectionProducts, setCollectionProducts] = useState([])

  const collectionsCloseTimer = useRef(null)
  const navRef = useRef(null)

  const [activeIndicator, setActiveIndicator] = useState({
    left: 0,
    width: 0,
    visible: false,
  })

  useEffect(() => {
    const syncCustomerSession = () => {
      setCustomerSession(readCustomerSession())
    }

    window.addEventListener("namikol-auth-changed", syncCustomerSession)
    return () => {
      window.removeEventListener("namikol-auth-changed", syncCustomerSession)
    }
  }, [])

  const isLoggedIn = Boolean(customerSession)

  /* ADMIN SESSION */

  useEffect(() => {
    let cancelled = false

    const checkAdminSession = async () => {
      try {
        const response = await api.get("/admin/auth/me")
        const data = response.data

        if (!cancelled) {
          setIsAdmin(
              data.success === true &&
              data.admin?.role === "admin"
          )
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false)
        }
      }
    }

    checkAdminSession()

    return () => {
      cancelled = true
    }
  }, [location.pathname, location.search])

  /* LOAD COLLECTION PRODUCTS FROM BACKEND */

  useEffect(() => {
    let cancelled = false

    const loadCollectionProducts = async () => {
      try {
        const response = await api.get("/products")

        if (!cancelled) {
          setCollectionProducts(
            response.data?.products || []
          )
        }
      } catch (error) {
        console.error(
          "Failed to load collection products:",
          error
        )

        if (!cancelled) {
          setCollectionProducts([])
        }
      }
    }

    loadCollectionProducts()

    return () => {
      cancelled = true
    }
  }, [])

  /* BUILD DYNAMIC COLLECTIONS */

  const collections = collectionProducts.reduce(
    (result, product) => {
      const gender = product.gender?.toLowerCase()
      const category = product.category?.trim()

      if (!gender || !category) {
        return result
      }

      if (!result[gender]) {
        result[gender] = []
      }

      const alreadyExists = result[gender].some(
        (existingCategory) =>
          existingCategory.toLowerCase() ===
          category.toLowerCase()
      )

      if (!alreadyExists) {
        result[gender].push(category)
      }

      return result
    },
    {}
  )

  const collectionGenderOrder = [
    "men",
    "women",
    "unisex",
  ]

  const availableGenders = collectionGenderOrder

  /* CUSTOMER LOGOUT */

  const handleLogout = () => {
    localStorage.removeItem("namikol-token")
    localStorage.removeItem(
      "namikol_customer_session"
    )

    window.dispatchEvent(new Event("namikol-auth-changed"))
    setCustomerSession(null)

    alert(
      "You have been logged out successfully."
    )

    navigate("/")
  }

  /* ADMIN DASHBOARD */

  const handleAdminDashboard = () => {
    navigate("/admin/dashboard")
  }

  /* ACTIVE ROUTES */

  const isHomeActive =
    location.pathname === "/"

  const isShopActive =
    location.pathname === "/shop" ||
    location.pathname.startsWith("/shop/")

  const isCollectionsActive =
    location.pathname.startsWith("/collections/")

  const isAboutActive =
    location.pathname === "/about"

  const isContactActive =
    location.pathname === "/contact"

  const isAccountActive =
    location.pathname === "/account"

  const isOrdersActive =
    location.pathname === "/orders"

  /* COLLECTIONS TIMER */

  const clearCollectionsTimer = () => {
    if (collectionsCloseTimer.current) {
      clearTimeout(
        collectionsCloseTimer.current
      )

      collectionsCloseTimer.current = null
    }
  }

  const closeCollections = () => {
    clearCollectionsTimer()
    setCollectionsOpen(false)
  }

  const startCollectionsCloseTimer = () => {
    clearCollectionsTimer()

    collectionsCloseTimer.current =
      setTimeout(() => {
        setCollectionsOpen(false)
        collectionsCloseTimer.current = null
      }, 2000)
  }

  const handleCollectionsMouseEnter = () => {
    clearCollectionsTimer()
  }

  const handleCollectionsMouseLeave = () => {
    startCollectionsCloseTimer()
  }

  const toggleCollections = () => {
    clearCollectionsTimer()

    setCollectionsOpen(
      (current) => !current
    )
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    closeCollections()
  }

  /* CLEANUP COLLECTIONS TIMER */

  useEffect(() => {
    return () => {
      clearCollectionsTimer()
    }
  }, [])

  /* UPDATE ACTIVE INDICATOR */

  const updateActiveIndicator = () => {
    const nav = navRef.current

    if (!nav) {
      return
    }

    const activeElement =
      nav.querySelector(
        '[data-nav-active="true"]'
      )

    if (!activeElement) {
      setActiveIndicator(
        (current) => ({
          ...current,
          visible: false,
        })
      )

      return
    }

    const navRect =
      nav.getBoundingClientRect()

    const activeRect =
      activeElement.getBoundingClientRect()

    setActiveIndicator({
      left:
        activeRect.left -
        navRect.left,

      width: activeRect.width,

      visible: true,
    })
  }

  useEffect(() => {
    const frameId =
      requestAnimationFrame(() => {
        updateActiveIndicator()
      })

    const handleResize = () => {
      updateActiveIndicator()
    }

    window.addEventListener(
      "resize",
      handleResize
    )

    return () => {
      cancelAnimationFrame(frameId)

      window.removeEventListener(
        "resize",
        handleResize
      )
    }
  }, [
    location.pathname,
    location.search,
    isLoggedIn,
    isAdmin,
  ])

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black text-white">
      <div className="mx-auto flex min-h-[78px] w-full items-center justify-between gap-4 px-4 sm:px-6 md:h-[110px] md:px-8 lg:px-16">

        {/* LOGO */}

        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <img
            src="/logo.jpeg"
            alt="NAMIKOL"
            className="h-10 w-auto object-contain"
          />

          <span className="hidden text-3xl font-bold tracking-[0.2em] sm:inline">
            NAMIKOL
          </span>
        </Link>

        {/* NAVIGATION */}

        <nav
          ref={navRef}
          className="relative hidden items-center gap-5 lg:gap-10 md:flex"
        >

          {/* HOME */}

          <Link
            to="/"
            data-nav-active={
              isHomeActive
                ? "true"
                : "false"
            }
            className={`text-sm font-medium tracking-[0.16em] transition-colors duration-200 hover:text-neutral-400 ${
              isHomeActive
                ? "text-white"
                : "text-neutral-400"
            }`}
          >
            HOME
          </Link>

          {/* SHOP */}

          <Link
            to="/shop"
            data-nav-active={
              isShopActive
                ? "true"
                : "false"
            }
            className={`text-sm font-medium tracking-[0.16em] transition-colors duration-200 hover:text-neutral-400 ${
              isShopActive
                ? "text-white"
                : "text-neutral-400"
            }`}
          >
            SHOP
          </Link>

          {/* COLLECTIONS */}

          <div
            className="relative"
            onMouseEnter={
              handleCollectionsMouseEnter
            }
            onMouseLeave={
              handleCollectionsMouseLeave
            }
          >
            <button
              type="button"
              onClick={toggleCollections}
              data-nav-active={
                isCollectionsActive
                  ? "true"
                  : "false"
              }
              className={`flex cursor-pointer items-center gap-2 text-sm font-medium tracking-[0.16em] transition-colors duration-200 hover:text-neutral-400 ${
                isCollectionsActive
                  ? "text-white"
                  : "text-neutral-400"
              }`}
            >
              COLLECTIONS

              {collectionsOpen ? (
                <FiChevronUp
                  size={15}
                  strokeWidth={1.7}
                />
              ) : (
                <FiChevronDown
                  size={15}
                  strokeWidth={1.7}
                />
              )}
            </button>

            {/* COLLECTIONS DROPDOWN */}

            {collectionsOpen && (
              <div
                className="
                  absolute
                  left-1/2
                  top-[27px]
                  w-[290px]
                  -translate-x-1/2
                  overflow-hidden
                  rounded-[26px]
                  border
                  border-white/15
                  bg-[#151515]
                  shadow-[0_20px_45px_rgba(0,0,0,0.45)]
                  animate-in
                "
                onMouseEnter={
                  handleCollectionsMouseEnter
                }
                onMouseLeave={
                  handleCollectionsMouseLeave
                }
              >
                <div className="px-5 py-4">

                  {availableGenders.length > 0 ? (
                    availableGenders.map(
                      (gender, genderIndex) => (
                        <div key={gender}>

                          {genderIndex > 0 && (
                            <div className="my-3 border-t border-white/10" />
                          )}

                          <div>
                            <p className="mb-2 text-[14px] font-bold tracking-[0.18em]">
                              {gender.toUpperCase()}
                            </p>

                            {(collections[gender] || []).map((category) => {
                              const categorySlug =
                                category
                                  .trim()
                                  .toLowerCase()
                                  .replace(
                                    /\s+/g,
                                    "-"
                                  )

                              return (
                                <Link
                                  key={`${gender}-${category}`}
                                  to={`/collections/${gender}/${categorySlug}`}
                                  onClick={
                                    closeCollections
                                  }
                                  className="
                                    block
                                    py-1.5
                                    text-[14px]
                                    tracking-[0.14em]
                                    text-neutral-300
                                    transition-colors
                                    duration-200
                                    hover:text-white
                                  "
                                >
                                  {category.toUpperCase()}
                                </Link>
                              )
                            })}

                            {(!collections[gender] ||
                              collections[gender].length === 0) && (
                              <p className="py-1 text-xs tracking-[0.12em] text-neutral-600">
                                NO PRODUCTS
                              </p>
                            )}
                          </div>

                        </div>
                      )
                    )
                  ) : (
                    <p className="py-3 text-center text-xs tracking-[0.16em] text-neutral-500">
                      NO COLLECTIONS AVAILABLE
                    </p>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* ABOUT */}

          <Link
            to="/about"
            data-nav-active={
              isAboutActive
                ? "true"
                : "false"
            }
            className={`text-sm font-medium tracking-[0.16em] transition-colors duration-200 hover:text-neutral-400 ${
              isAboutActive
                ? "text-white"
                : "text-neutral-400"
            }`}
          >
            ABOUT
          </Link>

          {/* CONTACT */}

          <Link
            to="/contact"
            data-nav-active={
              isContactActive
                ? "true"
                : "false"
            }
            className={`text-sm font-medium tracking-[0.16em] transition-colors duration-200 hover:text-neutral-400 ${
              isContactActive
                ? "text-white"
                : "text-neutral-400"
            }`}
          >
            CONTACT
          </Link>

          {/* CUSTOMER ACCOUNT */}

          {isLoggedIn && !isAdmin && (
            <>
              <Link
                to="/account"
                data-nav-active={
                  isAccountActive
                    ? "true"
                    : "false"
                }
                className={`flex items-center gap-2 text-sm font-medium tracking-[0.16em] transition-colors duration-200 hover:text-neutral-400 ${
                  isAccountActive
                    ? "text-white"
                    : "text-neutral-400"
                }`}
              >
                <FiUser size={15} />
                ACCOUNT
              </Link>

              {/* ORDERS */}

              <Link
                to="/orders"
                data-nav-active={
                  isOrdersActive
                    ? "true"
                    : "false"
                }
                className={`text-sm font-medium tracking-[0.16em] transition-colors duration-200 hover:text-neutral-400 ${
                  isOrdersActive
                    ? "text-white"
                    : "text-neutral-400"
                }`}
              >
                ORDERS
              </Link>
            </>
          )}

          {/* SHARED ACTIVE INDICATOR */}

          <span
            className="
              pointer-events-none
              absolute
              -bottom-[16px]
              left-0
              h-[2px]
              rounded-full
              bg-white
              transition-all
              duration-500
              ease-[cubic-bezier(0.22,1,0.36,1)]
            "
            style={{
              width:
                activeIndicator.visible
                  ? `${activeIndicator.width}px`
                  : "0px",

              transform: `translateX(${activeIndicator.left}px)`,

              opacity:
                activeIndicator.visible
                  ? 1
                  : 0,
            }}
          />

        </nav>

        {/* RIGHT SIDE */}

        <div className="flex items-center gap-3 sm:gap-5">

          {/* SEARCH */}

          <Link
            to="/search"
            className="
              transition-colors
              duration-200
              hover:text-neutral-400
            "
            aria-label="Search"
          >
            <FiSearch
              size={23}
              strokeWidth={1.8}
            />
          </Link>

          {/* WISHLIST */}

          {isLoggedIn && !isAdmin && (
            <Link
              to="/wishlist"
              className="
                relative
                transition-colors
                duration-200
                hover:text-neutral-400
              "
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <FiHeart
                size={23}
                strokeWidth={1.8}
              />

              {wishlistCount > 0 && (
                <span
                  className="
                    absolute
                    -right-3
                    -top-3
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-white
                    px-1
                    text-xs
                    font-bold
                    text-black
                  "
                >
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}

          {/* CART */}

          {isLoggedIn && !isAdmin && (
            <Link
              to="/cart"
              className="
                relative
                transition-colors
                duration-200
                hover:text-neutral-400
              "
              aria-label={`Cart with ${uniqueSkuCount} items`}
            >
              <FiShoppingBag
                size={23}
                strokeWidth={1.8}
              />

              {uniqueSkuCount > 0 && (
                <span
                  className="
                    absolute
                    -right-3
                    -top-3
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-white
                    px-1
                    text-xs
                    font-bold
                    text-black
                  "
                >
                  {uniqueSkuCount}
                </span>
              )}
            </Link>
          )}

          {/* ADMIN */}

          {isAdmin && (
            <div className="hidden items-center gap-3 lg:flex">

              <button
                type="button"
                onClick={
                  handleAdminDashboard
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/20
                  px-5
                  py-2.5
                  text-xs
                  font-semibold
                  tracking-[0.12em]
                  text-neutral-300
                  transition-all
                  duration-200
                  hover:border-white
                  hover:bg-white
                  hover:text-black
                "
              >
                <FiShield size={14} />
                ADMIN DASHBOARD
              </button>

            </div>
          )}

          {/* CUSTOMER LOGGED OUT */}

          {!isLoggedIn && !isAdmin && (
            <div className="hidden items-center gap-3 lg:flex">

              <Link
                to="/login"
                className="
                  rounded-full
                  border
                  border-white/20
                  px-5
                  py-2.5
                  text-xs
                  font-semibold
                  tracking-[0.12em]
                  transition-all
                  duration-200
                  hover:border-white
                  hover:bg-white
                  hover:text-black
                "
              >
                LOGIN
              </Link>

              <Link
                to="/register"
                className="
                  rounded-full
                  border
                  border-white/10
                  bg-neutral-800
                  px-5
                  py-2.5
                  text-xs
                  font-semibold
                  tracking-[0.12em]
                  text-neutral-300
                  transition-all
                  duration-200
                  hover:border-white
                  hover:bg-white
                  hover:text-black
                "
              >
                SIGN UP
              </Link>

            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="flex items-center justify-center p-1 md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* CUSTOMER LOGGED IN */}

          {isLoggedIn && !isAdmin && (
            <div className="hidden items-center gap-3 lg:flex">

              <span className="text-xs font-semibold tracking-[0.1em] text-neutral-400">
                HI,{" "}
                {customerSession?.firstName?.toUpperCase()}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/20
                  px-5
                  py-2.5
                  text-xs
                  font-semibold
                  tracking-[0.12em]
                  text-neutral-300
                  transition-all
                  duration-200
                  hover:border-white
                  hover:bg-white
                  hover:text-black
                "
              >
                <FiLogOut size={14} />
                LOGOUT
              </button>

            </div>
          )}

        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col">
            <Link to="/" onClick={closeMobileMenu} className="border-b border-white/10 py-3 text-sm font-medium tracking-[0.16em] text-neutral-300">
              HOME
            </Link>
            <Link to="/shop" onClick={closeMobileMenu} className="border-b border-white/10 py-3 text-sm font-medium tracking-[0.16em] text-neutral-300">
              SHOP
            </Link>
            <button
              type="button"
              onClick={toggleCollections}
              className="flex w-full items-center justify-between border-b border-white/10 py-3 text-left text-sm font-medium tracking-[0.16em] text-neutral-300"
              aria-expanded={collectionsOpen}
            >
              COLLECTIONS
              {collectionsOpen ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
            </button>
            {collectionsOpen && (
              <div className="border-b border-white/10 py-2 pl-4">
                {availableGenders.map((gender) => (
                  <div key={gender} className="py-2">
                    <p className="mb-1 text-xs font-bold tracking-[0.18em]">{gender.toUpperCase()}</p>
                    {(collections[gender] || []).map((category) => {
                      const categorySlug = category.trim().toLowerCase().replace(/\s+/g, "-")

                      return (
                        <Link
                          key={`${gender}-${category}`}
                          to={`/collections/${gender}/${categorySlug}`}
                          onClick={closeMobileMenu}
                          className="block py-1 text-xs tracking-[0.14em] text-neutral-400"
                        >
                          {category.toUpperCase()}
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
            <Link to="/about" onClick={closeMobileMenu} className="border-b border-white/10 py-3 text-sm font-medium tracking-[0.16em] text-neutral-300">
              ABOUT
            </Link>
            <Link to="/contact" onClick={closeMobileMenu} className="border-b border-white/10 py-3 text-sm font-medium tracking-[0.16em] text-neutral-300">
              CONTACT
            </Link>
            {isLoggedIn && !isAdmin && (
              <>
                <Link to="/account" onClick={closeMobileMenu} className="border-b border-white/10 py-3 text-sm font-medium tracking-[0.16em] text-neutral-300">
                  ACCOUNT
                </Link>
                <Link to="/orders" onClick={closeMobileMenu} className="border-b border-white/10 py-3 text-sm font-medium tracking-[0.16em] text-neutral-300">
                  ORDERS
                </Link>
                <button type="button" onClick={() => { handleLogout(); closeMobileMenu() }} className="py-3 text-left text-sm font-medium tracking-[0.16em] text-neutral-300">
                  LOGOUT
                </button>
              </>
            )}
            {!isLoggedIn && !isAdmin && (
              <div className="flex gap-3 pt-4">
                <Link to="/login" onClick={closeMobileMenu} className="flex-1 rounded-full border border-white/20 px-4 py-2.5 text-center text-xs font-semibold tracking-[0.12em]">
                  LOGIN
                </Link>
                <Link to="/register" onClick={closeMobileMenu} className="flex-1 rounded-full bg-neutral-800 px-4 py-2.5 text-center text-xs font-semibold tracking-[0.12em] text-neutral-300">
                  SIGN UP
                </Link>
              </div>
            )}
            {isAdmin && (
              <button type="button" onClick={() => { handleAdminDashboard(); closeMobileMenu() }} className="mt-4 flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-left text-xs font-semibold tracking-[0.12em] text-neutral-300">
                <FiShield size={14} />
                ADMIN DASHBOARD
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Navbar
import { useCallback, useEffect, useState } from "react"
import api from "../services/api"
import { normalizeProduct } from "../services/productService"
import { WishlistContext } from "./wishlistStore"

const normalizeWishlist = (products) =>
  Array.isArray(products)
    ? products.filter(Boolean).map(normalizeProduct)
    : []

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([])
  const [wishlistError, setWishlistError] = useState("")

  const loadWishlist = useCallback(async () => {
    if (!localStorage.getItem("namikol-token")) {
      setWishlistItems([])
      return
    }

    try {
      const response = await api.get("/wishlist")
      setWishlistItems(normalizeWishlist(response.data?.products))
      setWishlistError("")
    } catch (error) {
      setWishlistError(
        error.response?.data?.message || "Unable to load wishlist."
      )
    }
  }, [])

  useEffect(() => {
    let active = true

    if (localStorage.getItem("namikol-token")) {
      api.get("/wishlist").then((response) => {
        if (active) {
          setWishlistItems(normalizeWishlist(response.data?.products))
          setWishlistError("")
        }
      }).catch((error) => {
        if (active) {
          setWishlistError(
            error.response?.data?.message || "Unable to load wishlist."
          )
        }
      })
    }

    const handleAuthChange = () => loadWishlist()
    window.addEventListener("namikol-auth-changed", handleAuthChange)
    return () => {
      active = false
      window.removeEventListener("namikol-auth-changed", handleAuthChange)
    }
  }, [loadWishlist])

  const isInWishlist = useCallback(
    (productId) => wishlistItems.some(
      (item) => String(item.id || item._id) === String(productId)
    ),
    [wishlistItems]
  )

  const addToWishlist = useCallback(async (product) => {
    const productId = product?.id || product?._id
    if (!productId) return { success: false, message: "Product ID is missing." }

    try {
      const response = await api.post(`/wishlist/products/${productId}`)
      setWishlistItems(normalizeWishlist(response.data?.products))
      setWishlistError("")
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Unable to update wishlist."
      setWishlistError(message)
      return { success: false, message }
    }
  }, [])

  const removeFromWishlist = useCallback(async (productId) => {
    try {
      const response = await api.delete(`/wishlist/products/${productId}`)
      setWishlistItems(normalizeWishlist(response.data?.products))
      setWishlistError("")
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Unable to update wishlist."
      setWishlistError(message)
      return { success: false, message }
    }
  }, [])

  const toggleWishlist = useCallback(async (product) => {
    const productId = product?.id || product?._id
    return isInWishlist(productId)
      ? removeFromWishlist(productId)
      : addToWishlist(product)
  }, [addToWishlist, isInWishlist, removeFromWishlist])

  const clearWishlist = useCallback(async () => {
    try {
      await api.delete("/wishlist")
      setWishlistItems([])
      setWishlistError("")
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Unable to clear wishlist."
      setWishlistError(message)
      return { success: false, message }
    }
  }, [])

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        wishlistError,
        loadWishlist,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}


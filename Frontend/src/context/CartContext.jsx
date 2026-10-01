import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";
import { CartContext } from "./cartStore";

const LEGACY_CART_KEYS = [
  "namikol_cart",
];

const getLegacyCart = () => {
  for (const key of LEGACY_CART_KEYS) {
    try {
      const stored = localStorage.getItem(key);

      if (!stored) {
        continue;
      }

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.error(
        `Failed to read legacy cart from ${key}:`,
        error
      );
    }
  }

  return [];
};

const getProductId = (product) => {
  return (
    product?.productId ||
    product?.id ||
    product?._id ||
    ""
  );
};

const getCartId = (item) => {
  if (item?.cartId) {
    return String(item.cartId);
  }

  const productId = getProductId(item);

  return `${productId}-${item?.size || "default"}`;
};

const normalizeCartItem = (item) => {
  const productId = getProductId(item);

  return {
    cartId: getCartId(item),

    productId,

    id: productId,

    name: item?.name || "",

    category: item?.category || "",

    gender: item?.gender || "",

    image: item?.image || "",

    size:
      item?.size === undefined ||
      item?.size === null
        ? ""
        : String(item.size),

    price: Number(item?.price || 0),

    deliveryCharge: Number(item?.deliveryCharge || 0),

    quantity: Math.max(
      1,
      Number(item?.quantity || 1)
    ),
  };
};

function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const [isCartLoading, setIsCartLoading] =
    useState(true);

  const [cartError, setCartError] =
    useState("");

  /*
   * ========================================================
   * LOAD BACKEND CART
   * ========================================================
   */

  const loadCart = useCallback(async () => {
    const token = localStorage.getItem(
      "namikol-token"
    );

    if (!token) {
      setCartItems([]);
      setIsCartLoading(false);
      return;
    }

    try {
      setCartError("");
      setIsCartLoading(true);

      const response = await api.get("/cart");

      const serverItems =
        response.data?.cart?.items || [];

      const normalizedServerItems =
        serverItems.map(normalizeCartItem);

      /*
       * ------------------------------------------------------
       * OLD LOCAL CART MIGRATION
       * ------------------------------------------------------
       *
       * If MongoDB cart is empty and old local cart exists,
       * move the old cart to MongoDB once.
       */

      if (normalizedServerItems.length === 0) {
        const legacyItems = getLegacyCart();

        if (legacyItems.length > 0) {
          try {
            const syncResponse =
              await api.post("/cart/sync", {
                items: legacyItems,
              });

            const syncedItems =
              syncResponse.data?.cart?.items ||
              [];

            const normalizedSyncedItems =
              syncedItems.map(
                normalizeCartItem
              );

            setCartItems(
              normalizedSyncedItems
            );

            LEGACY_CART_KEYS.forEach(
              (key) =>
                localStorage.removeItem(key)
            );

            return;
          } catch (migrationError) {
            console.error(
              "Cart migration failed:",
              migrationError
            );

            /*
             * If migration fails, keep old local
             * cart visible rather than deleting it.
             */
            setCartItems(
              legacyItems.map(
                normalizeCartItem
              )
            );

            return;
          }
        }
      }

      setCartItems(
        normalizedServerItems
      );

      /*
       * Backend is now the source of truth.
       * Old local cart is no longer needed.
       */
      LEGACY_CART_KEYS.forEach(
        (key) =>
          localStorage.removeItem(key)
      );
    } catch (error) {
      console.error(
        "Load cart error:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        setCartItems([]);
        return;
      }

      setCartError(
        error.response?.data?.message ||
          "Unable to load your cart."
      );
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  /*
   * ========================================================
   * INITIAL LOAD
   * ========================================================
   */

  useEffect(() => {
    queueMicrotask(() => {
      void loadCart();
    });

    const handleAuthChange = () => loadCart();
    window.addEventListener("namikol-auth-changed", handleAuthChange);

    return () => {
      window.removeEventListener("namikol-auth-changed", handleAuthChange);
    };
  }, [loadCart]);

  /*
   * ========================================================
   * ADD TO CART
   * ========================================================
   */

  const addToCart = useCallback(
    async (
      product,
      size,
      quantity = 1
    ) => {
      const token = localStorage.getItem(
        "namikol-token"
      );

      if (!token) {
        throw new Error(
          "Please login before adding products to cart."
        );
      }

      const productId =
        getProductId(product);

      if (!productId) {
        throw new Error(
          "Product ID is missing."
        );
      }

      try {
        setCartError("");

        const response = await api.post(
          "/cart/items",
          {
            productId,
            size,
            quantity,
          }
        );

        const serverItems =
          response.data?.cart?.items ||
          [];

        setCartItems(
          serverItems.map(
            normalizeCartItem
          )
        );

        return {
          success: true,
          cart:
            response.data?.cart,
        };
      } catch (error) {
        console.error(
          "Add to cart error:",
          error
        );

        const message =
          error.response?.data?.message ||
          error.message ||
          "Unable to add product to cart.";

        setCartError(message);

        return {
          success: false,
          message,
        };
      }
    },
    []
  );

  /*
   * ========================================================
   * REMOVE SINGLE ITEM
   * ========================================================
   */

  const removeFromCart = useCallback(
    async (cartId) => {
      if (!cartId) {
        return {
          success: false,
          message: "Cart item ID is missing.",
        };
      }

      try {
        setCartError("");

        const response = await api.delete(
          `/cart/items/${encodeURIComponent(
            cartId
          )}`
        );

        const serverItems =
          response.data?.cart?.items ||
          [];

        setCartItems(
          serverItems.map(
            normalizeCartItem
          )
        );

        return {
          success: true,
        };
      } catch (error) {
        console.error(
          "Remove from cart error:",
          error
        );

        const message =
          error.response?.data?.message ||
          "Unable to remove product from cart.";

        setCartError(message);

        return {
          success: false,
          message,
        };
      }
    },
    []
  );

  /*
   * ========================================================
   * REMOVE PRODUCT BY PRODUCT ID + SIZE
   * ========================================================
   *
   * Used by ProductDetails.
   */

  const removeProductFromCart =
    useCallback(
      async (
        productId,
        size
      ) => {
        const matchingItem =
          cartItems.find(
            (item) =>
              String(
                item.productId ||
                  item.id ||
                  item._id
              ) === String(productId) &&
              String(
                item.size ?? ""
              ) ===
                String(size ?? "")
          );

        if (!matchingItem) {
          return {
            success: false,
            message:
              "Product is not in your cart.",
          };
        }

        return removeFromCart(
          matchingItem.cartId
        );
      },
      [
        cartItems,
        removeFromCart,
      ]
    );

  /*
   * ========================================================
   * UPDATE QUANTITY
   * ========================================================
   */

  const updateQuantity =
    useCallback(
      async (
        cartId,
        quantity
      ) => {
        try {
          setCartError("");

          const response =
            await api.patch(
              `/cart/items/${encodeURIComponent(
                cartId
              )}`,
              {
                quantity,
              }
            );

          const serverItems =
            response.data?.cart?.items ||
            [];

          setCartItems(
            serverItems.map(
              normalizeCartItem
            )
          );

          return {
            success: true,
          };
        } catch (error) {
          console.error(
            "Update cart quantity error:",
            error
          );

          const message =
            error.response?.data
              ?.message ||
            "Unable to update cart quantity.";

          setCartError(message);

          return {
            success: false,
            message,
          };
        }
      },
      []
    );

  const increaseQuantity = useCallback(
    async (cartId) => {
      const item = cartItems.find(
        (cartItem) => cartItem.cartId === cartId
      );

      if (!item) {
        return { success: false, message: "Cart item not found." };
      }

      return updateQuantity(cartId, Number(item.quantity) + 1);
    },
    [cartItems, updateQuantity]
  );

  const decreaseQuantity = useCallback(
    async (cartId) => {
      const item = cartItems.find(
        (cartItem) => cartItem.cartId === cartId
      );

      if (!item) {
        return { success: false, message: "Cart item not found." };
      }

      if (Number(item.quantity) <= 1) {
        return removeFromCart(cartId);
      }

      return updateQuantity(cartId, Number(item.quantity) - 1);
    },
    [cartItems, removeFromCart, updateQuantity]
  );

  /*
   * ========================================================
   * REMOVE PURCHASED ITEMS
   * ========================================================
   *
   * Used after successful Razorpay verification.
   */

  const removeItemsFromCart =
    useCallback(
      async (cartIds) => {
        if (
          !Array.isArray(cartIds) ||
          cartIds.length === 0
        ) {
          return {
            success: true,
          };
        }

        try {
          setCartError("");

          const response =
            await api.post(
              "/cart/items/remove",
              {
                cartIds,
              }
            );

          const serverItems =
            response.data?.cart?.items ||
            [];

          setCartItems(
            serverItems.map(
              normalizeCartItem
            )
          );

          return {
            success: true,
          };
        } catch (error) {
          console.error(
            "Remove purchased cart items error:",
            error
          );

          const message =
            error.response?.data
              ?.message ||
            "Unable to update cart.";

          setCartError(message);

          return {
            success: false,
            message,
          };
        }
      },
      []
    );

  /*
   * ========================================================
   * CLEAR CART
   * ========================================================
   */

  const clearCart = useCallback(
    async () => {
      try {
        setCartError("");

        await api.delete("/cart");

        setCartItems([]);

        LEGACY_CART_KEYS.forEach(
          (key) =>
            localStorage.removeItem(key)
        );

        return {
          success: true,
        };
      } catch (error) {
        console.error(
          "Clear cart error:",
          error
        );

        const message =
          error.response?.data?.message ||
          "Unable to clear cart.";

        setCartError(message);

        return {
          success: false,
          message,
        };
      }
    },
    []
  );

  /*
   * ========================================================
   * COUNTS
   * ========================================================
   */

  const uniqueSkuCount =
    cartItems.length;

  const totalItems = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  /*
   * ========================================================
   * CHECK IF PRODUCT + SIZE IS IN CART
   * ========================================================
   */

  const isInCart = useCallback(
    (
      productId,
      size
    ) => {
      return cartItems.some(
        (item) =>
          String(
            item.productId ||
              item.id ||
              item._id
          ) === String(productId) &&
          String(
            item.size ?? ""
          ) ===
            String(size ?? "")
      );
    },
    [cartItems]
  );

  /*
   * ========================================================
   * CONTEXT
   * ========================================================
   */

  const value = {
    cartItems,

    cart: cartItems,

    uniqueSkuCount,

    totalItems,

    totalPrice,

    isCartLoading,

    cartError,

    loadCart,

    addToCart,

    removeFromCart,

    removeProductFromCart,

    increaseQuantity,

    decreaseQuantity,

    updateQuantity,

    removeItemsFromCart,

    clearCart,

    isInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export { CartProvider };
export default CartProvider;
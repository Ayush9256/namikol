import { useEffect, useMemo, useState } from "react"

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom"

import {
  FiArrowLeft,
  FiCheck,
  FiMapPin,
  FiPlus,
  FiShoppingBag,
  FiTruck,
  FiUser,
} from "react-icons/fi"

import { useCart } from "../context/useCart"

import api from "../services/api"
import { loadRazorpayScript } from "../utils/loadRazorpay"

function Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    cartItems,
    removeItemsFromCart,
  } = useCart()

  const [customer, setCustomer] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] =
    useState("")
  const [showAddressForm, setShowAddressForm] =
    useState(false)
  const [isPlacingOrder, setIsPlacingOrder] =
    useState(false)
  const [isLoadingAddresses, setIsLoadingAddresses] =
    useState(true)

  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    isDefault: false,
  })

  const selectedProductId =
    searchParams.get("product")

  const checkoutItems = useMemo(() => {
    if (!selectedProductId) return cartItems

    return cartItems.filter((item) => {
      const productId =
        item.productId ||
        item.id ||
        item._id

      return (
        String(productId) === String(selectedProductId) ||
        String(item.cartId) === String(selectedProductId)
      )
    })
  }, [cartItems, selectedProductId])

  const checkoutSkuCount = checkoutItems.length

  const checkoutItemCount = useMemo(() => {
    return checkoutItems.reduce(
      (total, item) => total + item.quantity,
      0
    )
  }, [checkoutItems])

  const checkoutSubtotal = useMemo(() => {
    return checkoutItems.reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.quantity || 0),
      0
    )
  }, [checkoutItems])

  /*
   * This is only for displaying the checkout summary.
   * The final payable amount is calculated again by the backend.
   */
  const shipping = useMemo(
    () => checkoutItems.reduce(
      (total, item) =>
        total + Number(item.deliveryCharge || 0) * Number(item.quantity || 0),
      0
    ),
    [checkoutItems]
  )

  const total = checkoutSubtotal + shipping

  // Load logged-in customer + MongoDB addresses
  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        const session = localStorage.getItem(
          "namikol_customer_session"
        )

        const token = localStorage.getItem(
          "namikol-token"
        )

        if (!session || !token) {
          navigate("/login")
          return
        }

        const parsedSession = JSON.parse(session)

        setCustomer(parsedSession)

        const response = await api.get(
          "/customer/addresses"
        )

        const serverAddresses =
          response.data?.addresses || []

        const normalizedAddresses =
          serverAddresses.map((address) => ({
            ...address,
            id: address._id,
            isDefault: Boolean(
              address.isDefault
            ),
          }))

        setAddresses(normalizedAddresses)

        const defaultAddress =
          normalizedAddresses.find(
            (address) => address.isDefault
          )

        if (defaultAddress) {
          setSelectedAddressId(
            defaultAddress.id
          )
        } else if (
          normalizedAddresses.length > 0
        ) {
          setSelectedAddressId(
            normalizedAddresses[0].id
          )
        }
      } catch (error) {
        console.error(
          "Failed to load checkout:",
          error
        )

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          localStorage.removeItem(
            "namikol-token"
          )

          localStorage.removeItem(
            "namikol_customer_session"
          )

          navigate("/login")
          return
        }

        alert(
          error.response?.data?.message ||
            "Unable to load saved addresses."
        )
      } finally {
        setIsLoadingAddresses(false)
      }
    }

    loadCheckoutData()
  }, [navigate])

  const handleAddressChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setAddressForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }))
  }

  const handleAddAddress = async (event) => {
    event.preventDefault()

    if (
      !addressForm.fullName.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.addressLine.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.pincode.trim()
    ) {
      alert("Please fill all address fields.")
      return
    }

    if (
      !/^\d{10}$/.test(
        addressForm.phone.trim()
      )
    ) {
      alert(
        "Please enter a valid 10-digit phone number."
      )
      return
    }

    if (
      !/^\d{6}$/.test(
        addressForm.pincode.trim()
      )
    ) {
      alert(
        "Please enter a valid 6-digit PIN code."
      )
      return
    }

    try {
      const response = await api.post(
        "/customer/addresses",
        {
          fullName:
            addressForm.fullName.trim(),

          phone:
            addressForm.phone.trim(),

          addressLine:
            addressForm.addressLine.trim(),

          city:
            addressForm.city.trim(),

          state:
            addressForm.state.trim(),

          pincode:
            addressForm.pincode.trim(),

          landmark:
            addressForm.landmark.trim(),

          isDefault:
            addressForm.isDefault,
        }
      )

      const newAddress =
        response.data?.address

      if (!newAddress) {
        alert(
          "Address was not returned by the server."
        )
        return
      }

      const normalizedAddress = {
        ...newAddress,
        id: newAddress._id,
        isDefault: Boolean(
          newAddress.isDefault
        ),
      }

      let updatedAddresses = [
        ...addresses,
      ]

      if (normalizedAddress.isDefault) {
        updatedAddresses =
          updatedAddresses.map(
            (address) => ({
              ...address,
              isDefault: false,
            })
          )
      }

      updatedAddresses.push(
        normalizedAddress
      )

      setAddresses(updatedAddresses)

      setSelectedAddressId(
        normalizedAddress.id
      )

      setAddressForm({
        fullName: "",
        phone: "",
        addressLine: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        isDefault: false,
      })

      setShowAddressForm(false)

      alert("Address added successfully.")
    } catch (error) {
      console.error(
        "Add checkout address error:",
        error
      )

      alert(
        error.response?.data?.message ||
          "Unable to add address."
      )
    }
  }

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return

    if (!customer) {
      alert(
        "Please login before placing an order."
      )

      navigate("/login")
      return
    }

    if (checkoutItems.length === 0) {
      alert(
        "There are no products to order."
      )

      navigate("/cart")
      return
    }

    if (!selectedAddressId) {
      alert(
        "Please select a delivery address."
      )

      return
    }

    const selectedAddress = addresses.find(
      (address) =>
        address.id === selectedAddressId
    )

    if (!selectedAddress) {
      alert(
        "Selected delivery address could not be found."
      )

      return
    }

    setIsPlacingOrder(true)

    try {
      /*
       * Load Razorpay checkout script first.
       */
      const razorpayLoaded =
        await loadRazorpayScript()

      if (!razorpayLoaded) {
        throw new Error(
          "Unable to load Razorpay checkout. Please check your internet connection and try again."
        )
      }

      /*
       * IMPORTANT:
       * Only send product identifiers, quantity,
       * size and shipping address.
       *
       * Price, subtotal, shipping and total are NOT
       * trusted from the frontend anymore.
       *
       * Backend calculates the complete amount
       * directly from MongoDB.
       */
      const createOrderResponse =
        await api.post(
          "/payment/create-order",
          {
            items: checkoutItems.map(
              (item) => ({
                productId:
                  item.productId ||
                  item.id ||
                  item._id,

                cartId:
                  item.cartId || "",

                quantity:
                  Number(item.quantity),

                size:
                  item.size || "",
              })
            ),

            shippingAddress: {
              id:
                selectedAddress.id || "",

              fullName:
                selectedAddress.fullName,

              phone:
                selectedAddress.phone,

              addressLine:
                selectedAddress.addressLine,

              city:
                selectedAddress.city,

              state:
                selectedAddress.state,

              pincode:
                selectedAddress.pincode,

              landmark:
                selectedAddress.landmark || "",
            },

            source: selectedProductId
              ? "buy_now"
              : "cart",
          }
        )

      if (
        !createOrderResponse.data?.success ||
        !createOrderResponse.data?.order
      ) {
        throw new Error(
          createOrderResponse.data?.message ||
            "Unable to start payment."
        )
      }

      const razorpayOrder =
        createOrderResponse.data.order

      const razorpayKeyId =
        createOrderResponse.data.keyId

      const paymentIntentId =
        createOrderResponse.data.paymentIntentId

      const serverCheckout =
        createOrderResponse.data.checkout

      if (!razorpayKeyId) {
        throw new Error(
          "Razorpay key is missing from the server response."
        )
      }

      if (!paymentIntentId) {
        throw new Error(
          "Payment session could not be created."
        )
      }

      if (!serverCheckout) {
        throw new Error(
          "Server checkout details are missing."
        )
      }

      /*
       * Backend is the source of truth for these values.
       * We use them only for displaying/debugging,
       * never for final order creation.
       */
      const serverTotal = Number(
        serverCheckout.total || 0
      )

      if (serverTotal <= 0) {
        throw new Error(
          "Invalid payment amount received from server."
        )
      }

      /*
       * Razorpay Checkout
       */
      const options = {
        key: razorpayKeyId,

        amount:
          razorpayOrder.amount,

        currency:
          razorpayOrder.currency || "INR",

        name: "NAMIKOL",

        description:
          selectedProductId
            ? "NAMIKOL Buy Now Payment"
            : "NAMIKOL Cart Payment",

        order_id:
          razorpayOrder.id,

        prefill: {
          name:
            `${customer.firstName || ""} ${
              customer.lastName || ""
            }`.trim(),

          email:
            customer.email || "",

          contact:
            selectedAddress.phone || "",
        },

        notes: {
          source:
            selectedProductId
              ? "buy_now"
              : "cart",

          paymentIntentId,
        },

        theme: {
          color: "#000000",
        },

        /*
         * Razorpay payment succeeded.
         *
         * Only now do we ask backend to verify
         * the signature and create the final Order.
         */
        handler: async (
          paymentResponse
        ) => {
          try {
            const verifyResponse =
              await api.post(
                "/payment/verify",
                {
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,

                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,

                  razorpay_signature:
                    paymentResponse.razorpay_signature,

                  paymentIntentId,
                }
              )

            if (
              !verifyResponse.data?.success ||
              !verifyResponse.data?.order
            ) {
              throw new Error(
                verifyResponse.data?.message ||
                  "Payment verification failed."
              )
            }

            const verifiedOrder =
              verifyResponse.data.order

            /*
             * Cart is modified ONLY after successful
             * backend payment verification.
             */
            if (!selectedProductId) {
              const purchasedCartIds =
                checkoutItems
                  .map(
                    (item) =>
                      item.cartId
                  )
                  .filter(Boolean)

              if (
                purchasedCartIds.length > 0
              ) {
                await removeItemsFromCart(
                  purchasedCartIds
                )
              }
            }

            navigate(
              `/order-success/${
                verifiedOrder._id ||
                verifiedOrder.id
              }`
            )
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            )

            if (
              error.response?.status === 401 ||
              error.response?.status === 403
            ) {
              localStorage.removeItem(
                "namikol-token"
              )

              localStorage.removeItem(
                "namikol_customer_session"
              )

              alert(
                "Your session has expired. Please login again."
              )

              navigate("/login")
              return
            }

            alert(
              error.response?.data?.message ||
                error.message ||
                "Payment verification failed. Please contact NAMIKOL support if money was deducted."
            )
          } finally {
            setIsPlacingOrder(false)
          }
        },

        /*
         * User closed Razorpay without completing
         * the payment.
         *
         * No final Order is created.
         */
        modal: {
          ondismiss: () => {
            setIsPlacingOrder(false)

            alert(
              "Payment was cancelled. Your order has not been placed."
            )
          },
        },
      }

      const razorpay =
        new window.Razorpay(options)

      /*
       * Razorpay payment failure.
       *
       * No final Order is created.
       */
      razorpay.on(
        "payment.failed",
        (response) => {
          console.error(
            "Razorpay payment failed:",
            response
          )

          setIsPlacingOrder(false)

          alert(
            response.error?.description ||
              "Payment failed. Your order has not been placed."
          )
        }
      )

      razorpay.open()
    } catch (error) {
      console.error(
        "Start payment error:",
        error
      )

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem(
          "namikol-token"
        )

        localStorage.removeItem(
          "namikol_customer_session"
        )

        alert(
          "Your session has expired. Please login again."
        )

        navigate("/login")
        return
      }

      alert(
        error.response?.data?.message ||
          error.message ||
          "Unable to start payment."
      )

      setIsPlacingOrder(false)
    }
  }

  if (!customer) {
    return null
  }

  if (
    selectedProductId &&
    checkoutItems.length === 0
  ) {
    return (
      <section className="min-h-[70vh] bg-black px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <FiShoppingBag size={30} />
          </div>

          <h1 className="mt-8 text-4xl font-bold uppercase tracking-[0.12em]">
            Product Not Found
          </h1>

          <p className="mt-4 text-neutral-400">
            This product is no longer available
            in your cart.
          </p>

          <Link
            to="/cart"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:bg-neutral-200"
          >
            Back To Cart
            <FiArrowLeft size={17} />
          </Link>
        </div>
      </section>
    )
  }

  if (checkoutItems.length === 0) {
    return (
      <section className="min-h-[70vh] bg-black px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <FiShoppingBag size={30} />
          </div>

          <h1 className="mt-8 text-4xl font-bold uppercase tracking-[0.12em]">
            Your Cart Is Empty
          </h1>

          <p className="mt-4 text-neutral-400">
            Add a product before proceeding to
            checkout.
          </p>

          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:bg-neutral-200"
          >
            Continue Shopping
            <FiArrowLeft size={17} />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-black px-4 py-12 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400 transition hover:text-white"
          >
            <FiArrowLeft size={15} />
            Back To Cart
          </Link>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
            NAMIKOL / Checkout
          </p>

          <h1 className="mt-3 text-4xl font-bold uppercase tracking-[0.08em] sm:text-5xl">
            Checkout
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-neutral-400">
            {selectedProductId
              ? "You are checking out the selected product."
              : "You are checking out all products in your cart."}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Customer Details */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                  <FiUser size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                    Customer Details
                  </h2>

                  <p className="mt-1 text-xs text-neutral-500">
                    Logged in customer
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Name
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {customer.firstName}{" "}
                    {customer.lastName}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Email
                  </p>

                  <p className="mt-2 break-all text-sm font-semibold">
                    {customer.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                    <FiMapPin size={18} />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                      Delivery Address
                    </h2>

                    <p className="mt-1 text-xs text-neutral-500">
                      Select where your order should arrive
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowAddressForm(
                      (current) => !current
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-white hover:text-black"
                >
                  <FiPlus size={15} />
                  Add Address
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="mt-6 rounded-2xl border border-white/10 p-8 text-center">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                    Loading saved addresses...
                  </p>
                </div>
              ) : (
                <>
                  {addresses.length === 0 &&
                    !showAddressForm && (
                      <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center">
                        <FiMapPin
                          size={25}
                          className="mx-auto text-neutral-500"
                        />

                        <p className="mt-4 text-sm font-semibold">
                          No saved address
                        </p>

                        <p className="mt-2 text-xs text-neutral-500">
                          Add a delivery address to
                          continue.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setShowAddressForm(
                              true
                            )
                          }
                          className="mt-5 rounded-full bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-black"
                        >
                          Add Delivery Address
                        </button>
                      </div>
                    )}

                  {addresses.length > 0 && (
                    <div className="mt-6 space-y-3">
                      {addresses.map(
                        (address, index) => (
                          <label
                            key={
                              address.id ||
                              address._id ||
                              `address-${index}`
                            }
                            className={`block cursor-pointer rounded-2xl border p-4 transition ${
                              selectedAddressId ===
                              address.id
                                ? "border-white bg-white/10"
                                : "border-white/10 bg-black/30 hover:border-white/25"
                            }`}
                          >
                            <div className="flex gap-4">
                              <input
                                type="radio"
                                name="checkoutAddress"
                                value={
                                  address.id
                                }
                                checked={
                                  selectedAddressId ===
                                  address.id
                                }
                                onChange={(
                                  event
                                ) =>
                                  setSelectedAddressId(
                                    event.target
                                      .value
                                  )
                                }
                                className="mt-1 accent-white"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-bold">
                                    {
                                      address.fullName
                                    }
                                  </p>

                                  {address.isDefault && (
                                    <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-black">
                                      Default
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 text-xs leading-5 text-neutral-400">
                                  {
                                    address.addressLine
                                  }
                                  ,{" "}
                                  {
                                    address.city
                                  }
                                  ,{" "}
                                  {
                                    address.state
                                  }{" "}
                                  -{" "}
                                  {
                                    address.pincode
                                  }
                                </p>

                                {address.landmark && (
                                  <p className="mt-1 text-xs text-neutral-500">
                                    Landmark:{" "}
                                    {
                                      address.landmark
                                    }
                                  </p>
                                )}

                                <p className="mt-1 text-xs text-neutral-500">
                                  +91{" "}
                                  {
                                    address.phone
                                  }
                                </p>
                              </div>
                            </div>
                          </label>
                        )
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Add Address Form */}
              {showAddressForm && (
                <form
                  onSubmit={
                    handleAddAddress
                  }
                  className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5"
                >
                  <div className="mb-5">
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em]">
                      New Address
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      name="fullName"
                      value={
                        addressForm.fullName
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Full Name"
                      className="checkout-input"
                    />

                    <input
                      name="phone"
                      value={
                        addressForm.phone
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Phone Number"
                      inputMode="numeric"
                      maxLength={10}
                      className="checkout-input"
                    />

                    <input
                      name="addressLine"
                      value={
                        addressForm.addressLine
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Full Address"
                      className="checkout-input sm:col-span-2"
                    />

                    <input
                      name="city"
                      value={
                        addressForm.city
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="City"
                      className="checkout-input"
                    />

                    <input
                      name="state"
                      value={
                        addressForm.state
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="State"
                      className="checkout-input"
                    />

                    <input
                      name="pincode"
                      value={
                        addressForm.pincode
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="PIN Code"
                      inputMode="numeric"
                      maxLength={6}
                      className="checkout-input"
                    />

                    <input
                      name="landmark"
                      value={
                        addressForm.landmark
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Landmark (Optional)"
                      className="checkout-input"
                    />
                  </div>

                  <label className="mt-5 flex cursor-pointer items-center gap-3 text-xs text-neutral-400">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={
                        addressForm.isDefault
                      }
                      onChange={
                        handleAddressChange
                      }
                      className="accent-white"
                    />

                    Make this my default address
                  </label>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-black transition hover:bg-neutral-200"
                    >
                      Save Address
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(
                          false
                        )

                        setAddressForm({
                          fullName: "",
                          phone: "",
                          addressLine: "",
                          city: "",
                          state: "",
                          pincode: "",
                          landmark: "",
                          isDefault: false,
                        })
                      }}
                      className="rounded-full border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:border-white hover:bg-white hover:text-black"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                  <FiShoppingBag size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
                    Order Summary
                  </h2>

                  <p className="mt-1 text-xs text-neutral-500">
                    {selectedProductId
                      ? "1 Product"
                      : `${checkoutSkuCount} ${
                          checkoutSkuCount === 1
                            ? "Product"
                            : "Products"
                        }`}{" "}
                    •{" "}
                    {checkoutItemCount}{" "}
                    {checkoutItemCount === 1
                      ? "Item"
                      : "Items"}
                  </p>
                </div>
              </div>

              {/* Products */}
              <div className="mt-6 space-y-4">
                {checkoutItems.map(
                  (item, index) => {
                    const itemKey =
                      item.cartId ||
                      `${
                        item.productId ||
                        item.id ||
                        item._id ||
                        "product"
                      }-${
                        item.size ||
                        "default"
                      }-${index}`

                    return (
                      <div
                        key={itemKey}
                        className="flex gap-4 border-b border-white/10 pb-4"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-900">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={
                                item.name ||
                                "Product"
                              }
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-[0.12em] text-neutral-600">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-sm font-semibold">
                            {item.name}
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <span>
                              Size {item.size}
                            </span>

                            <span className="text-neutral-700">
                              •
                            </span>

                            <span>
                              Qty ×{" "}
                              {item.quantity}
                            </span>
                          </div>

                          <p className="mt-2 text-sm font-bold">
                            ₹
                            {(
                              Number(
                                item.price ||
                                  0
                              ) *
                              Number(
                                item.quantity ||
                                  0
                              )
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          {item.quantity >
                            1 && (
                            <p className="mt-1 text-[10px] text-neutral-600">
                              ₹
                              {Number(
                                item.price ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}{" "}
                              ×{" "}
                              {
                                item.quantity
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  }
                )}
              </div>

              {/* Price Breakdown */}
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Products</span>

                  <span>
                    {checkoutSkuCount}{" "}
                    {checkoutSkuCount ===
                    1
                      ? "SKU"
                      : "SKUs"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-400">
                  <span>Total Items</span>

                  <span>
                    {checkoutItemCount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-400">
                  <span>Subtotal</span>

                  <span>
                    ₹
                    {checkoutSubtotal.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-400">
                  <span className="flex items-center gap-2">
                    <FiTruck size={15} />
                    Shipping
                  </span>

                  <span>
                    {shipping === 0
                      ? "FREE"
                      : `₹${shipping}`}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-[0.1em]">
                      Total
                    </span>

                    <span className="text-2xl font-bold">
                      ₹
                      {total.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Place Order */}
              <button
                type="button"
                disabled={
                  !selectedAddressId ||
                  isPlacingOrder
                }
                onClick={
                  handlePlaceOrder
                }
                className={`mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-full text-sm font-bold uppercase tracking-[0.12em] transition ${
                  selectedAddressId &&
                  !isPlacingOrder
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "cursor-not-allowed bg-white/10 text-neutral-500"
                }`}
              >
                <FiCheck size={18} />

                {isPlacingOrder
                  ? "Opening Payment..."
                  : "Place Order"}
              </button>

              <p className="mt-4 text-center text-[10px] uppercase tracking-[0.12em] text-neutral-600">
                Secure checkout • NAMIKOL
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Checkout
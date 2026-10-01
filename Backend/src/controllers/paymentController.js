const crypto = require("crypto")
const mongoose = require("mongoose")

const razorpay = require("../config/razorpay")
const Order = require("../models/Order")
const Customer = require("../models/Customer")
const Product = require("../models/Product")
const PaymentIntent = require("../models/PaymentIntent")

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(1000 + Math.random() * 9000)

  return `NMK-${timestamp}-${random}`
}

const saveVerifiedOrder = async ({
  customer,
  paymentIntent,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  orderItems,
}) => {
  const session = await mongoose.startSession()
  let savedOrder

  try {
    await session.withTransaction(async () => {
      const existingOrder = await Order.findOne({
        $or: [
          { razorpayOrderId },
          { razorpayPaymentId },
        ],
      }).session(session)

      if (existingOrder) {
        savedOrder = existingOrder
        return
      }

      const currentIntent = await PaymentIntent.findById(
        paymentIntent._id
      ).session(session)

      if (!currentIntent || currentIntent.status !== "Created") {
        throw new Error("PAYMENT_INTENT_UNAVAILABLE")
      }

      for (const item of currentIntent.items) {
        const update = await Product.updateOne(
          {
            _id: item.productId,
            sizes: {
              $elemMatch: {
                size: Number(item.size),
                stock: { $gte: Number(item.quantity) },
              },
            },
          },
          {
            $inc: {
              "sizes.$.stock": -Number(item.quantity),
            },
          },
          { session }
        )

        if (update.modifiedCount !== 1) {
          throw new Error("INSUFFICIENT_INVENTORY")
        }
      }

      const [createdOrder] = await Order.create(
        [
          {
            customerId: customer._id,
            customer: {
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
            },
            orderNumber: generateOrderNumber(),
            items: orderItems,
            itemCount: currentIntent.itemCount,
            skuCount: currentIntent.skuCount,
            subtotal: currentIntent.subtotal,
            shipping: currentIntent.shipping,
            total: currentIntent.total,
            shippingAddress: currentIntent.shippingAddress,
            paymentMethod: "Razorpay",
            source: currentIntent.source,
            orderStatus: "Placed",
            deliveredAt: null,
            paymentStatus: "Paid",
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            returnStatus: "Not Requested",
          },
        ],
        { session }
      )

      currentIntent.status = "Paid"
      currentIntent.razorpayPaymentId = razorpayPaymentId
      currentIntent.razorpaySignature = razorpaySignature
      await currentIntent.save({ session })
      savedOrder = createdOrder
    })

    return savedOrder
  } finally {
    await session.endSession()
  }
}

/*
|--------------------------------------------------------------------------
| VALIDATE SHIPPING ADDRESS
|--------------------------------------------------------------------------
*/

const validateShippingAddress = (shippingAddress) => {
  if (!shippingAddress) {
    return false
  }

  return Boolean(
    shippingAddress.fullName?.trim() &&
      shippingAddress.phone?.trim() &&
      shippingAddress.addressLine?.trim() &&
      shippingAddress.city?.trim() &&
      shippingAddress.state?.trim() &&
      shippingAddress.pincode?.trim()
  )
}

/*
|--------------------------------------------------------------------------
| CREATE RAZORPAY ORDER + PAYMENT INTENT
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This endpoint NEVER creates the final MongoDB business Order.
|
| It:
|
| 1. Receives product IDs + quantities from frontend
| 2. Validates product IDs
| 3. Validates quantities
| 4. Validates shoe sizes
| 5. Fetches products from MongoDB
| 6. Gets prices from MongoDB
| 7. Validates stock
| 8. Calculates subtotal on server
| 9. Calculates shipping on server
| 10. Calculates total on server
| 11. Creates Razorpay Order
| 12. Creates PaymentIntent snapshot
|
| Final MongoDB Order is created ONLY after successful
| Razorpay payment verification.
|--------------------------------------------------------------------------
*/

const createRazorpayOrder = async (req, res) => {
  try {
    const {
      items,
      currency = "INR",
      receipt,
      shippingAddress,
      source = "cart",
    } = req.body

    /*
    |--------------------------------------------------------------------------
    | BASIC VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one checkout item is required.",
      })
    }

    if (!validateShippingAddress(shippingAddress)) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required.",
      })
    }

    const normalizedSource =
      source === "buy_now"
        ? "buy_now"
        : "cart"

    const normalizedItems = []
    const requestedSkus = new Set()

    let subtotal = 0
    let shipping = 0
    let itemCount = 0

    /*
    |--------------------------------------------------------------------------
    | VALIDATE + NORMALIZE ITEMS
    |--------------------------------------------------------------------------
    */

    for (const item of items) {
      const productId =
        item.productId ||
        item.id ||
        item._id

      const quantity = Number(item.quantity)

      /*
      |--------------------------------------------------------------------------
      | PRODUCT ID
      |--------------------------------------------------------------------------
      */

      if (
        !productId ||
        !mongoose.Types.ObjectId.isValid(productId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | QUANTITY
      |--------------------------------------------------------------------------
      */

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > 20
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity. Maximum quantity is 20.",
        })
      }

      /*
      |--------------------------------------------------------------------------
      | SIZE
      |--------------------------------------------------------------------------
      */

      const size = String(item.size || "").trim()

      const allowedSizes = [
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
      ]

      if (!allowedSizes.includes(size)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shoe size. Allowed sizes are 6 to 11.",
        })
      }

      const skuKey = `${productId}:${size}`
      if (requestedSkus.has(skuKey)) {
        return res.status(400).json({
          success: false,
          message: "Checkout contains a duplicate product size.",
        })
      }
      requestedSkus.add(skuKey)

      /*
      |--------------------------------------------------------------------------
      | FETCH PRODUCT
      |--------------------------------------------------------------------------
      */

      const product = await Product.findById(productId)

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "One of the selected products was not found.",
        })
      }

      const sizeInventory = Array.isArray(product.sizes)
        ? product.sizes.find(
            (productSize) =>
              Number(productSize.size) === Number(size)
          )
        : null

      if (!sizeInventory) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name} is not available in size ${size}.`,
        })
      }

      const availableStock = Number(sizeInventory.stock || 0)

      if (availableStock < quantity) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name} does not have enough stock.`,
        })
      }

      /*
      |--------------------------------------------------------------------------
      | PRICE ALWAYS COMES FROM DATABASE
      |--------------------------------------------------------------------------
      */

      const price = Number(product.price || 0)

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid price for product: ${product.name}`,
        })
      }

      /*
      |--------------------------------------------------------------------------
      | ITEM TOTAL
      |--------------------------------------------------------------------------
      */

      const itemTotal = price * quantity
      const deliveryCharge = Number(product.deliveryCharge || 0)

      subtotal += itemTotal
      shipping += deliveryCharge * quantity
      itemCount += quantity

      /*
      |--------------------------------------------------------------------------
      | SERVER SNAPSHOT
      |--------------------------------------------------------------------------
      */

      normalizedItems.push({
        cartId: String(item.cartId || ""),

        productId: product._id,

        name: product.name,

        category:
          product.category || "",

        gender:
          product.gender || "",

        image:
          product.image || "",

        size,

        quantity,

        price,

        itemTotal,
        deliveryCharge,
      })
    }

    /*
    |--------------------------------------------------------------------------
    | SKU COUNT
    |--------------------------------------------------------------------------
    */

    const skuCount =
      normalizedItems.length

    /*
    |--------------------------------------------------------------------------
    | SHIPPING
    |--------------------------------------------------------------------------
    */

const total = subtotal + shipping;

    const amountInPaise =
      Math.round(total * 100)

    if (
      !Number.isInteger(amountInPaise) ||
      amountInPaise < 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount must be at least ₹1.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | RAZORPAY ORDER
    |--------------------------------------------------------------------------
    */

    const options = {
      amount: amountInPaise,

      currency: "INR",

      receipt:
        receipt ||
        `nmk_${Date.now()}`,
    }

    const razorpayOrder =
      await razorpay.orders.create(
        options
      )

    /*
    |--------------------------------------------------------------------------
    | PAYMENT INTENT
    |--------------------------------------------------------------------------
    |
    | This is NOT the final business Order.
    |
    | It stores the server-calculated snapshot that was actually
    | used to create the Razorpay payment.
    |--------------------------------------------------------------------------
    */

    const paymentIntent =
      await PaymentIntent.create({
        customerId:
          req.customer.id,

        razorpayOrderId:
          razorpayOrder.id,

        items:
          normalizedItems,

        itemCount,

        skuCount,

        subtotal,

        shipping,

        total,

        shippingAddress: {
          id:
            String(
              shippingAddress.id || ""
            ),

          fullName:
            shippingAddress.fullName.trim(),

          phone:
            shippingAddress.phone.trim(),

          addressLine:
            shippingAddress.addressLine.trim(),

          city:
            shippingAddress.city.trim(),

          state:
            shippingAddress.state.trim(),

          pincode:
            shippingAddress.pincode.trim(),

          landmark:
            shippingAddress.landmark?.trim() ||
            "",
        },

        source:
          normalizedSource,

        status:
          "Created",

        expiresAt:
          new Date(
            Date.now() +
              15 * 60 * 1000
          ),
      })

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message:
        "Razorpay order created successfully.",

      order: razorpayOrder,

      keyId:
        process.env.RAZORPAY_KEY_ID,

      paymentIntentId:
        paymentIntent._id,

      checkout: {
        items:
          normalizedItems,

        itemCount,

        skuCount,

        subtotal,

        shipping,

        total,
      },
    })
  } catch (error) {
    console.error(
      "Razorpay order creation failed:",
      error
    )

    return res.status(500).json({
      success: false,
      message:
        "Unable to create Razorpay order.",
    })
  }
}

/*
|--------------------------------------------------------------------------
| VERIFY RAZORPAY PAYMENT
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The frontend is NOT trusted for:
|
| - product price
| - item total
| - subtotal
| - shipping
| - total
| - final order items
|
| These values come from PaymentIntent.
|--------------------------------------------------------------------------
*/

const verifyRazorpayPayment = async (
  req,
  res
) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentIntentId,
    } = req.body

    /*
    |--------------------------------------------------------------------------
    | BASIC VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Incomplete Razorpay payment details.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY RAZORPAY SIGNATURE
    |--------------------------------------------------------------------------
    */

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex")

    const generatedBuffer =
      Buffer.from(
        generatedSignature
      )

    const receivedBuffer =
      Buffer.from(
        String(
          razorpay_signature
        )
      )

    if (
      generatedBuffer.length !==
      receivedBuffer.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Razorpay payment signature.",
      })
    }

    const signatureIsValid =
      crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      )

    if (!signatureIsValid) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Razorpay payment signature.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | FETCH RAZORPAY ORDER
    |--------------------------------------------------------------------------
    */

    const razorpayOrder =
      await razorpay.orders.fetch(
        razorpay_order_id
      )

    if (!razorpayOrder) {
      return res.status(404).json({
        success: false,
        message:
          "Razorpay order not found.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | FIND PAYMENT INTENT
    |--------------------------------------------------------------------------
    */

    let paymentIntent = null

    if (
      paymentIntentId &&
      mongoose.Types.ObjectId.isValid(
        paymentIntentId
      )
    ) {
      paymentIntent =
        await PaymentIntent.findOne({
          _id:
            paymentIntentId,

          customerId:
            req.customer.id,

          razorpayOrderId:
            razorpay_order_id,
        })
    }

    /*
    |--------------------------------------------------------------------------
    | FALLBACK BY RAZORPAY ORDER ID
    |--------------------------------------------------------------------------
    */

    if (!paymentIntent) {
      paymentIntent =
        await PaymentIntent.findOne({
          customerId:
            req.customer.id,

          razorpayOrderId:
            razorpay_order_id,
        })
    }

    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message:
          "Payment intent not found.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY PAYMENT INTENT OWNERSHIP
    |--------------------------------------------------------------------------
    */

    if (
      String(
        paymentIntent.customerId
      ) !==
      String(
        req.customer.id
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Payment intent does not belong to this customer.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY PAYMENT INTENT STATUS
    |--------------------------------------------------------------------------
    */

    if (
      paymentIntent.status ===
      "Paid"
    ) {
      const existingOrder =
        await Order.findOne({
          razorpayOrderId:
            razorpay_order_id,
        })

      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message:
            "Payment already verified.",
          order:
            existingOrder,
        })
      }
    }

    if (
      paymentIntent.status !==
      "Created"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This payment intent is no longer available.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY RAZORPAY ORDER ID
    |--------------------------------------------------------------------------
    */

    if (
      paymentIntent.razorpayOrderId !==
      razorpayOrder.id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay order does not match the payment intent.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY AMOUNT AGAINST SERVER SNAPSHOT
    |--------------------------------------------------------------------------
    */

    const razorpayAmount =
      Number(
        razorpayOrder.amount || 0
      )

    const expectedAmount =
      Math.round(
        Number(
          paymentIntent.total
        ) * 100
      )

    if (
      razorpayAmount !==
      expectedAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount does not match the server order.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER
    |--------------------------------------------------------------------------
    */

    const customerRecord =
      await Customer.findById(
        req.customer.id
      ).select(
        "firstName lastName email"
      )

    if (!customerRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Customer account not found.",
      })
    }

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE PAYMENT CHECK
    |--------------------------------------------------------------------------
    */

    const existingPayment =
      await Order.findOne({
        $or: [
          {
            razorpayOrderId:
              razorpay_order_id,
          },
          {
            razorpayPaymentId:
              razorpay_payment_id,
          },
        ],
      })

    if (existingPayment) {
      /*
      |----------------------------------------------------------------------
      | Keep PaymentIntent in sync
      |----------------------------------------------------------------------
      */

      paymentIntent.status =
        "Paid"

      paymentIntent.razorpayPaymentId =
        razorpay_payment_id

      paymentIntent.razorpaySignature =
        razorpay_signature

      await paymentIntent.save()

      return res.status(200).json({
        success: true,
        message:
          "Payment already verified.",
        order:
          existingPayment,
      })
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE FINAL BUSINESS ORDER
    |--------------------------------------------------------------------------
    |
    | Everything below comes from PaymentIntent.
    | No frontend price/total/items are trusted.
    |--------------------------------------------------------------------------
    */

    const orderItems =
      paymentIntent.items.map(
        (item) => ({
          cartId:
            item.cartId || "",

          productId:
            item.productId
              ? item.productId.toString()
              : "",

          name:
            item.name,

          category:
            item.category || "",

          gender:
            item.gender || "",

          image:
            item.image || "",

          size:
            item.size || "",

          quantity:
            Number(
              item.quantity
            ),

          price:
            Number(
              item.price
            ),

          itemTotal:
            Number(
              item.itemTotal
            ),

          deliveryCharge:
            Number(item.deliveryCharge || 0),
        })
      )

    /*
    |--------------------------------------------------------------------------
    | CREATE ORDER
    |--------------------------------------------------------------------------
    */

    let order

    try {
      order = await saveVerifiedOrder({
        customer: customerRecord,
        paymentIntent,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        orderItems,
      })
    } catch (error) {
      if (error.message !== "INSUFFICIENT_INVENTORY") {
        throw error
      }

      try {
        await razorpay.payments.refund(razorpay_payment_id)
        await PaymentIntent.updateOne(
          {
            _id: paymentIntent._id,
            customerId: req.customer.id,
            status: "Created",
          },
          { $set: { status: "Failed" } }
        )

        return res.status(409).json({
          success: false,
          message:
            "The selected size sold out during payment. A refund has been initiated.",
        })
      } catch (refundError) {
        console.error("Automatic refund failed:", refundError)
        return res.status(502).json({
          success: false,
          message:
            "Payment succeeded but inventory could not be reserved. Contact support with your payment ID.",
        })
      }
    }

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message:
        "Payment verified and order created successfully.",

      order,
    })
} catch (error) {
  console.error(
    "Razorpay payment verification failed:",
    error
  )

  console.error(
    "Error name:",
    error?.name
  )

  console.error(
    "Error message:",
    error?.message
  )

  console.error(
    "Error stack:",
    error?.stack
  )

  return res.status(500).json({
    success: false,
    message:
      error?.message ||
      "Unable to verify Razorpay payment.",
  })
}
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
}
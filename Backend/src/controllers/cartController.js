const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Product = require("../models/Product");

const ALLOWED_SIZES = [6, 7, 8, 9, 10, 11];

const normalizeSize = (size) => {
  const numericSize = Number(size);

  if (!ALLOWED_SIZES.includes(numericSize)) {
    return null;
  }

  return String(numericSize);
};

const buildCartId = (productId, size) => {
  return `${productId}-${size}`;
};

const getCustomerId = (req) => {
  return req.customer?.id || req.customer?._id;
};

/* =========================================================
   GET CART
========================================================= */

const getCart = async (req, res) => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required.",
      });
    }

    let cart = await Cart.findOne({
      customerId,
    }).lean();

    if (!cart) {
      cart = {
        customerId,
        items: [],
      };
    }

    const productIds = (cart.items || [])
      .map((item) => item.productId)
      .filter(Boolean);
    const currentProducts = productIds.length
      ? await Product.find({ _id: { $in: productIds } })
          .select("price deliveryCharge name category gender image")
          .lean()
      : [];
    const productsById = new Map(
      currentProducts.map((product) => [String(product._id), product])
    );
    const currentItems = (cart.items || []).map((item) => {
      const product = productsById.get(String(item.productId));
      if (!product) return item;

      return {
        ...item,
        name: product.name,
        category: product.category || "",
        gender: product.gender || "",
        image: product.image || "",
        price: Number(product.price || 0),
        deliveryCharge: Number(product.deliveryCharge || 0),
      };
    });

    return res.status(200).json({
      success: true,
      cart: {
        customerId,
        items: currentItems,
      },
    });
  } catch (error) {
    console.error("Get Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load cart.",
    });
  }
};

/* =========================================================
   ADD ITEM
========================================================= */

const addToCart = async (req, res) => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required.",
      });
    }

    const {
      productId,
      size,
      quantity = 1,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const normalizedSize = normalizeSize(size);

    if (!normalizedSize) {
      return res.status(400).json({
        success: false,
        message: "Valid shoe size is required.",
      });
    }

    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1 ||
      requestedQuantity > 20
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 20.",
      });
    }

    const product = await Product.findById(productId).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const sizeInventory = Array.isArray(product.sizes)
      ? product.sizes.find(
          (item) =>
            Number(item.size) === Number(normalizedSize)
        )
      : null;

    if (!sizeInventory) {
      return res.status(400).json({
        success: false,
        message: `Size ${normalizedSize} is not available.`,
      });
    }

    const availableStock = Number(
      sizeInventory.stock || 0
    );

    if (availableStock <= 0) {
      return res.status(400).json({
        success: false,
        message: `Size ${normalizedSize} is out of stock.`,
      });
    }

    let cart = await Cart.findOne({
      customerId,
    });

    if (!cart) {
      cart = new Cart({
        customerId,
        items: [],
      });
    }

    const cartId = buildCartId(
      product._id.toString(),
      normalizedSize
    );

    const existingItem = cart.items.find(
      (item) => item.cartId === cartId
    );

    const newQuantity = existingItem
      ? Number(existingItem.quantity) +
        requestedQuantity
      : requestedQuantity;

    if (newQuantity > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} unit(s) are available for size ${normalizedSize}.`,
      });
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
      existingItem.price = Number(product.price);
      existingItem.deliveryCharge = Number(product.deliveryCharge || 0);
      existingItem.name = product.name;
      existingItem.category = product.category || "";
      existingItem.gender = product.gender || "";
      existingItem.image = product.image || "";
      existingItem.size = normalizedSize;
      existingItem.productId = product._id;
    } else {
      cart.items.push({
        cartId,
        productId: product._id,
        name: product.name,
        category: product.category || "",
        gender: product.gender || "",
        image: product.image || "",
        size: normalizedSize,
        price: Number(product.price),
        deliveryCharge: Number(product.deliveryCharge || 0),
        quantity: requestedQuantity,
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product added to cart.",
      cart,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add product to cart.",
    });
  }
};

/* =========================================================
   UPDATE QUANTITY
========================================================= */

const updateCartQuantity = async (req, res) => {
  try {
    const customerId = getCustomerId(req);
    const { cartId } = req.params;

    const quantity = Number(req.body.quantity);

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required.",
      });
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 20
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 20.",
      });
    }

    const cart = await Cart.findOne({
      customerId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const item = cart.items.find(
      (cartItem) => cartItem.cartId === cartId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    const product = await Product.findById(
      item.productId
    ).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product no longer exists.",
      });
    }

    const sizeInventory = Array.isArray(product.sizes)
      ? product.sizes.find(
          (sizeItem) =>
            Number(sizeItem.size) ===
            Number(item.size)
        )
      : null;

    const availableStock = Number(
      sizeInventory?.stock || 0
    );

    if (quantity > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} unit(s) are available for size ${item.size}.`,
      });
    }

    item.quantity = quantity;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated.",
      cart,
    });
  } catch (error) {
    console.error(
      "Update Cart Quantity Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update cart quantity.",
    });
  }
};

/* =========================================================
   REMOVE SINGLE ITEM
========================================================= */

const removeFromCart = async (req, res) => {
  try {
    const customerId = getCustomerId(req);
    const { cartId } = req.params;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required.",
      });
    }

    const cart = await Cart.findOne({
      customerId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const originalLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) => item.cartId !== cartId
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from cart.",
      cart,
    });
  } catch (error) {
    console.error("Remove Cart Item Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove cart item.",
    });
  }
};

/* =========================================================
   REMOVE MULTIPLE ITEMS
   Used after successful payment.
========================================================= */

const removeItemsFromCart = async (req, res) => {
  try {
    const customerId = getCustomerId(req);
    const { cartIds } = req.body;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required.",
      });
    }

    if (!Array.isArray(cartIds)) {
      return res.status(400).json({
        success: false,
        message: "cartIds must be an array.",
      });
    }

    const normalizedIds = cartIds
      .map((id) => String(id || "").trim())
      .filter(Boolean);

    if (normalizedIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No cart items to remove.",
      });
    }

    const cart = await Cart.findOne({
      customerId,
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is already empty.",
        cart: {
          customerId,
          items: [],
        },
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        !normalizedIds.includes(item.cartId)
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Purchased cart items removed.",
      cart,
    });
  } catch (error) {
    console.error(
      "Remove Purchased Cart Items Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to remove purchased cart items.",
    });
  }
};

/* =========================================================
   CLEAR CART
========================================================= */

const clearCart = async (req, res) => {
  try {
    const customerId = getCustomerId(req);

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required.",
      });
    }

    await Cart.findOneAndUpdate(
      { customerId },
      {
        $set: {
          items: [],
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
      cart: {
        customerId,
        items: [],
      },
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to clear cart.",
    });
  }
};

/* =========================================================
   SYNC OLD LOCAL CART
========================================================= */

const syncCart = async (req, res) => {
  try {
    const customerId = getCustomerId(req);
    const { items } = req.body;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required.",
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Cart items must be an array.",
      });
    }

    let cart = await Cart.findOne({
      customerId,
    });

    if (!cart) {
      cart = new Cart({
        customerId,
        items: [],
      });
    }

    for (const localItem of items) {
      const productId =
        localItem.productId ||
        localItem.id ||
        localItem._id;

      if (
        !mongoose.Types.ObjectId.isValid(
          productId
        )
      ) {
        continue;
      }

      const normalizedSize = normalizeSize(
        localItem.size
      );

      if (!normalizedSize) {
        continue;
      }

      const desiredQuantity = Number(
        localItem.quantity
      );

      if (
        !Number.isInteger(desiredQuantity) ||
        desiredQuantity < 1
      ) {
        continue;
      }

      const product = await Product.findById(
        productId
      ).lean();

      if (!product) {
        continue;
      }

      const sizeInventory = Array.isArray(
        product.sizes
      )
        ? product.sizes.find(
            (sizeItem) =>
              Number(sizeItem.size) ===
              Number(normalizedSize)
          )
        : null;

      const availableStock = Number(
        sizeInventory?.stock || 0
      );

      if (availableStock <= 0) {
        continue;
      }

      const finalQuantity = Math.min(
        desiredQuantity,
        availableStock,
        20
      );

      const cartId = buildCartId(
        product._id.toString(),
        normalizedSize
      );

      const existingItem = cart.items.find(
        (item) => item.cartId === cartId
      );

      if (existingItem) {
        existingItem.quantity = Math.min(
          Math.max(
            Number(existingItem.quantity || 0),
            finalQuantity
          ),
          availableStock,
          20
        );

        existingItem.price = Number(product.price);
        existingItem.deliveryCharge = Number(product.deliveryCharge || 0);
        existingItem.name = product.name;
        existingItem.category =
          product.category || "";
        existingItem.gender =
          product.gender || "";
        existingItem.image =
          product.image || "";
      } else {
        cart.items.push({
          cartId,
          productId: product._id,
          name: product.name,
          category: product.category || "",
          gender: product.gender || "",
          image: product.image || "",
          size: normalizedSize,
          price: Number(product.price),
          deliveryCharge: Number(product.deliveryCharge || 0),
          quantity: finalQuantity,
        });
      }
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart synchronized.",
      cart,
    });
  } catch (error) {
    console.error("Sync Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to synchronize cart.",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  removeItemsFromCart,
  clearCart,
  syncCart,
};
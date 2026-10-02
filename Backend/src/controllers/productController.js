const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const ALLOWED_SIZES = [6, 7, 8, 9, 10, 11];

/* =========================================================
   VALIDATE SIZE INVENTORY
========================================================= */

const normalizeSizes = (sizes) => {
  let parsedSizes = sizes;

  if (typeof parsedSizes === "string") {
    try {
      parsedSizes = JSON.parse(parsedSizes);
    } catch {
      throw new Error("Invalid sizes format.");
    }
  }

  if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
    throw new Error("At least one shoe size is required.");
  }

  const normalizedSizes = parsedSizes.map((item) => {
    const size = Number(item?.size);
    const stock = Number(item?.stock);

    if (!ALLOWED_SIZES.includes(size)) {
      throw new Error(
        `Invalid shoe size. Allowed sizes: ${ALLOWED_SIZES.join(", ")}.`
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error(
        `Stock for size ${size} must be a non-negative integer.`
      );
    }

    return {
      size,
      stock,
    };
  });

  const uniqueSizes = new Set(
    normalizedSizes.map((item) => item.size)
  );

  if (uniqueSizes.size !== normalizedSizes.length) {
    throw new Error("Duplicate shoe sizes are not allowed.");
  }

  return normalizedSizes.sort((a, b) => a.size - b.size);
};

/* =========================================================
   CLOUDINARY IMAGE UPLOAD
========================================================= */

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "namikol/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/* =========================================================
   GET ALL PRODUCTS
========================================================= */

const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch products.",
    });
  }
};

/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get Product Error:", error);

    return res.status(400).json({
      success: false,
      message: "Invalid product ID.",
    });
  }
};

/* =========================================================
   CREATE PRODUCT
========================================================= */

const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      deliveryCharge = 0,
      sizes,
      category,
      gender,
      newArrival,
      bestSeller,
      description,
    } = req.body;

    /* ---------------------------------------------
       BASIC VALIDATION
    --------------------------------------------- */

    if (
      !name ||
      price === undefined ||
      !category ||
      !gender ||
      sizes === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, price, sizes, category and gender are required.",
      });
    }

    const productPrice = Number(price);
    const productDeliveryCharge = Number(deliveryCharge);

    if (
      !Number.isFinite(productPrice) ||
      productPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Product price must be valid.",
      });
    }

    if (!Number.isFinite(productDeliveryCharge) || productDeliveryCharge < 0) {
      return res.status(400).json({
        success: false,
        message: "Delivery charge must be a non-negative amount.",
      });
    }

    /* ---------------------------------------------
       SIZE-WISE INVENTORY VALIDATION
    --------------------------------------------- */

    let normalizedSizes;

    try {
      normalizedSizes = normalizeSizes(sizes);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    /* ---------------------------------------------
       IMAGE REQUIRED
    --------------------------------------------- */

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product image is required.",
      });
    }

    /* ---------------------------------------------
       UPLOAD IMAGE TO CLOUDINARY
    --------------------------------------------- */

    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer
    );

    const imageUrl = cloudinaryResult.secure_url;

    /* ---------------------------------------------
       CREATE PRODUCT IN MONGODB
    --------------------------------------------- */

    const product = await Product.create({
      name: name.trim(),
      price: productPrice,
      deliveryCharge: productDeliveryCharge,
      sizes: normalizedSizes,
      category: category.trim(),
      gender,
      image: imageUrl,
      description: String(description || "").trim(),
      newArrival:
        newArrival === true || newArrival === "true",
      bestSeller:
        bestSeller === true || bestSeller === "true",
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create product.",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE PRODUCT
========================================================= */

const updateProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      deliveryCharge,
      sizes,
      category,
      gender,
      newArrival,
      bestSeller,
      description,
    } = req.body;

    const updates = {};

    /* ---------------------------------------------
       BASIC FIELDS
    --------------------------------------------- */

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty.",
        });
      }

      updates.name = String(name).trim();
    }

    if (price !== undefined) {
      const productPrice = Number(price);

      if (
        !Number.isFinite(productPrice) ||
        productPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Product price must be valid.",
        });
      }

      updates.price = productPrice;
    }

    if (deliveryCharge !== undefined) {
      const productDeliveryCharge = Number(deliveryCharge);

      if (!Number.isFinite(productDeliveryCharge) || productDeliveryCharge < 0) {
        return res.status(400).json({
          success: false,
          message: "Delivery charge must be a non-negative amount.",
        });
      }

      updates.deliveryCharge = productDeliveryCharge;
    }

    /* ---------------------------------------------
       SIZE-WISE INVENTORY
    --------------------------------------------- */

    if (sizes !== undefined) {
      try {
        updates.sizes = normalizeSizes(sizes);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    if (category !== undefined) {
      if (!String(category).trim()) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be empty.",
        });
      }

      updates.category = String(category).trim();
    }

    if (description !== undefined) {
      const normalizedDescription = String(description).trim();

      if (normalizedDescription.length > 5000) {
        return res.status(400).json({
          success: false,
          message: "Product description is too long.",
        });
      }

      updates.description = normalizedDescription;
    }

    if (gender !== undefined) {
      updates.gender = gender;
    }

    if (newArrival !== undefined) {
      updates.newArrival =
        newArrival === true || newArrival === "true";
    }

    if (bestSeller !== undefined) {
      updates.bestSeller =
        bestSeller === true || bestSeller === "true";
    }

    /* ---------------------------------------------
       NEW IMAGE UPLOAD
    --------------------------------------------- */

    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(
        req.file.buffer
      );

      updates.image = cloudinaryResult.secure_url;
    }

    /* ---------------------------------------------
       UPDATE MONGODB
    --------------------------------------------- */

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to update product.",
      error: error.message,
    });
  }
};

/* =========================================================
   DELETE PRODUCT
========================================================= */

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to delete product.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
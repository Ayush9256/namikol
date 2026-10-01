import api from "./api";

export const normalizeProduct = (product) => {
  const sizes = Array.isArray(product?.sizes)
    ? product.sizes.map((item) => ({
        ...item,
        size: Number(item.size),
        stock: Number(item.stock || 0),
      }))
    : [];

  return {
    ...product,
    id: String(product?._id || product?.id || ""),
    sizes,
    stock: sizes.reduce((total, item) => total + item.stock, 0),
    badge: product?.newArrival
      ? "New"
      : product?.bestSeller
        ? "Bestseller"
        : "",
  };
};

/* =========================================================
   GET ALL PRODUCTS
========================================================= */

export const getProducts = async () => {
  const response = await api.get("/products");
  return {
    ...response.data,
    products: (response.data?.products || []).map(normalizeProduct),
  };
};

/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return {
    ...response.data,
    product: response.data?.product
      ? normalizeProduct(response.data.product)
      : null,
  };
};

/* =========================================================
   CREATE PRODUCT
========================================================= */

export const createProduct = async (productData) => {
  const response = await api.post("/products", productData);
  return response.data;
};

/* =========================================================
   UPDATE PRODUCT
========================================================= */

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

/* =========================================================
   DELETE PRODUCT
========================================================= */

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};
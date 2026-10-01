const STORAGE_KEY = "namikol_products";

export const getStoredProducts = () => {
  try {
    const storedProducts = localStorage.getItem(STORAGE_KEY);

    if (!storedProducts) {
      return [];
    }

    return JSON.parse(storedProducts);
  } catch (error) {
    console.error("Failed to read products:", error);
    return [];
  }
};

export const saveProducts = (products) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch (error) {
    console.error("Failed to save products:", error);
    return false;
  }
};

export const addProduct = (product) => {
  const products = getStoredProducts();

  const newProduct = {
    ...product,
    id: `product-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const updatedProducts = [...products, newProduct];

  saveProducts(updatedProducts);

  return newProduct;
};

export const updateProduct = (id, updatedData) => {
  const products = getStoredProducts();

  const updatedProducts = products.map((product) =>
    product.id === id
      ? {
          ...product,
          ...updatedData,
          id: product.id,
          updatedAt: new Date().toISOString(),
        }
      : product
  );

  saveProducts(updatedProducts);

  return updatedProducts.find((product) => product.id === id);
};

export const deleteProduct = (id) => {
  const products = getStoredProducts();

  const updatedProducts = products.filter(
    (product) => product.id !== id
  );

  saveProducts(updatedProducts);

  return updatedProducts;
};

export const getProductById = (id) => {
  const products = getStoredProducts();

  return products.find((product) => product.id === id) || null;
};

export const clearProducts = () => {
  localStorage.removeItem(STORAGE_KEY);
};
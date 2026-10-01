import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const response = await getProducts();
        if (!cancelled) {
          setProducts(response.products || []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError.response?.data?.message ||
              "Unable to load products."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
}
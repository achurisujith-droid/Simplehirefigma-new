/**
 * Products Hook
 * Manages user's purchased products
 */

import { useState, useEffect } from 'react';
import { userService } from '../services/user.service';

export function useProducts() {
  const [products, setProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await userService.getPurchasedProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  const addProduct = (productId: string) => {
    setProducts(prev => {
      if (productId === 'combo') {
        return ['skill', 'id-visa', 'reference'];
      }
      if (!prev.includes(productId)) {
        return [...prev, productId];
      }
      return prev;
    });
  };

  const hasProduct = (productId: string) => products.includes(productId);

  return {
    products,
    isLoading,
    addProduct,
    hasProduct,
  };
}

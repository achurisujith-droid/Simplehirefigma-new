import { Router } from 'express';
import { PRODUCTS } from '../types';

const router = Router();

// Get all products (public route)
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: PRODUCTS,
  });
});

// Get product by ID (public route)
router.get('/:productId', (req, res) => {
  const product = PRODUCTS.find(p => p.id === req.params.productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
      code: 'NOT_FOUND',
    });
  }

  res.json({
    success: true,
    data: product,
  });
});

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Get product by ID
router.get('/:productId', async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.productId,
        active: true,
      },
    });

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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;

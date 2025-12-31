import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

// Get all products (requires authentication)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
});

// Get product by ID (requires authentication)
router.get('/:productId', authenticate, async (req, res, next) => {
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
    next(error);
  }
});

export default router;

import { Router } from 'express';
import { Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth';
import { AuthRequest, PRODUCTS } from '../types';
import { AppError } from '../utils/errors';
import config from '../config';
import prisma from '../config/database';

require('dotenv').config();

const router = Router();
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  : new Stripe('sk_test_placeholder', { apiVersion: '2025-02-24.acacia' });

// Add warning when running with placeholder key
if (
  !process.env.STRIPE_SECRET_KEY ||
  process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder'
) {
  console.warn(
    '⚠️  Warning: Stripe is running in placeholder mode. Payment functionality will be limited.'
  );
  console.warn(
    '⚠️  To enable full payment processing, set STRIPE_SECRET_KEY to a valid Stripe secret key.'
  );
}

// All routes require authentication
router.use(authenticate);

// Create payment intent
router.post('/create-intent', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.body;

    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    // Check if Stripe is in placeholder mode
    if (process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder' || !process.env.STRIPE_SECRET_KEY) {
      console.log('Stripe is in placeholder mode, simulating payment and adding products.');
      
      // Get user data
      const userData = await prisma.userData.findUnique({
        where: { userId: req.user!.id },
      });

      let products = userData?.purchasedProducts || [];

      // Handle combo product - adds all 3 individual products
      if (productId === 'combo') {
        products = ['skill', 'id-visa', 'reference'];
      } else if (!products.includes(productId)) {
        products.push(productId);
      }

      // Update user's purchased products
      await prisma.userData.update({
        where: { userId: req.user!.id },
        data: { purchasedProducts: products },
      });

      // Create payment record with test mode status
      await prisma.payment.create({
        data: {
          userId: req.user!.id,
          productId,
          amount: product.price,
          currency: 'usd',
          status: 'test_mode',
          paymentIntentId: `pi_test_${Date.now()}`,
          paymentMethodId: 'pm_test_placeholder',
        },
      });

      return res.status(200).json({ 
        message: 'Placeholder response: PaymentIntent not created.',
        success: true,
        data: {
          purchasedProduct: productId,
          addedProducts: products
        }
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price,
      currency: 'usd',
      metadata: {
        userId: req.user!.id,
        productId,
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Confirm payment
router.post('/confirm', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new AppError('Payment not successful', 402, 'PAYMENT_FAILED');
    }

    const productId = paymentIntent.metadata.productId;

    // Add product to user
    const userData = await prisma.userData.findUnique({
      where: { userId: req.user!.id },
    });

    let products = userData?.purchasedProducts || [];

    if (productId === 'combo') {
      products = ['skill', 'id-visa', 'reference'];
    } else if (!products.includes(productId)) {
      products.push(productId);
    }

    await prisma.userData.update({
      where: { userId: req.user!.id },
      data: { purchasedProducts: products },
    });

    // Record payment
    await prisma.payment.create({
      data: {
        userId: req.user!.id,
        productId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
        paymentIntentId,
        paymentMethodId,
      },
    });

    res.json({
      success: true,
      data: {
        success: true,
        purchasedProduct: productId,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get payment history
router.get('/history', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    const formattedPayments = payments.map(p => {
      const product = PRODUCTS.find(prod => prod.id === p.productId);
      return {
        id: p.id,
        productId: p.productId,
        productName: product?.name || 'Unknown',
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
      };
    });

    res.json({
      success: true,
      data: formattedPayments,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

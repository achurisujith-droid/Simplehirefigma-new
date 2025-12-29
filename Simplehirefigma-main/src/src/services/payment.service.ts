/**
 * Payment Service
 * Handles payment and product purchase-related API calls
 */

import { apiClient } from './api-client';
import type { ApiResponse, Product } from '../types';

export const paymentService = {
  /**
   * Get all available products/plans
   */
  async getProducts(): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>('/products');
  },

  /**
   * Get product details
   */
  async getProductDetails(productId: string): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`/products/${productId}`);
  },

  /**
   * Create payment intent (Stripe)
   */
  async createPaymentIntent(
    productId: string
  ): Promise<ApiResponse<{ clientSecret: string; paymentIntentId: string }>> {
    return apiClient.post('/payments/create-intent', { productId });
  },

  /**
   * Confirm payment
   */
  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<ApiResponse<{ success: boolean; purchasedProduct: string }>> {
    return apiClient.post('/payments/confirm', {
      paymentIntentId,
      paymentMethodId,
    });
  },

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/payments/history');
  },

  /**
   * Get invoice
   */
  async getInvoice(invoiceId: string): Promise<ApiResponse<any>> {
    return apiClient.get(`/payments/invoice/${invoiceId}`);
  },

  /**
   * Apply coupon code
   */
  async applyCoupon(
    productId: string,
    couponCode: string
  ): Promise<ApiResponse<{ discountedPrice: number; discount: number }>> {
    return apiClient.post('/payments/apply-coupon', {
      productId,
      couponCode,
    });
  },
};

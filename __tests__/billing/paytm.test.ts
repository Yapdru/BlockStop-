/**
 * PayTM Billing Service Tests
 */

import { PayTMBillingService } from '@/lib/billing/paytm-service';

describe('PayTMBillingService', () => {
  let service: PayTMBillingService;

  beforeEach(() => {
    service = new PayTMBillingService();
  });

  describe('initializeOrder', () => {
    it('should create an order with valid parameters', async () => {
      const userId = 'test_user_123';
      const amount = 299;
      const method = 'upi';
      const product = 'pro';
      const frequency = 'monthly';

      const result = await service.initializeOrder(userId, amount, method as any, product as any, frequency);

      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('paytmUrl');
      expect(result).toHaveProperty('checksum');
      expect(result.orderId).toMatch(/^ORDER_/);
    });

    it('should map UPI method correctly', async () => {
      const result = await service.initializeOrder('user1', 299, 'upi' as any, 'pro' as any, 'monthly');

      expect(result.paytmUrl).toContain('UPI');
    });

    it('should map BHIM method to UPI channel', async () => {
      const result = await service.initializeOrder('user1', 299, 'bhim' as any, 'pro' as any, 'monthly');

      expect(result.paytmUrl).toContain('UPI');
    });

    it('should map credit_card method correctly', async () => {
      const result = await service.initializeOrder('user1', 299, 'credit_card' as any, 'pro' as any, 'monthly');

      expect(result.paytmUrl).toContain('CREDITCARD');
    });

    it('should map debit_card method correctly', async () => {
      const result = await service.initializeOrder('user1', 299, 'debit_card' as any, 'pro' as any, 'monthly');

      expect(result.paytmUrl).toContain('DEBITCARD');
    });

    it('should generate valid checksum', async () => {
      const result = await service.initializeOrder('user1', 299, 'upi' as any, 'pro' as any, 'monthly');

      expect(result.checksum).toBeTruthy();
      expect(result.checksum.length).toBeGreaterThan(0);
    });

    it('should handle annual frequency', async () => {
      const result = await service.initializeOrder('user1', 2999, 'paytm' as any, 'pro' as any, 'annual');

      expect(result.paytmUrl).toContain('2999');
    });
  });

  describe('Payment Methods', () => {
    it('should support all payment methods', async () => {
      const methods = ['upi', 'bhim', 'paytm', 'credit_card', 'debit_card'];

      for (const method of methods) {
        const result = await service.initializeOrder('user1', 299, method as any, 'pro' as any, 'monthly');
        expect(result.orderId).toBeTruthy();
      }
    });
  });

  describe('Product Tiers', () => {
    it('should support all product tiers', async () => {
      const products = ['neo', 'pro', 'office', 'health', 'max'];

      for (const product of products) {
        const result = await service.initializeOrder('user1', 299, 'upi' as any, product as any, 'monthly');
        expect(result.orderId).toBeTruthy();
      }
    });
  });
});

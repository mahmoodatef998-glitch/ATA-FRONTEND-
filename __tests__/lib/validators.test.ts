/**
 * Tests for Validators (Zod schemas)
 */

import { createOrderSchema, updateOrderStatusSchema, phoneSchema } from '@/lib/validators/order';

describe('Order Validators', () => {
  describe('phoneSchema', () => {
    it('should accept valid phone numbers', () => {
      expect(() => phoneSchema.parse('1234567890')).not.toThrow();
      expect(() => phoneSchema.parse('+971501234567')).not.toThrow();
      expect(() => phoneSchema.parse('(123) 456-7890')).not.toThrow();
    });

    it('should reject invalid phone numbers', () => {
      expect(() => phoneSchema.parse('123')).toThrow(); // Too short
      expect(() => phoneSchema.parse('a'.repeat(25))).toThrow(); // Too long
      expect(() => phoneSchema.parse('abc123')).toThrow(); // Invalid characters
    });
  });

  describe('createOrderSchema', () => {
    it('should accept valid order data', () => {
      const validOrder = {
        name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        details: 'Order details',
        items: [
          { name: 'Item 1', quantity: 2, specs: 'Specs' }
        ]
      };
      expect(() => createOrderSchema.parse(validOrder)).not.toThrow();
    });

    it('should reject invalid name', () => {
      const invalidOrder = {
        name: 'A', // Too short
        phone: '1234567890',
      };
      expect(() => createOrderSchema.parse(invalidOrder)).toThrow();
    });

    it('should reject invalid email', () => {
      const invalidOrder = {
        name: 'John Doe',
        phone: '1234567890',
        email: 'invalid-email',
      };
      expect(() => createOrderSchema.parse(invalidOrder)).toThrow();
    });

    it('should accept empty email', () => {
      const validOrder = {
        name: 'John Doe',
        phone: '1234567890',
        email: '',
      };
      expect(() => createOrderSchema.parse(validOrder)).not.toThrow();
    });

    it('should validate items array', () => {
      const invalidOrder = {
        name: 'John Doe',
        phone: '1234567890',
        items: [
          { name: '', quantity: 2 } // Empty name
        ]
      };
      expect(() => createOrderSchema.parse(invalidOrder)).toThrow();
    });
  });

  describe('updateOrderStatusSchema', () => {
    it('should accept valid status values', () => {
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'QUOTATION_SENT', 'COMPLETED', 'CANCELLED'];
      validStatuses.forEach(status => {
        expect(() => updateOrderStatusSchema.parse({ status })).not.toThrow();
      });
    });

    it('should reject invalid status', () => {
      expect(() => updateOrderStatusSchema.parse({ status: 'INVALID' })).toThrow();
    });

    it('should accept optional note', () => {
      expect(() => updateOrderStatusSchema.parse({ 
        status: 'APPROVED', 
        note: 'Approved note' 
      })).not.toThrow();
    });

    it('should reject note that is too long', () => {
      const longNote = 'a'.repeat(1001);
      expect(() => updateOrderStatusSchema.parse({ 
        status: 'APPROVED', 
        note: longNote 
      })).toThrow();
    });
  });
});

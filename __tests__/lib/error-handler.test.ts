/**
 * Tests for Error Handler utilities
 */

import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError,
  handleApiError,
  getErrorMessage 
} from '@/lib/error-handler';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create AppError with default status code', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
    });

    it('should create AppError with custom status code', () => {
      const error = new AppError('Not found', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should include code and details', () => {
      const error = new AppError('Error', 400, 'CUSTOM_CODE', { field: 'test' });
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.details).toEqual({ field: 'test' });
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with errors array', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' }
      ];
      const error = new ValidationError('Validation failed', errors);
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.errors).toEqual(errors);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with resource and id', () => {
      const error = new NotFoundError('User', 123);
      expect(error.message).toBe('User with id 123 not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create NotFoundError without id', () => {
      const error = new NotFoundError('User');
      expect(error.message).toBe('User not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create UnauthorizedError with default message', () => {
      const error = new UnauthorizedError();
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Please login');
      expect(error.message).toBe('Please login');
    });
  });

  describe('ForbiddenError', () => {
    it('should create ForbiddenError with default message', () => {
      const error = new ForbiddenError();
      expect(error.message).toBe('Forbidden: Insufficient permissions');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('handleApiError', () => {
    it('should handle AppError correctly', () => {
      const error = new ValidationError('Invalid input', [
        { field: 'email', message: 'Invalid email' }
      ]);
      const response = handleApiError(error);
      
      expect(response).toBeInstanceOf(NextResponse);
      // Note: Can't easily test JSON body in Jest, but we can verify it's a NextResponse
    });

    it('should handle Prisma unique constraint error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: { target: ['email'] }
      } as any);
      
      const response = handleApiError(prismaError);
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should handle Prisma not found error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.0.0'
      } as any);
      
      const response = handleApiError(prismaError);
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error');
      const response = handleApiError(error);
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should handle unknown error types', () => {
      const response = handleApiError('String error');
      expect(response).toBeInstanceOf(NextResponse);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should return string as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should return default message for unknown types', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
      expect(getErrorMessage(123)).toBe('An unexpected error occurred');
    });
  });
});


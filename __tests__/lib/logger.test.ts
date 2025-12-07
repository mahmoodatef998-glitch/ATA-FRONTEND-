/**
 * Tests for Logger utility
 */

import { logger } from '@/lib/logger';

describe('Logger', () => {
  // Save original console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  beforeEach(() => {
    // Mock console methods
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.debug = jest.fn();
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  });

  describe('info', () => {
    it('should log info messages in development/test', () => {
      logger.info('Test info message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test info message'),
        ''
      );
    });

    it('should log info with data', () => {
      const data = { userId: 123 };
      logger.info('User action', data);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] User action'),
        data
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Test warning'),
        ''
      );
    });
  });

  describe('error', () => {
    it('should always log errors', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error occurred'),
        error
      );
    });

    it('should log errors without error object', () => {
      logger.error('Simple error message');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Simple error message'),
        ''
      );
    });
  });

  describe('debug', () => {
    it('should log debug messages in test environment', () => {
      logger.debug('Debug info');
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Debug info'),
        ''
      );
    });
  });

  describe('success', () => {
    it('should log success messages', () => {
      logger.success('Operation completed');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[SUCCESS] Operation completed'),
        ''
      );
    });
  });

  describe('api', () => {
    it('should log API requests', () => {
      logger.api('POST', '/api/orders', { id: 1 });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[API] POST /api/orders'),
        { id: 1 }
      );
    });
  });

  describe('query', () => {
    it('should log database queries', () => {
      logger.query('SELECT * FROM users WHERE id = ?', [123]);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[QUERY]'),
        [123]
      );
    });
  });
});


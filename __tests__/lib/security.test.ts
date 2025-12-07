/**
 * Tests for Security utilities
 */

import {
  sanitizeHtml,
  sanitizeText,
  sanitizeFilename,
  sanitizeUrl,
  sanitizeObject
} from '@/lib/security';

describe('Security Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should remove all HTML tags', () => {
      const html = '<script>alert("xss")</script><p>Hello</p>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<p>');
    });

    it('should return empty string for null/undefined', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const text = '<p>Hello</p> World';
      const result = sanitizeText(text);
      expect(result).toBe('Hello World');
    });

    it('should remove special characters', () => {
      const text = 'Hello <>&"\' World';
      const result = sanitizeText(text);
      expect(result).toBe('Hello  World');
    });

    it('should trim whitespace', () => {
      expect(sanitizeText('  Hello  ')).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null as any)).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove directory traversal attempts', () => {
      expect(sanitizeFilename('../../../etc/passwd')).not.toContain('..');
      expect(sanitizeFilename('../../file.txt')).not.toContain('..');
    });

    it('should replace path separators', () => {
      const result = sanitizeFilename('path/to/file.txt');
      expect(result).not.toContain('/');
      expect(result).not.toContain('\\');
    });

    it('should handle reserved Windows names', () => {
      const result = sanitizeFilename('CON.txt');
      expect(result).toContain('file_');
    });

    it('should remove special characters', () => {
      const result = sanitizeFilename('file<>:"|?*.txt');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should handle empty filename', () => {
      expect(sanitizeFilename('')).toBe('file');
      expect(sanitizeFilename(null as any)).toBe('file');
    });
  });

  describe('sanitizeUrl', () => {
    it('should reject javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should reject data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should accept http:// URLs', () => {
      const url = 'http://example.com';
      const result = sanitizeUrl(url);
      expect(result).toContain('http://example.com');
      expect(result).not.toBe('');
    });

    it('should accept https:// URLs', () => {
      const url = 'https://example.com';
      const result = sanitizeUrl(url);
      expect(result).toContain('https://example.com');
      expect(result).not.toBe('');
    });

    it('should reject invalid URLs', () => {
      expect(sanitizeUrl('not-a-url')).toBe('');
      expect(sanitizeUrl('ftp://example.com')).toBe('');
    });

    it('should handle empty strings', () => {
      expect(sanitizeUrl('')).toBe('');
      expect(sanitizeUrl(null as any)).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values', () => {
      const obj = { name: '<p>Hello</p>', age: 25 };
      const result = sanitizeObject(obj);
      expect(result.name).toBe('Hello');
      expect(result.age).toBe(25);
    });

    it('should sanitize nested objects', () => {
      const obj = {
        user: {
          name: '<script>alert(1)</script>',
          email: 'test@example.com'
        }
      };
      const result = sanitizeObject(obj);
      expect(result.user.name).not.toContain('<script>');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should sanitize arrays', () => {
      const obj = {
        tags: ['<p>tag1</p>', 'tag2', '<script>tag3</script>']
      };
      const result = sanitizeObject(obj);
      expect(result.tags[0]).not.toContain('<p>');
      expect(result.tags[1]).toBe('tag2');
      expect(result.tags[2]).not.toContain('<script>');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(undefined)).toBeUndefined();
    });

    it('should sanitize object keys', () => {
      const obj = {
        '<script>key</script>': 'value'
      };
      const result = sanitizeObject(obj);
      const keys = Object.keys(result);
      expect(keys[0]).not.toContain('<script>');
    });
  });
});


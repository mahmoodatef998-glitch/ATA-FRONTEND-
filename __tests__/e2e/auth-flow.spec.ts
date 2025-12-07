/**
 * E2E Tests for Authentication Flow
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3005/login');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[type="email"]', 'admin@demo.co');
    await page.fill('input[type="password"]', '00243540000');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 5000 });

    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForSelector('text=/invalid|error|incorrect/i', { timeout: 3000 });

    // Verify we're still on login page
    expect(page.url()).toContain('/login');
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('http://localhost:3005/dashboard/orders');

    // Should redirect to login
    await page.waitForURL('**/login**', { timeout: 3000 });
    expect(page.url()).toContain('/login');
  });
});


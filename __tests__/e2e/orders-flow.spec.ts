/**
 * E2E Tests for Orders Workflow
 */

import { test, expect } from '@playwright/test';

test.describe('Orders Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3005/login');
    await page.fill('input[type="email"]', 'admin@demo.co');
    await page.fill('input[type="password"]', '00243540000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**');
  });

  test('should display orders list', async ({ page }) => {
    // Navigate to orders page
    await page.goto('http://localhost:3005/dashboard/orders');

    // Wait for orders to load
    await page.waitForSelector('table, [data-testid="orders-list"], .order-item', { timeout: 5000 });

    // Verify orders are displayed
    const ordersContainer = page.locator('table, [data-testid="orders-list"], .order-item').first();
    await expect(ordersContainer).toBeVisible();
  });

  test('should navigate to order details', async ({ page }) => {
    // Go to orders page
    await page.goto('http://localhost:3005/dashboard/orders');

    // Wait for orders
    await page.waitForSelector('a[href*="/orders/"], button[onclick*="order"]', { timeout: 5000 });

    // Click first order (if exists)
    const firstOrderLink = page.locator('a[href*="/orders/"], button[onclick*="order"]').first();
    
    if (await firstOrderLink.count() > 0) {
      await firstOrderLink.click();
      
      // Should navigate to order details
      await page.waitForURL('**/orders/**', { timeout: 3000 });
      expect(page.url()).toMatch(/\/orders\/\d+/);
    }
  });
});


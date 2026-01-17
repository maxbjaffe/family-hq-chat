import { test, expect } from '@playwright/test';

// Smoke tests for family-focused pages
// Run: npm run test:visual
// Update baselines: npm run test:visual:update

test.describe('Visual Smoke Tests', () => {

  test('homepage', async ({ page }) => {
    await page.goto('/');
    // Wait for dynamic content to load
    await page.waitForLoadState('networkidle');
    // Wait for kids progress cards to appear
    await page.waitForSelector('text=Morning Progress', { timeout: 10000 }).catch(() => {});
    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('dashboard with family cards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Wait for family cards to load
    await page.waitForSelector('text=Family', { timeout: 10000 }).catch(() => {});
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('kiosk checklist', async ({ page }) => {
    await page.goto('/kiosk');
    await page.waitForLoadState('networkidle');
    // Wait for member avatars to appear
    await page.waitForSelector('[class*="avatar"], [class*="Avatar"]', { timeout: 10000 }).catch(() => {});
    await expect(page).toHaveScreenshot('kiosk.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('family profile page', async ({ page }) => {
    await page.goto('/family/riley');
    await page.waitForLoadState('networkidle');
    // Wait for profile content
    await page.waitForSelector('text=Back', { timeout: 10000 }).catch(() => {});
    await expect(page).toHaveScreenshot('family-profile.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

});

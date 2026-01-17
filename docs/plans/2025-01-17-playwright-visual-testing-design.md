# Playwright Visual Testing Design

**Date:** 2025-01-17
**Status:** Approved

## Overview

Automated visual smoke tests using Playwright to verify key family-focused pages render correctly on desktop and mobile viewports. Runs as a pre-push hook with warnings (non-blocking).

## Scope

**Pages tested:**
- `/` - Homepage (kids progress, weather, jokes)
- `/dashboard` - FamilyCards with avatars
- `/kiosk` - Kids checklist interface
- `/family/riley` - Family profile page (sample)

**Viewports:**
- Desktop: 1280x720
- Mobile: 390x844 (iPhone 14)

**Behavior:**
- Pre-push hook runs tests automatically
- Warns on failure but doesn't block push
- ~1 minute total runtime

## File Structure

```
tests/
  visual/
    smoke.spec.ts       # All smoke tests
    baseline/           # Golden screenshots (committed to git)
    results/            # Test run output (gitignored)
playwright.config.ts
```

## Dependencies

- `@playwright/test` - Test framework with built-in screenshot comparison
- `simple-git-hooks` - Lightweight git hooks

## Test Implementation

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixelRatio: 0.001
  });
});
```

## Playwright Config

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  snapshotDir: './tests/visual/baseline',
  outputDir: './tests/visual/results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## NPM Scripts

```json
{
  "test:visual": "playwright test",
  "test:visual:update": "playwright test --update-snapshots",
  "test:visual:report": "playwright show-report"
}
```

## Pre-Push Hook

Using `simple-git-hooks` in package.json:

```json
{
  "simple-git-hooks": {
    "pre-push": "npm run test:visual || echo '⚠️  Visual tests failed - check report with: npm run test:visual:report'"
  }
}
```

## Workflow

**Initial setup:**
1. Install dependencies: `npm install -D @playwright/test simple-git-hooks`
2. Install browsers: `npx playwright install chromium`
3. Run to generate baselines: `npm run test:visual:update`
4. Commit baselines to git
5. Activate hooks: `npx simple-git-hooks`

**Daily usage:**
1. Make UI changes
2. `git push` → pre-push hook runs visual tests
3. If warning appears, run `npm run test:visual:report` to see diffs
4. If changes intentional: `npm run test:visual:update`, commit new baselines
5. Push again

**After intentional UI changes:**
```bash
npm run test:visual:update
git add tests/visual/baseline/
git commit -m "Update visual baselines"
```

## Maintenance

- Baselines are committed to git (shared reference for team)
- Update baselines when UI intentionally changes
- HTML report shows visual diffs for debugging
- Threshold of 0.1% pixel difference handles anti-aliasing

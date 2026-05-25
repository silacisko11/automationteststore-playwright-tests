// Cvicny test - moj uplne prvy Playwright test.
// Bez Page Object Model, vsetko priamo cez page objekt.
// Sluzi mi ako "smoke test" - rychla kontrola, ze homepage vobec funguje.

const { test, expect } = require('@playwright/test');

test('homepage sa otvori a obsahuje search input', async ({ page }) => {
  // Idem na homepage. URL '/' = baseURL z playwright.config.js (automationteststore.com).
  await page.goto('/');

  // Kontroly:
  // 1) Title stranky obsahuje "automation".
  await expect(page).toHaveTitle(/automation/i);

  // 2) V hlavicke je search input s ID #filter_keyword.
  await expect(page.locator('#filter_keyword')).toBeVisible();
});

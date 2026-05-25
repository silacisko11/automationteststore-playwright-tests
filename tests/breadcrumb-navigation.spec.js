// Uloha 4 - URL, navigacia a breadcrumbs.
//
// Co overujem:
//   1. Otvorim parent kategoriu (Skincare)
//   2. Zaznamenam, ake produkty su v nej
//   3. Otvorim podkategoriu (Skincare > Eyes)
//   4. Overim breadcrumb: Home > Skincare > Eyes
//   5. Overim, ze URL obsahuje cestu k subkategorii (path=43_47)
//   6. Cez breadcrumb sa vratim na Skincare
//   7. Overim, ze produkty sa zhoduju s povodnym zoznamom
//
// Pozn.: Zadanie spomina kategoriu "Cosmetics" - ta na automationteststore.com
// neexistuje. Pouzivam Skincare > Eyes ako reprezentativny pripad.

const { test, expect } = require('@playwright/test');
const { CategoryPage } = require('../pages/CategoryPage');

const BLOCKED = ['google-analytics', 'googletagmanager', 'doubleclick', 'facebook', 'hotjar'];

// path je segment v URL po "path=".
// 43 = Skincare, 43_47 = Eyes pod Skincare.
const PARENT = { path: '43', name: 'Skincare' };
const CHILD = { path: '43_47', name: 'Eyes' };

test.describe('Breadcrumb and URL navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (BLOCKED.some((h) => url.includes(h))) return route.abort();
      return route.continue();
    });
  });

  // Vycistim route handlere pred tear-down kontextu.
  // Bez tohto sa Playwright pri zatvarani contextu zasekne na pending requestoch
  // co sposobuje "Tearing down context exceeded test timeout" chybu.
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('Skincare > Eyes - breadcrumb shows correct path and back-nav works', async ({ page }) => {
    const category = new CategoryPage(page);

    // Premenne, ktore zdielam medzi krokmi.
    let originalProducts = [];

    // ===== Krok 1: Parent kategoria Skincare =====
    await test.step(`Open parent category "${PARENT.name}"`, async () => {
      await category.openByPath(PARENT.path);

      // expect(page).toHaveURL(regex) - auto-retry assertion.
      // Caka, kym URL splni pattern - bezpecne aj pri pomalsom serveri.
      await expect(page).toHaveURL(/path=43(&|$)/);

      originalProducts = await category.getProductNames();
      expect(originalProducts.length).toBeGreaterThan(0);
    });

    // ===== Krok 2: Subkategoria Eyes =====
    await test.step(`Open subcategory "${CHILD.name}"`, async () => {
      await category.openByPath(CHILD.path);

      // Subkategoria ma URL s podtrznikom (43_47 = child Eyes pod parent Skincare).
      // Toto je "URL pattern" zo zadania - URL nesie hierarchiu.
      await expect(page).toHaveURL(/path=43_47/);

      // Nadpis musi byt "Eyes" - som naozaj na spravnej stranke.
      await expect(category.heading).toContainText(/eyes/i);
    });

    // ===== Krok 3: Breadcrumb =====
    await test.step('Verify breadcrumb is "Home > Skincare > Eyes"', async () => {
      const items = await category.getBreadcrumbItems();
      // toEqual = hlboke porovnanie poli. Ocakavam presne tieto 3 polozky v tomto poradi.
      expect(items).toEqual(['Home', PARENT.name, CHILD.name]);
    });

    // ===== Krok 4: Spat cez breadcrumb =====
    await test.step(`Click breadcrumb "${PARENT.name}" to go back`, async () => {
      await category.clickBreadcrumb(PARENT.name);

      // Po klikku som naspat na parent kategorii.
      // Regex /path=43(&|$)/ matchne "path=43" len ked po nom nasleduje &
      // alebo koniec stringu - takze "path=43_47" sa NEmatchne.
      await expect(page).toHaveURL(/path=43(&|$)/);
      await expect(category.heading).toContainText(/skincare/i);
    });

    // ===== Krok 5: Produkty sa zhoduju s povodnym zoznamom =====
    await test.step('Verify products match the original Skincare list', async () => {
      const productsAfterBack = await category.getProductNames();

      // Pole produktov musi byt totozne - sort sa medzi krokmi nezmenil,
      // takze poradie aj nazvy musia byt rovnake.
      expect(productsAfterBack).toEqual(originalProducts);
    });
  });
});

// Uloha 2 - Kategoria + filtrovanie (sort).
//
// Co overujem:
//   1. Otvorim kategoriu Skincare
//   2. Overim, ze su tam produkty
//   3. Pouzijem sort "Name A - Z"
//   4. Overim, ze produkty su zoradene abecedne
//   5. Otvorim "nahodny" produkt a skontrolujem detail

const { test, expect } = require('@playwright/test');
const { CategoryPage } = require('../pages/CategoryPage');
const { ProductPage } = require('../pages/ProductPage');

const BLOCKED = ['google-analytics', 'googletagmanager', 'doubleclick', 'facebook', 'hotjar'];

test.describe('Category and filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (BLOCKED.some((h) => url.includes(h))) return route.abort();
      return route.continue();
    });
  });

  // Vycistim route handlere pred tear-down kontextu - inak hrozi timeout
  // pri zatvarani prehliadaca kvoli pending requestom.
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('Skincare category - sort by name A-Z and open a product', async ({ page }) => {
    const category = new CategoryPage(page);
    const product = new ProductPage(page);

    // ===== Krok 1: Kategoria + zoznam produktov =====
    await test.step('Open Skincare category and verify product list is shown', async () => {
      // openSkincare ide priamo na URL ?path=43 - deterministicke.
      // Klikanie v top menu by bolo flaky (hover-only, hlavne vo Webkite).
      await category.openSkincare();

      const count = await category.getProductCount();
      expect(count).toBeGreaterThan(0);
    });

    // Premenna na zdielanie zoznamu mien medzi krokmi.
    let sortedNames = [];

    // ===== Krok 2: Sort + overenie zoradenia =====
    await test.step('Sort by "Name A - Z" and verify order', async () => {
      await category.sortBy('Name A - Z');

      sortedNames = await category.getProductNames();
      expect(sortedNames.length).toBeGreaterThan(1);

      // Triedenie: spravim KOPIU pola (`...spread`), zoradim ju a porovnam s povodnym.
      // Ak su rovnake => obchod naozaj zoradil produkty.
      //
      // Preco kopia? .sort() v JS modifikuje pole "in place" - bez kopie by som
      // sa odpalil tym, ze najprv zorad, potom porovnaj zoradene so zoradenym.
      //
      // localeCompare s sensitivity: 'base' = ignoruje case aj diakritiku
      // (napr. "a" == "A" == "á"). Default sort by tu zlyhal pri velkych pismenach.
      const expected = [...sortedNames].sort((a, b) =>
        a.localeCompare(b, 'en', { sensitivity: 'base' }),
      );

      // toEqual = hlboke porovnanie poli (toBe by porovnalo referencie, co je tu zle).
      expect(sortedNames).toEqual(expected);
    });

    // ===== Krok 3: Detail produktu =====
    await test.step('Open a product and verify the detail name matches the list', async () => {
      // "Nahodny" produkt = stredny zo zoznamu.
      // Preco nie Math.random()? Lebo testy musia byt deterministicke -
      // skutocna nahodnost = obcas chytim bug, obcas nie.
      const index = Math.floor(sortedNames.length / 2);
      const expectedName = sortedNames[index];

      await category.openProductByName(expectedName);

      const detailTitle = await product.getTitle();

      // Detail title moze mat aj model number v zatvorke - preto toContain,
      // nie striktna rovnost.
      expect(detailTitle.toLowerCase()).toContain(expectedName.toLowerCase());

      // Sanity check - cena ma format $X alebo $X.XX.
      const price = await product.getPrice();
      expect(price).toMatch(/\$\d+(\.\d{2})?/);
    });
  });
});

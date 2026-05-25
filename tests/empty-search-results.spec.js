// Uloha 5 - Negativny scenar: vyhladanie neexistujuceho produktu.
//
// Negativne testy su rovnako dolezite ako happy path - aj chybove stavy
// musia byt user-friendly (graceful, ziadny 500, ziadny crash).
//
// Co overujem:
//   1. Najprv urobim "happy path" search ("bronzer") - chcem mat v DOMe vysledky,
//      simulujem realneho uzivatela.
//   2. Potom hladam nezmysel ("qwertynonsensesuperproduct123").
//   3. Overim, ze obchod zobrazil hlasku "There is no product...".
//   4. Overim, ze ziadne karty produktov sa NEzobrazuju (ani stare z kroku 1).
//   5. Overim, ze stranka je vizualne konzistentna (hlavicka, search box stale tam).

const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { SearchResultsPage } = require('../pages/SearchResultsPage');

const NONEXISTENT = 'qwertynonsensesuperproduct123';
const REAL_KEYWORD = 'bronzer';

const BLOCKED = ['google-analytics', 'googletagmanager', 'doubleclick', 'facebook', 'hotjar'];

test.describe('Negative scenario - search for nonexistent product', () => {
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

  test('search for nonexistent keyword shows empty state, no leftover results', async ({ page }) => {
    const home = new HomePage(page);
    const results = new SearchResultsPage(page);

    // ===== Krok 1: Happy path - "bronzer" da vysledky =====
    // Tento krok robim zamerne PRED negativnym testom. Simuluje realneho usera -
    // najprv hlada nieco existujuce, potom skusa nezmysel. A overujem, ze
    // tie spravne vysledky NEzostanu v DOMe po druhom searchi.
    let bronzerCount = 0;
    await test.step(`Sanity check - search for "${REAL_KEYWORD}" returns products`, async () => {
      await home.open();
      await home.search(REAL_KEYWORD);

      bronzerCount = await results.getProductCount();
      // toBeGreaterThan(0) - ak by bol 0, demo web ma vypadok a test nepokracuje.
      expect(bronzerCount).toBeGreaterThan(0);
    });

    // ===== Krok 2: Search nezmyslu =====
    await test.step(`Search for nonexistent "${NONEXISTENT}"`, async () => {
      await home.search(NONEXISTENT);

      // Auto-retry assertion - caka, kym sa stranka prekresli.
      // Bez tohto by som mohol zachytit DOM v medzistave (este s vysledkami z bronzeru).
      await expect(results.noResults).toBeVisible();
    });

    // ===== Krok 3: Ziadne produkty + stare zmizli =====
    await test.step('Verify no products are shown and old results are gone', async () => {
      // expectNoResults = pomocna metoda v POMe (asseruje hlasku + count=0).
      await results.expectNoResults();

      // Explicitny dvojity check - count produktov musi byt 0.
      // Toto je hlavne acceptance criteria zadania.
      await expect(results.productLinks).toHaveCount(0);
      expect(await results.getProductCount()).toBe(0);

      // Naozaj sa pocet znizil z bronzerCount na 0 = stare vysledky su prec.
      expect(await results.getProductCount()).toBeLessThan(bronzerCount);
    });

    // ===== Krok 4: Vizualna konzistencia =====
    await test.step('Verify page chrome (header, search box) is still visible', async () => {
      // Stranka musi vyzerat normalne - hlavicka, search input, breadcrumb stale tam.
      // Inymi slovami: obchod chybu zhltol graceful, neukoncil sa s exception.
      await expect(home.searchInput).toBeVisible();
      await expect(page.locator('ul.breadcrumb')).toBeVisible();
      await expect(page).toHaveURL(/rt=product\/search/);
    });
  });
});

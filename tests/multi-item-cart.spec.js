// Uloha 3 - Kosik s viacerymi polozkami.
//
// Co overujem:
//   1. Pridam dva rozne produkty
//   2. Overim nazvy, ceny, mnozstva
//   3. Zmenim mnozstvo prveho produktu na 3
//   4. Overim, ze line total = unit_price * 3
//   5. Odstranim druhy produkt
//   6. Overim, ze v kosiku ostal iba prvy s qty=3 a spravnymi sumami

const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');

// Produkty hladam cez kratke keywordy, lebo pri 1 vysledku obchod automaticky
// preskoci na detail (a ja chcem ist cez search results).
const PRODUCT_A = { keyword: 'bronzer', name: 'Skinsheen Bronzer Stick' };
const PRODUCT_B = { keyword: 'moisture', name: 'Total Moisture Facial Cream' };

const BLOCKED = ['google-analytics', 'googletagmanager', 'doubleclick', 'facebook', 'hotjar'];

// Pomocna funkcia - z "$29.50" spravi 29.5.
// V kosiku porovnavam ceny ako cisla, nie stringy - inak by "$29.50" vs "29.50 USD"
// rozbilo rovnost.
function parsePrice(text) {
  return parseFloat(text.replace(/[^0-9.]/g, ''));
}

test.describe('Cart with multiple items', () => {
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

  test('add two products, change qty, remove one', async ({ page }) => {
    const home = new HomePage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);

    // Ceny si zapamatam pre porovnanie s kosikom.
    let priceA = '';
    let priceB = '';

    // ===== Krok 1: Prvy produkt =====
    await test.step(`Add 1st product (${PRODUCT_A.name})`, async () => {
      await home.open();
      // searchAndOpenProduct zvlada aj 1-vysledkove searche, kde obchod
      // automaticky preskoci na detail (bez search results).
      await home.searchAndOpenProduct(PRODUCT_A.keyword, PRODUCT_A.name);
      priceA = await product.getPrice();
      await product.addToCart();
    });

    // ===== Krok 2: Druhy produkt =====
    // Po prvom adde som na cart page - idem znova na home a hladam dalej.
    await test.step(`Add 2nd product (${PRODUCT_B.name})`, async () => {
      await home.open();
      await home.searchAndOpenProduct(PRODUCT_B.keyword, PRODUCT_B.name);
      priceB = await product.getPrice();
      await product.addToCart();
    });

    // ===== Krok 3: Kosik s 2 polozkami =====
    await test.step('Open cart and verify both products are present', async () => {
      await cart.open();

      expect(await cart.getRowsCount()).toBe(2);

      // Overim, ze obidva produkty su v kosiku.
      const nameA = await cart.rowByName(PRODUCT_A.name).locator('td').nth(1).innerText();
      const nameB = await cart.rowByName(PRODUCT_B.name).locator('td').nth(1).innerText();
      expect(nameA).toMatch(new RegExp(PRODUCT_A.name, 'i'));
      expect(nameB).toMatch(new RegExp(PRODUCT_B.name, 'i'));

      // Ceny - porovnavam ciselne (parsePrice), aby format na detaile vs v kosiku
      // nerozbil test.
      expect(parsePrice(await cart.getUnitPriceByName(PRODUCT_A.name))).toBe(parsePrice(priceA));
      expect(parsePrice(await cart.getUnitPriceByName(PRODUCT_B.name))).toBe(parsePrice(priceB));

      // Default mnozstvo po pridani je 1.
      expect(await cart.getQuantityByName(PRODUCT_A.name)).toBe('1');
      expect(await cart.getQuantityByName(PRODUCT_B.name)).toBe('1');
    });

    // ===== Krok 4: Zmena mnozstva =====
    const newQty = 3;

    await test.step(`Change quantity of ${PRODUCT_A.name} to ${newQty}`, async () => {
      await cart.setQuantityByName(PRODUCT_A.name, newQty);

      // Po Update sa cart reloadne.
      expect(await cart.getQuantityByName(PRODUCT_A.name)).toBe(String(newQty));

      // Druheho produktu sa Update nedotkol - mnozstvo by malo zostat 1.
      expect(await cart.getQuantityByName(PRODUCT_B.name)).toBe('1');

      // Najdolezitejsie - line total = unit price * qty.
      // toBeCloseTo(value, 2) toleruje malu odchylku kvoli floating-point matematike
      // (0.1 + 0.2 v JS = 0.30000000000000004). 2 = zaokruhli na 2 desatinne miesta (1 cent).
      const expectedTotal = parsePrice(priceA) * newQty;
      const actualTotal = parsePrice(await cart.getLineTotalByName(PRODUCT_A.name));
      expect(actualTotal).toBeCloseTo(expectedTotal, 2);
    });

    // ===== Krok 5 + 6: Odstranenie druheho produktu =====
    await test.step(`Remove ${PRODUCT_B.name} and verify only ${PRODUCT_A.name} stayed`, async () => {
      await cart.removeByName(PRODUCT_B.name);

      expect(await cart.getRowsCount()).toBe(1);

      // V kosiku ostal iba PRODUCT_A.
      const remainingName = await cart.rowByName(PRODUCT_A.name).locator('td').nth(1).innerText();
      expect(remainingName).toMatch(new RegExp(PRODUCT_A.name, 'i'));

      // Quantity sa nemala zmenit (3 z predchadzajuceho kroku).
      expect(await cart.getQuantityByName(PRODUCT_A.name)).toBe(String(newQty));

      // Line total stale sedi.
      const expectedTotal = parsePrice(priceA) * newQty;
      const actualTotal = parsePrice(await cart.getLineTotalByName(PRODUCT_A.name));
      expect(actualTotal).toBeCloseTo(expectedTotal, 2);
    });
  });
});

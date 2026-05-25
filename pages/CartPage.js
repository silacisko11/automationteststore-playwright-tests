// CartPage = stranka kosika.
// Tabulka kosika ma stlpce: Image, Name, Model, Unit Price, Quantity, Total, Remove.
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class CartPage extends BasePage {
  constructor(page) {
    super(page);

    this.cartTable = page.locator('.contentpanel table').first();

    // Riadky s produktmi. Filtrujem cez "ma input quantity" - tym vyhodim
    // hlavickovy <tr> (ten quantity input nema).
    this.rows = this.cartTable.locator('tbody tr', {
      has: page.locator('input[name*="quantity"]'),
    });

    // Hlaska pri prazdnom kosiku.
    this.emptyMessage = page.locator('.contentpanel', {
      hasText: 'Your shopping cart is empty!',
    });

    // Tlacidlo Update - po zmene quantity ho treba kliknut, inak server nevie o zmene.
    this.updateButton = page.getByRole('button', { name: /update/i });
  }

  async open() {
    await this.page.goto('/index.php?rt=checkout/cart');

    // Pockam, kym sa stranka skutocne nacita - bez tohto by som mohol citat
    // DOM v medzistave a test by bol flaky.
    await this.page.locator('.contentpanel').first().waitFor({ state: 'visible' });
  }

  async getRowsCount() {
    return await this.rows.count();
  }

  // ---- Helpery pre prvy riadok (jednoduchy scenar - 1 produkt v kosiku) ----

  async getProductName() {
    const link = this.rows.first().locator('td').nth(1).locator('a').first();
    return (await link.innerText()).trim();
  }

  async getProductPrice() {
    // Stlpec 3 = Unit Price (0=Image, 1=Name, 2=Model, 3=Unit Price).
    const cell = this.rows.first().locator('td').nth(3);
    return (await cell.innerText()).trim();
  }

  async removeFirstProduct() {
    await this.rows.first().locator('a[href*="remove="]').click();
  }

  // ---- Helpery pre konkretnu polozku podla nazvu (viac produktov v kosiku) ----

  // Najde riadok, ktoreho Name stlpec obsahuje dany text.
  // hasText robi substring match - "Skinsheen" matchne "Skinsheen Bronzer Stick".
  rowByName(name) {
    return this.rows.filter({ hasText: name });
  }

  async getUnitPriceByName(name) {
    return (await this.rowByName(name).locator('td').nth(3).innerText()).trim();
  }

  async getQuantityByName(name) {
    return await this.rowByName(name).locator('input[name*="quantity"]').inputValue();
  }

  async getLineTotalByName(name) {
    // Stlpec 5 = Total (= unit price * quantity).
    return (await this.rowByName(name).locator('td').nth(5).innerText()).trim();
  }

  // Zmeni quantity a klikne Update. Aby som vedel, ze stranka uz reloadla,
  // si zapamatam stary line total a cakam, kym sa zmeni.
  async setQuantityByName(name, qty) {
    const row = this.rowByName(name);
    const input = row.locator('input[name*="quantity"]');
    const lineTotal = row.locator('td').nth(5);

    const oldTotal = (await lineTotal.innerText()).trim();

    await input.fill(String(qty));
    await this.updateButton.click();

    // Auto-retry assertion - caka, kym server vrati novy HTML s prepocitanym totalom.
    await expect(lineTotal).not.toHaveText(oldTotal);
  }

  async removeByName(name) {
    const rowsBefore = await this.rows.count();
    await this.rowByName(name).locator('a[href*="remove="]').click();
    // Cakam, kym pocet riadkov klesne - to je signal, ze remove bol spracovany.
    await expect(this.rows).toHaveCount(rowsBefore - 1);
  }

  async expectEmpty() {
    await expect(this.emptyMessage).toBeVisible();
  }
}

module.exports = { CartPage };

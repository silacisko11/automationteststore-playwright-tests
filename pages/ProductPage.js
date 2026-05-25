// ProductPage = detail jedneho produktu.
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class ProductPage extends BasePage {
  constructor(page) {
    super(page);

    // Nazov produktu - h1 nadpis na stranke.
    this.title = page.getByRole('heading', { level: 1 }).first();

    // Cena - viacero moznych selektorov, lebo niektore produkty maju discount layout.
    this.price = page.locator('.productfilneprice, .productpageprice .oneprice').first();

    // Dostupnost ("In Stock"). Niektore produkty ju nemaju vobec, preto je
    // assert v expectAvailable() tolerantny.
    this.availability = page.locator('.label-success, span.label-warning').first();

    // "Add to Cart" je <a> link, nie <button> - preto getByRole('link').
    this.addToCartBtn = page.getByRole('link', { name: /add to cart/i }).first();
  }

  async getTitle() {
    await expect(this.title).toBeVisible();
    return (await this.title.innerText()).trim();
  }

  async getPrice() {
    await expect(this.price).toBeVisible();
    return (await this.price.innerText()).trim();
  }

  // Soft check - dostupnost overujem len ak label vobec existuje.
  // Niektore produkty na tomto webe stock label nemaju a to je OK.
  async expectAvailable() {
    if ((await this.availability.count()) > 0) {
      await expect(this.availability).toBeVisible();
    }
  }

  // Po kliknuti na "Add to Cart" obchod automaticky redirectne do kosika.
  async addToCart() {
    await this.addToCartBtn.click();
    await this.page.waitForURL(/checkout\/cart/);
  }
}

module.exports = { ProductPage };

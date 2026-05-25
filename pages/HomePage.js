// HomePage = domovska stranka obchodu.
// Dedim z BasePage, takze automaticky mam search input a cart counter.
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class HomePage extends BasePage {
  // Otvori homepage. URL '/' je relativna, baseURL si beriem z playwright.config.js.
  async open() {
    await this.page.goto('/');
    // Pockam na search input - dalej s nim hned pracujem, takze musi byt v DOM.
    await expect(this.searchInput).toBeVisible();
  }
}

module.exports = { HomePage };

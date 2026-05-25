// SearchResultsPage = stranka s vysledkami vyhladavania.
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class SearchResultsPage extends BasePage {
  constructor(page) {
    super(page);

    // Linky na produkty vo vysledkoch.
    // Pozn.: trieda je v HTML s preklepom - "prdocutname" (nie productname).
    this.productLinks = page.locator('a.prdocutname');

    // Hlaska, ktora sa zobrazi pri 0 vysledkoch.
    this.noResults = page.locator('text=There is no product that matches the search criteria.');
  }

  // Overi, ze produkt s danym nazvom je vo vysledkoch.
  async expectProductInResults(name) {
    // Najprv skontrolujem, ze tam NIE je hlaska "no results".
    await expect(this.noResults).toHaveCount(0);
    await expect(this.productLinks.filter({ hasText: name }).first()).toBeVisible();
  }

  // Klikne na produkt a otvori jeho detail.
  async openProduct(name) {
    await this.productLinks.filter({ hasText: name }).first().click();
    await this.page.waitForURL(/product\/product/);
  }

  async getProductCount() {
    return await this.productLinks.count();
  }

  // Negativny scenar - po hladani nezmyslu obchod zobrazi hlasku a 0 produktov.
  async expectNoResults() {
    await expect(this.noResults).toBeVisible();
    await expect(this.productLinks).toHaveCount(0);
  }
}

module.exports = { SearchResultsPage };

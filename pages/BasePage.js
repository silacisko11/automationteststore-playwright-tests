// BasePage = rodicovska trieda pre vsetky stranky.
// Drzim tu prvky a metody, ktore su rovnake na celom webe (hlavicka so search a kosikom).
// Ostatne stranky cez `extends BasePage` zdedia search a cart counter zadarmo.

class BasePage {
  constructor(page) {
    this.page = page;

    // Search input v hlavicke - pouzivam ID, lebo je najstabilnejsie.
    this.searchInput = page.locator('#filter_keyword');

    // Counter poloziek v kosiku v hlavicke (oranzovy badge).
    this.cartCounter = page.locator('ul.topcart span.label.label-orange').first();
  }

  // Vyhladanie cez header search.
  // Stlacam Enter v inpute namiesto klikania na "Go", lebo to tlacidlo je <div>
  // a klik na nom vo Firefoxe obcas neprejde - Enter je stabilnejsi.
  async search(keyword) {
    await this.searchInput.fill(keyword);
    await this.searchInput.press('Enter');
    await this.page.waitForURL(/rt=product\/search/);
  }

  // Search + rovno otvorenie produktu.
  // Pri 1 vysledku obchod automaticky preskoci na detail, pri viacerych ostane
  // na search results - tato metoda zvlada oba pripady.
  async searchAndOpenProduct(keyword, productName) {
    await this.searchInput.fill(keyword);
    await this.searchInput.press('Enter');
    await this.page.waitForURL(/rt=product\/(search|product)/);

    if (this.page.url().includes('rt=product/search')) {
      await this.page
        .locator('a.prdocutname')
        .filter({ hasText: productName })
        .first()
        .click();
      await this.page.waitForURL(/rt=product\/product/);
    }
  }

  // Vrati pocet poloziek v kosiku ako cislo.
  // Ked je counter prazdny, parseInt vrati NaN - vtedy vraciam 0.
  async getCartItemsCount() {
    const text = (await this.cartCounter.innerText()).trim();
    const n = parseInt(text, 10);
    return Number.isNaN(n) ? 0 : n;
  }
}

module.exports = { BasePage };

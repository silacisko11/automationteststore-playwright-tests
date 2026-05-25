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

  // Vyhladanie cez priamu navigaciu na search URL.
  // Povodne som klikal/Enter na search input, ale na Firefoxe v CI sa Enter
  // event nezachytil a formular sa nesubmitoval - test padol na timeout.
  // Priama navigacia na search URL je deterministicka a funguje rovnako
  // vo vsetkych prehliadacoch.
  // waitUntil: 'domcontentloaded' - kvoli route.abort() na 3rd-party trackeroch
  // sa default 'load' event vo Firefoxe nemusi zavolat.
  async search(keyword) {
    const url = `/index.php?rt=product/search&keyword=${encodeURIComponent(keyword)}`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  // Search + rovno otvorenie produktu.
  // Pri 1 vysledku obchod automaticky preskoci na detail, pri viacerych ostane
  // na search results - tato metoda zvlada oba pripady.
  async searchAndOpenProduct(keyword, productName) {
    await this.search(keyword);

    if (this.page.url().includes('rt=product/search')) {
      await this.page
        .locator('a.prdocutname')
        .filter({ hasText: productName })
        .first()
        .click();
      await this.page.waitForURL(/rt=product\/product/, { waitUntil: 'domcontentloaded' });
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

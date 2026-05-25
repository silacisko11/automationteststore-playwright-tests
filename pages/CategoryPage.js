// CategoryPage = stranka kategorie (zoznam produktov + sort dropdown + breadcrumb).
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class CategoryPage extends BasePage {
  constructor(page) {
    super(page);

    // H1 nazov kategorie (napr. "Skincare").
    this.heading = page.getByRole('heading', { level: 1 }).first();

    // Sort dropdown - po zmene sa stranka reloadne s ?sort=... v URL.
    this.sortDropdown = page.locator('select#sort');

    // Linky na produkty v kategorii.
    // Pozn.: kazda karta ma vlastne 2 linky s class "prdocutname" - jeden v
    // <div class="fixed"> (cisty nazov) a jeden popisny (s model number a tabmi).
    // Beriem len ten cisty cez parent .fixed.
    this.productLinks = page.locator('.fixed > .prdocutname');

    // Breadcrumb (Home > Skincare > Eyes).
    this.breadcrumb = page.locator('ul.breadcrumb');
  }

  // Skratka pre Skincare - pouziva ju Uloha 2.
  // Idem priamo na URL namiesto klikania v menu, lebo top menu je hover-only
  // a vo Webkite je to flaky.
  async openSkincare() {
    await this.page.goto('/index.php?rt=product/category&path=43');
    await expect(this.heading).toContainText(/skincare/i);
  }

  // Genericke otvorenie podla path (napr. "43" alebo "43_47" pre subkategoriu).
  async openByPath(path) {
    await this.page.goto(`/index.php?rt=product/category&path=${path}`);
    await expect(this.heading).toBeVisible();
  }

  // Vrati pole textov v breadcrumbe, napr. ['Home', 'Skincare', 'Eyes'].
  async getBreadcrumbItems() {
    const texts = await this.breadcrumb.locator('li').allTextContents();
    return texts.map((t) => t.trim());
  }

  // Klikne na link v breadcrumbe.
  // hasText robi substring match - to staci, lebo polozky sa neprekryvaju.
  async clickBreadcrumb(name) {
    await this.breadcrumb.locator('li a').filter({ hasText: name }).click();
  }

  async getProductCount() {
    return await this.productLinks.count();
  }

  // Vrati nazvy produktov.
  // Pouzivam allTextContents() namiesto innerText() preto, lebo karty maju CSS
  // text-transform: uppercase. innerText by vratil "MOISTURE CREAM",
  // textContent vrati original case ("Moisture Cream").
  async getProductNames() {
    const names = await this.productLinks.allTextContents();
    return names.map((s) => s.trim());
  }

  // Sort dropdown ma onchange handler, ktory submituje formu - po zmene
  // pride navigacia s ?sort=...-ASC v URL.
  // Promise.all = spustim selectOption A SUCASNE cakam na URL change,
  // aby som nezmeskal navigaciu.
  async sortBy(label) {
    await Promise.all([
      this.page.waitForURL(/sort=.+-(ASC|DESC)/),
      this.sortDropdown.selectOption({ label }),
    ]);
  }

  async openProductByName(name) {
    await this.productLinks.filter({ hasText: name }).first().click();
    await this.page.waitForURL(/product\/product/);
  }
}

module.exports = { CategoryPage };

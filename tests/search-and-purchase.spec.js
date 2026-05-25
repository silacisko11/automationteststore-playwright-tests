// Uloha 1 - End-to-end "vyhladaj produkt a kup".
//
// Co overujem:
//   1. Otvorim homepage
//   2. Vyhladam keyword "bronzer"
//   3. Najdem produkt vo vysledkoch
//   4. Otvorim detail
//   5. Overim nazov, cenu, dostupnost
//   6. Pridam do kosika
//   7. Overim, ze kosik ma 1 polozku
//   8. Otvorim kosik a overim nazov + cenu
//   9. Odstranim produkt
//  10. Overim, ze kosik je prazdny

// "test" definuje testovaci pripad, "expect" robi overenia.
// require je ako "import" v Node.js.
const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { SearchResultsPage } = require('../pages/SearchResultsPage');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');

// Konstanty - drzim ich mimo testu, lebo:
//  - keby sa zmenil nazov produktu, je to jedna uprava
//  - test ich pouziva na viacerych miestach (search, detail, cart)
const PRODUCT = 'Skinsheen Bronzer Stick';

// Hladam kratsie slovo "bronzer", nie cely nazov, lebo:
//  - pri PRESNEJ zhode obchod automaticky preskoci na detail (preskoci search results)
//  - ja chcem otestovat aj search results stranku
//  - "bronzer" da viac vysledkov, vratane Skinsheen Bronzer Stick
const KEYWORD = 'bronzer';

// 3rd-party trackery (Analytics, Facebook, Hotjar) blokujem.
// Dovod: nemaju vplyv na user flow, len spomaluju test a obcas timeoutuju.
// Bez nich je test rychlejsi a deterministickejsi.
const BLOCKED = [
  'google-analytics',
  'googletagmanager',
  'doubleclick',
  'facebook',
  'hotjar',
];

test.describe('Search and purchase flow', () => {
  // beforeEach sa spusti pred kazdym testom - tu zariadim sietove blokovanie.
  test.beforeEach(async ({ page }) => {
    // page.route() = interceptor: kazdy request prejde cez moju funkciu,
    // ja rozhodnem ci ho pustit (continue) alebo zablokovat (abort).
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (BLOCKED.some((h) => url.includes(h))) {
        return route.abort();
      }
      return route.continue();
    });
  });

  // Vycistim route handlere pred tear-down kontextu - inak hrozi timeout
  // pri zatvarani prehliadaca kvoli pending requestom.
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('user can search, add and remove a product', async ({ page }) => {
    // POM instancie. Vsetky zdielaju ten isty `page`, takze klik v jednom POMe
    // je viditelny v dalsom (manipuluju s tym istym prehliadacom).
    const home = new HomePage(page);
    const results = new SearchResultsPage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);

    // ===== Krok 1: Homepage =====
    // test.step rozdeli test na pomenovane casti - v reporte to vidno
    // ako pekny strom a ked nieco padne, presne vies, kde to padlo.
    await test.step('Open homepage', async () => {
      await home.open();
      // Title musi obsahovat "automation" (case-insensitive).
      // Auto-retry zabudovane v expect(page) - pocka kym title splni pattern.
      await expect(page).toHaveTitle(/automation/i);
    });

    // ===== Krok 2: Search =====
    await test.step(`Search for "${KEYWORD}" and find ${PRODUCT}`, async () => {
      await home.search(KEYWORD);
      // Overi: NIE je tam "no results" hlaska a produkt je viditelny vo vysledkoch.
      await results.expectProductInResults(PRODUCT);
    });

    // Cenu zdielam medzi krokmi (detail vs cart). `let` lebo neskor priradim.
    let productPrice = '';

    // ===== Krok 3: Detail produktu =====
    await test.step('Open product detail and verify name, price, availability', async () => {
      await results.openProduct(PRODUCT);

      const title = await product.getTitle();
      productPrice = await product.getPrice();

      // Title moze obsahovat aj model number v zatvorke (napr. "Skinsheen Bronzer Stick (558003)"),
      // preto pouzivam toContain, nie striktnu rovnost.
      expect(title.toLowerCase()).toContain(PRODUCT.toLowerCase());

      // Cena musi byt vo formate $X alebo $X.XX.
      expect(productPrice).toMatch(/\$\d+(\.\d{2})?/);

      await product.expectAvailable();
    });

    // ===== Krok 4: Pridanie do kosika =====
    await test.step('Add product to cart', async () => {
      await product.addToCart();
      // Po pridani sa stranka redirectne do kosika a counter v hlavicke ukazuje 1.
      expect(await product.getCartItemsCount()).toBe(1);
    });

    // ===== Krok 5: Overenie kosika =====
    await test.step('Open cart and verify product details', async () => {
      await cart.open();

      // toBeGreaterThanOrEqual(1) - viac ako alebo rovne 1 (defenzivne).
      expect(await cart.getRowsCount()).toBeGreaterThanOrEqual(1);

      const nameInCart = await cart.getProductName();
      expect(nameInCart.toLowerCase()).toContain(PRODUCT.toLowerCase());

      // Cena v kosiku sa moze formatovat inak ako na detaile ("$30.00" vs "30.00"),
      // preto porovnavam len ciselnu cast (replace odstrani $ a medzery).
      const priceInCart = await cart.getProductPrice();
      const numeric = productPrice.replace(/[^0-9.]/g, '');
      expect(priceInCart).toContain(numeric);
    });

    // ===== Krok 6: Odstranenie produktu =====
    await test.step('Remove product and verify empty cart', async () => {
      await cart.removeFirstProduct();
      // expectEmpty pouziva auto-retry assertion - caka na hlasku "cart is empty".
      await cart.expectEmpty();
      expect(await cart.getCartItemsCount()).toBe(0);
    });
  });
});

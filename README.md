# Automation Test Store - Playwright tests

E2E UI testy pre [automationteststore.com](https://automationteststore.com/).
Napisane v **Playwright + JavaScript** so strukturou **Page Object Model**.

## Stack

- Playwright Test `^1.48`
- Node.js `>=18`

## Struktura projektu

```
.
├── .github/workflows/playwright.yml   # CI - bezi na push/PR
├── pages/                             # POM triedy
│   ├── BasePage.js
│   ├── HomePage.js
│   ├── SearchResultsPage.js
│   ├── ProductPage.js
│   ├── CartPage.js
│   └── CategoryPage.js
├── tests/
│   ├── search-and-purchase.spec.js    # Uloha 1 - End-to-end nakup
│   ├── category-and-filter.spec.js    # Uloha 2 - Kategoria + sort
│   ├── multi-item-cart.spec.js        # Uloha 3 - Kosik s viacerymi polozkami
│   ├── breadcrumb-navigation.spec.js  # Uloha 4 - Breadcrumb a URL
│   ├── empty-search-results.spec.js   # Uloha 5 - Negativny scenar
│   └── testovaci.spec.js              # Cvicny smoke test (bez POM)
├── playwright.config.js
├── package.json
└── README.md
```

## Instalacia

```bash
git clone https://github.com/<user>/automationteststore-playwright-tests.git
cd automationteststore-playwright-tests
npm install
npx playwright install
```

`npm install` stiahne Playwright. `npx playwright install` stiahne binarky
prehliadacov (Chromium, Firefox, WebKit). Na Linuxe doplnit `--with-deps`.

## Spustenie testov

| Prikaz | Co robi |
| --- | --- |
| `npm test` | Cela suita na vsetkych 3 prehliadacoch (headless) |
| `npm run test:headed` | To iste, ale s viditelnym oknom |
| `npm run test:ui` | Playwright UI mode - na lokalne ladenie |
| `npm run test:chromium` | Iba Chromium |
| `npm run test:firefox` | Iba Firefox |
| `npm run test:webkit` | Iba WebKit |
| `npm run report` | Otvori posledny HTML report |
| `npm run codegen` | Spusti Playwright codegen proti obchodu |

## Reporty

Po behu sa v `playwright-report/` vygeneruje HTML report. Otvor cez:

```bash
npm run report
```

Pri zlyhani report obsahuje screenshot, video aj trace (timeline + DOM + network).

## Implementovane scenare

### Uloha 1 - Search and purchase
Subor: `tests/search-and-purchase.spec.js`

1. Otvorim homepage
2. Vyhladam keyword "bronzer"
3. Overim, ze produkt "Skinsheen Bronzer Stick" je vo vysledkoch
4. Otvorim detail produktu
5. Overim nazov, cenu a dostupnost
6. Pridam do kosika
7. Overim, ze kosik ma 1 polozku
8. Otvorim kosik a overim nazov + cenu
9. Odstranim produkt
10. Overim, ze je kosik prazdny

### Uloha 2 - Category and filtering
Subor: `tests/category-and-filter.spec.js`

1. Otvorim kategoriu Skincare
2. Overim, ze sa zobrazi zoznam produktov
3. Pouzijem filter Sort By -> "Name A - Z"
4. Overim, ze produkty su zoradene abecedne (cez `localeCompare`)
5. Otvorim produkt a overim, ze nazov v detaile sa zhoduje s nazvom v liste

### Uloha 3 - Cart with multiple items
Subor: `tests/multi-item-cart.spec.js`

1. Pridam dva rozne produkty (Skinsheen Bronzer Stick + Total Moisture Facial Cream)
2. Overim nazvy, unit ceny a pociatocne mnozstva (=1)
3. Zmenim mnozstvo prveho produktu na 3
4. Overim prepocet line total = unit_price * 3 (toleruje floating-point)
5. Odstranim druhy produkt
6. Overim, ze v kosiku ostal iba prvy s qty=3 a spravnou sumou

### Uloha 4 - Breadcrumb and URL navigation
Subor: `tests/breadcrumb-navigation.spec.js`

1. Otvorim parent kategoriu Skincare (path=43) a zaznamenam zoznam produktov
2. Otvorim podkategoriu Eyes (path=43_47)
3. Overim URL pattern (`path=43_47`)
4. Overim breadcrumb: `Home > Skincare > Eyes`
5. Cez breadcrumb sa vratim na Skincare
6. Overim, ze produkty sa zhoduju s povodnym zoznamom

Pozn.: Zadanie spomina kategoriu "Cosmetics", ta na automationteststore.com
neexistuje - pouzivam Skincare > Eyes ako reprezentativny pripad.

### Uloha 5 - Empty search results (negativny scenar)
Subor: `tests/empty-search-results.spec.js`

1. Najprv vyhladam realne slovo ("bronzer") - sanity check, ze obchod funguje
2. Vyhladam neexistujuce slovo ("qwertynonsensesuperproduct123")
3. Overim, ze sa zobrazi hlaska "There is no product..."
4. Overim, ze ziadne produkty (ani stare z kroku 1) nie su v DOM-e
5. Overim vizualnu konzistenciu - hlavicka, search box, breadcrumb su stale tam
   (= obchod chybu spracoval graceful, neukoncil sa s 500 errorom)

## Stabilita

- Ziadne `waitForTimeout` - vsetko cez web-first asserty (`expect(locator).toBeVisible()`)
- Blokovanie 3rd-party requestov (Google Analytics, Facebook, Hotjar) v `beforeEach`
- `trace: 'on-first-retry'` - pri chybe full debug
- `retries: 2` v CI absorbuje sietove vypadky
- Kazdy test ma cisty `page` fixture, ziadny zdielany stav

## CI/CD

GitHub Actions workflow `.github/workflows/playwright.yml` spusta cely
suite pri kazdom push/PR do `main` a uploadne HTML report ako artefakt
na 14 dni.

## Troubleshooting

- **`browserType.launch: Executable doesn't exist`** - spusti `npx playwright install`.
- **WebKit padá pri inštalacii na Windows (`EPERM`)** - znamy file-lock issue, skus iba chromium/firefox.
- **`Cannot establish database connection`** na automationteststore.com - demo web ma obcas vypadky, daj pauzu a skus znova.
- **`UNABLE_TO_VERIFY_LEAF_SIGNATURE`** - firemny proxy s vlastnou CA. PowerShell: `$env:NODE_OPTIONS="--use-system-ca"; npm install`.

Dobrý deň,
posielam Vám odkaz na môj GitHub repozitár - https://github.com/silacisko11/automationteststore-playwright-tests

Teším na náš dnešný pohovor a stretnutie.
Prajem pekný deň,
Petrovič
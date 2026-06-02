// ─────────────────────────────────────────────────────────────────────────────
//  EDIT-ME CONFIG: markets, currencies and price points
//
//  This is the single place to update prices, electricity rates and the currency
//  list. Everything in the app (cost estimator, shopping list, projects, PDF)
//  reads from here, so updating a number here updates it everywhere.
//
//  ⚠️  The GHS figures below are PLACEHOLDERS — verify against local data (see the
//      "Where to source real numbers" notes in README) before relying on them.
// ─────────────────────────────────────────────────────────────────────────────

export type CurrencyCode = 'USD' | 'GHS';

export type Market = {
  code: CurrencyCode;
  label: string; // shown in the currency selector
  locale: string; // for Intl number/currency formatting
  symbol: string; // short symbol for inline labels

  // Default cost assumptions (in this market's own currency)
  fixtureUnitPrice: number; // typical price for one quality LED fixture
  hardwareCost: number; // wiring, boxes, dimmer, connectors per room
  installCostPerFixture: number; // professional labour per fixture
  electricityRate: number; // price per kWh

  // Shopping-list "from–to" ranges (per fixture, plus per-room hardware)
  fixturePriceLow: number;
  fixturePriceHigh: number;
  hardwareLow: number;
  hardwareHigh: number;
};

export const MARKETS: Record<CurrencyCode, Market> = {
  USD: {
    code: 'USD',
    label: 'International (USD)',
    locale: 'en-US',
    symbol: '$',
    fixtureUnitPrice: 35,
    hardwareCost: 80,
    installCostPerFixture: 90,
    electricityRate: 0.17,
    fixturePriceLow: 20,
    fixturePriceHigh: 50,
    hardwareLow: 40,
    hardwareHigh: 100,
  },
  // TODO: verify all GHS figures against current Ghana market + ECG/PURC tariffs.
  GHS: {
    code: 'GHS',
    label: 'Ghana (GHS)',
    locale: 'en-GH',
    symbol: 'GH₵',
    fixtureUnitPrice: 450,
    hardwareCost: 1000,
    installCostPerFixture: 700,
    electricityRate: 1.6,
    fixturePriceLow: 250,
    fixturePriceHigh: 700,
    hardwareLow: 500,
    hardwareHigh: 1300,
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

export function getMarket(code: CurrencyCode): Market {
  return MARKETS[code] ?? MARKETS[DEFAULT_CURRENCY];
}

// Format a numeric amount in a market's currency (e.g. "$1,250" / "GH₵18,400").
export function formatMoney(value: number, market: Market): string {
  try {
    return new Intl.NumberFormat(market.locale, {
      style: 'currency',
      currency: market.code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${market.symbol}${value.toLocaleString()}`;
  }
}

// Material cost "from–to" range for a fixture count, in the market's currency.
export function fixtureCostRange(fixtures: number, market: Market): { low: number; high: number } {
  return {
    low: fixtures * market.fixturePriceLow + market.hardwareLow,
    high: fixtures * market.fixturePriceHigh + market.hardwareHigh,
  };
}

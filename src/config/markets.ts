// ─────────────────────────────────────────────────────────────────────────────
//  EDIT-ME CONFIG: markets, currencies and price points
//
//  This is the single place to update prices, electricity rates and the currency
//  list. Everything in the app (cost estimator, shopping list, projects, PDF)
//  reads from here, so updating a number here updates it everywhere.
//
//  Figures are dated June 2026 from market research (claude.md / gemini.md):
//  GHS from Jumia/Melcom/Supply Master + PURC tariffs; USD from EIA + US retail.
//  Both markets are priced independently, no GHS↔USD exchange rate is applied.
// ─────────────────────────────────────────────────────────────────────────────

export type CurrencyCode = 'USD' | 'GHS';

export type Market = {
  code: CurrencyCode;
  label: string; // shown in the currency selector
  locale: string; // for Intl number/currency formatting
  symbol: string; // short symbol for inline labels

  // Default cost assumptions (in this market's own currency). Per-fixture prices
  // now live on each fixture in the catalogue; these are the room-level globals.
  hardwareCost: number; // wiring, boxes, dimmer, connectors per room
  installCostPerFixture: number; // professional labour per fixture
  electricityRate: number; // price per kWh

  // Shopping-list per-room hardware "from–to" range.
  hardwareLow: number;
  hardwareHigh: number;
};

export const MARKETS: Record<CurrencyCode, Market> = {

  // June 2026 research (claude.md / gemini.md). electricityRate uses PURC's
  // Q3 2026 residential 0–300 kWh band (effective 1 Jul 2026); install is the
  // per-fixture fitting rate (DirectWayz Accra, GH₵80–200). Re-pull quarterly.
  GHS: {
    code: 'GHS',
    label: 'Ghana (GHS)',
    locale: 'en-GH',
    symbol: 'GH₵',
    hardwareCost: 450,
    installCostPerFixture: 130,
    electricityRate: 2.04,
    hardwareLow: 200,
    hardwareHigh: 1100,
  },
  // June 2026 research. electricityRate = EIA 2026 US residential average
  // (~18¢/kWh); install = mid of $50–250 finish labour. Re-pull twice a year.
  USD: {
    code: 'USD',
    label: 'International (USD)',
    locale: 'en-US',
    symbol: '$',
    hardwareCost: 100,
    installCostPerFixture: 150,
    electricityRate: 0.18,
    hardwareLow: 50,
    hardwareHigh: 225,
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'GHS';

export function getMarket(code: CurrencyCode): Market {
  return MARKETS[code] ?? MARKETS[DEFAULT_CURRENCY];
}

// Runtime overrides (e.g. edited in /admin) merged over the built-in defaults.
export type MarketOverrides = Partial<Record<CurrencyCode, Partial<Market>>>;

export function mergeMarkets(
  base: Record<CurrencyCode, Market>,
  overrides?: MarketOverrides
): Record<CurrencyCode, Market> {
  if (!overrides) return base;
  const out = {} as Record<CurrencyCode, Market>;
  (Object.keys(base) as CurrencyCode[]).forEach((code) => {
    // `code` is kept from the base so it can never be corrupted by an edit.
    out[code] = { ...base[code], ...(overrides[code] || {}), code };
  });
  return out;
}

const NUMERIC_FIELDS: (keyof Market)[] = [
  'hardwareCost',
  'installCostPerFixture',
  'electricityRate',
  'hardwareLow',
  'hardwareHigh',
];

// Validate a parsed markets object before accepting it as overrides.
// Returns an error string, or null when valid.
export function validateMarkets(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return 'Top level must be an object keyed by currency code.';
  const obj = value as Record<string, unknown>;
  const codes = Object.keys(MARKETS);
  for (const key of Object.keys(obj)) {
    if (!codes.includes(key)) return `Unknown currency code "${key}". Allowed: ${codes.join(', ')}.`;
    const m = obj[key] as Record<string, unknown>;
    if (typeof m !== 'object' || m === null) return `"${key}" must be an object.`;
    for (const f of NUMERIC_FIELDS) {
      if (!(f in m)) return `"${key}" is missing "${f}".`;
      if (typeof m[f] !== 'number' || !isFinite(m[f] as number) || (m[f] as number) < 0)
        return `"${key}.${String(f)}" must be a non-negative number.`;
    }
    if (typeof m.symbol !== 'string') return `"${key}.symbol" must be a string.`;
    if (typeof m.locale !== 'string') return `"${key}.locale" must be a string.`;
    if (typeof m.label !== 'string') return `"${key}.label" must be a string.`;
  }
  return null;
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

// PDF-safe money formatting. react-pdf's built-in Helvetica only covers Latin-1,
// so symbols like the Ghana cedi (₵, U+20B5) render as a missing box. For any
// market whose symbol has a non-Latin-1 character, fall back to the ISO code
// (e.g. "GHS 1,234"); markets with an ASCII symbol (e.g. "$") keep the symbol.
export function formatMoneyAscii(value: number, market: Market): string {
  const asciiSafe = /^[\x20-\xFF]*$/.test(market.symbol);
  try {
    return new Intl.NumberFormat(market.locale, {
      style: 'currency',
      currency: market.code,
      currencyDisplay: asciiSafe ? 'narrowSymbol' : 'code',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return asciiSafe
      ? `${market.symbol}${value.toLocaleString()}`
      : `${market.code} ${value.toLocaleString()}`;
  }
}

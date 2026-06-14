import { CalculationResult, FixtureItem } from '@/types';
import { CurrencyCode, Market } from '@/config/markets';
import {
  getActiveFixtures,
  resolveFixture,
  fixturePrice,
  fixturePriceRange,
} from './fixtureCatalog';

// Centralised cost helpers. Material cost is now per-fixture (from the catalogue),
// while per-room hardware and labour stay global (markets). Contexts that only
// know a fixture COUNT (e.g. project rooms) fall back to a representative price
// averaged across the active catalogue.

export type CostRange = { low: number; high: number };

function representativePrice(currency: CurrencyCode): number {
  const fixtures = getActiveFixtures();
  if (!fixtures.length) return 0;
  const sum = fixtures.reduce((s, f) => s + fixturePrice(f, currency), 0);
  return sum / fixtures.length;
}

function representativeRange(currency: CurrencyCode): [number, number] {
  const fixtures = getActiveFixtures();
  if (!fixtures.length) return [0, 0];
  const lows = fixtures.map((f) => fixturePriceRange(f, currency)[0]);
  const highs = fixtures.map((f) => fixturePriceRange(f, currency)[1]);
  return [lows.reduce((a, b) => a + b, 0) / lows.length, highs.reduce((a, b) => a + b, 0) / highs.length];
}

function priceForId(id: string, currency: CurrencyCode): number {
  const f = resolveFixture(id);
  return f ? fixturePrice(f, currency) : representativePrice(currency);
}

function rangeForId(id: string, currency: CurrencyCode): [number, number] {
  const f = resolveFixture(id);
  return f ? fixturePriceRange(f, currency) : representativeRange(currency);
}

// Total fixture material cost for an explicit breakdown.
export function fixtureItemsMaterial(items: FixtureItem[], currency: CurrencyCode): number {
  return items.reduce((s, it) => s + it.quantity * priceForId(it.id, currency), 0);
}

// Fixture-only material cost for a result: exact when fixtureItems is present,
// else a representative estimate from the fixture count.
export function resultFixtureMaterial(result: CalculationResult, currency: CurrencyCode): number {
  if (result.fixtureItems?.length) return fixtureItemsMaterial(result.fixtureItems, currency);
  return result.numberOfFixtures * representativePrice(currency);
}

// Fixtures-only "from–to" range for a breakdown OR a bare count (no hardware).
export function fixturesOnlyRange(source: FixtureItem[] | number, currency: CurrencyCode): CostRange {
  let low = 0;
  let high = 0;
  if (Array.isArray(source)) {
    for (const it of source) {
      const [l, h] = rangeForId(it.id, currency);
      low += it.quantity * l;
      high += it.quantity * h;
    }
  } else {
    const [l, h] = representativeRange(currency);
    low = source * l;
    high = source * h;
  }
  return { low: Math.round(low), high: Math.round(high) };
}

// Shopping "from–to" range for a fixture breakdown OR a bare count, plus the
// per-room hardware range from the market.
export function fixtureRange(
  source: FixtureItem[] | number,
  currency: CurrencyCode,
  market: Market
): CostRange {
  const fixtures = fixturesOnlyRange(source, currency);
  return {
    low: Math.round(fixtures.low + market.hardwareLow),
    high: Math.round(fixtures.high + market.hardwareHigh),
  };
}

// Convenience: the room cost range for a project room (fixture mix if known, else count).
export function roomCostRange(
  fixtureItems: FixtureItem[] | undefined,
  count: number,
  currency: CurrencyCode,
  market: Market
): CostRange {
  return fixtureRange(fixtureItems?.length ? fixtureItems : count, currency, market);
}

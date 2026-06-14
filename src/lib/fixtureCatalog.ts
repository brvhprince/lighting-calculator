import { FixtureCategory, FixtureDef } from '@/types';
import { CurrencyCode, MARKETS } from '@/config/markets';
import { BUILTIN_FIXTURES } from './fixtureTypes';

// Persisted shape in Setting('fixtures'). `items` is the admin's authoritative
// catalogue (edited built-ins + additions); it is merged over the built-ins.
export type FixtureStore = { items: FixtureDef[] };

const FIXTURE_CATEGORIES: FixtureCategory[] = [
  'recessed',
  'pendant',
  'track',
  'linear',
  'sconce',
  'strip',
];

// Validate a parsed fixtures store before accepting it. Returns an error string,
// or null when valid. Shared by the API route (server) and admin editor (client).
export function validateFixtures(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return 'Top level must be an object.';
  const store = value as Record<string, unknown>;
  if (!Array.isArray(store.items)) return '"items" must be an array.';
  const codes = Object.keys(MARKETS) as CurrencyCode[];
  const seen = new Set<string>();
  for (const raw of store.items) {
    if (typeof raw !== 'object' || raw === null) return 'Each fixture must be an object.';
    const f = raw as Record<string, unknown>;
    if (typeof f.id !== 'string' || !f.id.trim()) return 'Each fixture needs a non-empty "id".';
    if (seen.has(f.id)) return `Duplicate fixture id "${f.id}".`;
    seen.add(f.id);
    if (typeof f.name !== 'string' || !f.name.trim()) return `"${f.id}" needs a "name".`;
    if (!FIXTURE_CATEGORIES.includes(f.category as FixtureCategory))
      return `"${f.id}" has an invalid category. Allowed: ${FIXTURE_CATEGORIES.join(', ')}.`;
    const lm = f.typicalLumens as Record<string, unknown> | undefined;
    if (!lm || typeof lm !== 'object') return `"${f.id}" needs typicalLumens.`;
    for (const k of ['min', 'max', 'recommended']) {
      if (typeof lm[k] !== 'number' || !isFinite(lm[k] as number) || (lm[k] as number) < 0)
        return `"${f.id}.typicalLumens.${k}" must be a non-negative number.`;
    }
    if (typeof f.price !== 'object' || f.price === null) return `"${f.id}" needs a "price" object.`;
    const price = f.price as Record<string, unknown>;
    const hasOne = codes.some((c) => typeof price[c] === 'number');
    if (!hasOne) return `"${f.id}.price" needs at least one currency (${codes.join(', ')}).`;
    for (const c of Object.keys(price)) {
      if (!codes.includes(c as CurrencyCode)) return `"${f.id}.price" has unknown currency "${c}".`;
      if (typeof price[c] !== 'number' || (price[c] as number) < 0)
        return `"${f.id}.price.${c}" must be a non-negative number.`;
    }
  }
  return null;
}

// Runtime fixture registry. Defaults to the built-in catalogue so the app works
// synchronously (SSR, first paint, offline). FixturesProvider hydrates this with
// the admin-edited catalogue on load via setFixtureCatalog(). Pure libs
// (calculator, layered/advanced) read from here instead of importing a constant,
// so a single source stays in sync everywhere.

let catalog: FixtureDef[] = BUILTIN_FIXTURES;
let byId: Map<string, FixtureDef> = new Map(BUILTIN_FIXTURES.map((f) => [f.id, f]));

// Merge admin overrides/additions over the built-ins by id (built-ins can be
// edited but never disappear from code). Called by FixturesProvider on load.
export function setFixtureCatalog(items: FixtureDef[]): void {
  const merged = new Map<string, FixtureDef>(BUILTIN_FIXTURES.map((f) => [f.id, f]));
  for (const item of items) {
    const base = merged.get(item.id);
    merged.set(item.id, base ? { ...base, ...item, id: item.id } : { ...item, builtIn: false });
  }
  byId = merged;
  catalog = Array.from(merged.values());
}

export function resetFixtureCatalog(): void {
  catalog = BUILTIN_FIXTURES;
  byId = new Map(BUILTIN_FIXTURES.map((f) => [f.id, f]));
}

// Normalised JSON of the fields that define a fixture, for change detection.
function fingerprint(f: FixtureDef): string {
  return JSON.stringify({
    id: f.id,
    name: f.name,
    category: f.category,
    diameter: f.diameter ?? null,
    diameterMm: f.diameterMm ?? null,
    typicalLumens: f.typicalLumens,
    price: f.price,
    priceRange: f.priceRange ?? null,
    archived: !!f.archived,
  });
}

// Reduce a full working catalogue to just the items worth persisting: custom
// fixtures, plus built-ins that were edited or archived. Built-ins left at their
// defaults are omitted so future code updates to them still flow through.
export function fixtureOverrides(items: FixtureDef[]): FixtureDef[] {
  const builtins = new Map(BUILTIN_FIXTURES.map((f) => [f.id, f]));
  return items.filter((item) => {
    const base = builtins.get(item.id);
    if (!base) return true; // custom fixture
    return fingerprint(base) !== fingerprint(item);
  });
}

// Full catalogue (including archived). Use getActiveFixtures() for pickers.
export function getFixtureCatalog(): FixtureDef[] {
  return catalog;
}

// Non-archived fixtures, for selection UIs.
export function getActiveFixtures(): FixtureDef[] {
  return catalog.filter((f) => !f.archived);
}

export function getFixturesByCategory(category: FixtureDef['category']): FixtureDef[] {
  return getActiveFixtures().filter((f) => f.category === category);
}

// Resolve a fixture id against the effective catalogue (live or archived).
export function resolveFixture(id: string): FixtureDef | undefined {
  return byId.get(id);
}

// Unit price for a fixture in a currency, with sensible fallbacks: the requested
// currency → USD → first defined price → 0.
export function fixturePrice(fixture: FixtureDef, currency: CurrencyCode): number {
  const p = fixture.price ?? {};
  if (typeof p[currency] === 'number') return p[currency] as number;
  if (typeof p.USD === 'number') return p.USD as number;
  const first = Object.values(p).find((v) => typeof v === 'number');
  return typeof first === 'number' ? first : 0;
}

// Shopping "from–to" range for a fixture in a currency. Uses an explicit
// priceRange when set, otherwise derives ±30%/+50% around the unit price.
export function fixturePriceRange(fixture: FixtureDef, currency: CurrencyCode): [number, number] {
  const explicit = fixture.priceRange?.[currency];
  if (explicit) return explicit;
  const unit = fixturePrice(fixture, currency);
  return [Math.round(unit * 0.7), Math.round(unit * 1.5)];
}

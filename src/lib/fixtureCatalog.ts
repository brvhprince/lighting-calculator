import { FixtureCategory, FixtureDef, FixtureSnapshot, FixturePrice } from '@/types';
import { CurrencyCode, MARKETS } from '@/config/markets';
import { BUILTIN_FIXTURES } from './fixtureTypes';

// A fixture resolved for display: a real catalogue entry, or a `missing` ghost
// reconstructed from a saved snapshot when the fixture no longer exists.
export type ResolvedFixture = FixtureDef & { missing?: boolean };

// Persisted shape in Setting('fixtures'). `items` is the admin's authoritative
// catalogue (edited built-ins + additions); it is merged over the built-ins.
export type FixtureStore = { items: FixtureDef[] };

export const FIXTURE_CATEGORIES: FixtureCategory[] = [
  'recessed',
  'flush',
  'pendant',
  'track',
  'linear',
  'undercabinet',
  'sconce',
  'vanity',
  'lamp',
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
    if (f.wattage !== undefined) {
      if (typeof f.wattage !== 'number' || !isFinite(f.wattage as number) || (f.wattage as number) <= 0)
        return `"${f.id}.wattage" must be a positive number when set.`;
    }
  }
  return null;
}

// Efficacy band (lm/W) for the sanity-check guardrail. The cost model assumes
// ~90 lm/W for LED (EFFICACY.led in costEstimator); fixtures far outside this
// band usually mean a mistyped lumen or wattage. Outside the band is flagged,
// never blocked, a save still proceeds.
export const EFFICACY_BAND = { low: 60, high: 130 } as const;

// Non-blocking data-quality warnings for the catalogue. Checks luminous efficacy
// (recommended lumens ÷ wattage) for any active fixture that declares a wattage,
// and returns one human-readable line per flagged fixture.
export function fixtureWarnings(items: FixtureDef[]): string[] {
  const out: string[] = [];
  for (const f of items) {
    if (f.archived) continue;
    const w = f.wattage;
    const lm = f.typicalLumens?.recommended;
    if (typeof w !== 'number' || w <= 0 || typeof lm !== 'number' || lm <= 0) continue;
    const eff = lm / w;
    if (eff < EFFICACY_BAND.low)
      out.push(
        `${f.name}: ${Math.round(eff)} lm/W is unusually low (under ${EFFICACY_BAND.low}), check the wattage or lumens.`
      );
    else if (eff > EFFICACY_BAND.high)
      out.push(
        `${f.name}: ${Math.round(eff)} lm/W is unusually high (over ${EFFICACY_BAND.high}), verify the lumens or wattage.`
      );
  }
  return out;
}

// Runtime fixture registry. Defaults to the built-in catalogue so the app works
// synchronously (SSR, first paint, offline). FixturesProvider hydrates this with
// the admin-edited catalogue on load via setFixtureCatalog(). Pure libs
// (calculator, layered/advanced) read from here instead of importing a constant,
// so a single source stays in sync everywhere.

// The registry is assembled from ordered layers, each winning over the previous
// by id: built-ins (code) < admin overrides (server) < personal fixtures (a
// non-admin user's localStorage catalogue) < design fixtures (transient custom
// and derived/override fixtures referenced by the open layered design). Keeping
// the layers separate means an admin reconcile (setFixtureCatalog) re-merges the
// personal and design layers on top instead of wiping them.
let adminLayer: FixtureDef[] = [];
let personalLayer: FixtureDef[] = [];
let designLayer: FixtureDef[] = [];

let catalog: FixtureDef[] = BUILTIN_FIXTURES;
let byId: Map<string, FixtureDef> = new Map(BUILTIN_FIXTURES.map((f) => [f.id, f]));

function rebuild(): void {
  const merged = new Map<string, FixtureDef>(BUILTIN_FIXTURES.map((f) => [f.id, f]));
  for (const layer of [adminLayer, personalLayer, designLayer]) {
    for (const item of layer) {
      const base = merged.get(item.id);
      merged.set(item.id, base ? { ...base, ...item, id: item.id } : { ...item, builtIn: false });
    }
  }
  byId = merged;
  catalog = Array.from(merged.values());
}

// Set the admin override/addition layer (built-ins can be edited but never
// disappear from code). Called by FixturesProvider on load.
export function setFixtureCatalog(items: FixtureDef[]): void {
  adminLayer = items;
  rebuild();
}

// Clear only the admin layer. Personal and design fixtures stay registered.
export function resetFixtureCatalog(): void {
  adminLayer = [];
  rebuild();
}

// Set the personal-catalogue layer (a non-admin user's reusable custom fixtures).
export function setPersonalFixtures(items: FixtureDef[]): void {
  personalLayer = items;
  rebuild();
}

// Register transient design fixtures (custom + derived/override) so they resolve
// by id everywhere (cost, shopping, PDF) while a design is open. Merges by id;
// does not wipe previously registered design fixtures.
export function registerFixtures(items: FixtureDef[]): void {
  if (!items.length) return;
  const map = new Map(designLayer.map((f) => [f.id, f]));
  for (const it of items) map.set(it.id, it);
  designLayer = Array.from(map.values());
  rebuild();
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
    wattage: f.wattage ?? null,
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

// Resolve for display, falling back to a saved snapshot (then a generic ghost)
// when the fixture is gone, so old designs never render blank or mis-priced.
export function resolveFixtureOrGhost(
  id: string,
  snapshots?: FixtureSnapshot[]
): ResolvedFixture {
  const live = byId.get(id);
  if (live) return live;
  const snap = snapshots?.find((s) => s.id === id);
  if (snap) {
    return {
      id,
      name: snap.name,
      category: snap.category,
      typicalLumens: { min: snap.recommendedLumens, max: snap.recommendedLumens, recommended: snap.recommendedLumens },
      price: snap.price,
      archived: true,
      missing: true,
    };
  }
  return {
    id,
    name: `Discontinued fixture`,
    category: 'recessed',
    typicalLumens: { min: 0, max: 0, recommended: 0 },
    price: {},
    archived: true,
    missing: true,
  };
}

// Build snapshots for a set of fixture ids from the current catalogue.
export function snapshotFixtures(ids: string[]): FixtureSnapshot[] {
  const out: FixtureSnapshot[] = [];
  for (const id of Array.from(new Set(ids))) {
    const f = byId.get(id);
    if (f) {
      out.push({
        id: f.id,
        name: f.name,
        category: f.category,
        recommendedLumens: f.typicalLumens.recommended,
        price: f.price,
      });
    }
  }
  return out;
}

// Any item carrying per-currency pricing (catalogue fixtures, landscape fixtures,
// hardware). The pricing helpers only read these two fields.
export type Priceable = {
  price: FixturePrice;
  priceRange?: Partial<Record<CurrencyCode, [number, number]>>;
};

// Unit price for a priced item in a currency, with sensible fallbacks: the
// requested currency → USD → first defined price → 0.
export function fixturePrice(fixture: Priceable, currency: CurrencyCode): number {
  const p = fixture.price ?? {};
  if (typeof p[currency] === 'number') return p[currency] as number;
  if (typeof p.USD === 'number') return p.USD as number;
  const first = Object.values(p).find((v) => typeof v === 'number');
  return typeof first === 'number' ? first : 0;
}

// Shopping "from-to" range for a priced item in a currency. Uses an explicit
// priceRange when set, otherwise derives ±30%/+50% around the unit price.
export function fixturePriceRange(fixture: Priceable, currency: CurrencyCode): [number, number] {
  const explicit = fixture.priceRange?.[currency];
  if (explicit) return explicit;
  const unit = fixturePrice(fixture, currency);
  return [Math.round(unit * 0.7), Math.round(unit * 1.5)];
}

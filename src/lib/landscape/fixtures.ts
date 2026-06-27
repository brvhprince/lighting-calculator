import { LandscapeCategory, LandscapeFixture, LandscapeSystem } from '@/types/landscape';
import { CurrencyCode } from '@/config/markets';

// Outdoor fixture catalogue. Prices are independent per market (June 2026
// estimates), no GHS<->USD exchange rate applied. CCT is warm 2700K by default,
// which is the residential landscape norm; all are weatherproof (IP65+).
// US anchored to Volt/Kichler/Amazon ranges; GH to Jumia/Melcom/solar imports.
export const BUILTIN_LANDSCAPE_FIXTURES: LandscapeFixture[] = [
  // ---- Low-voltage 12V ----
  {
    id: 'lv-path',
    name: 'Path light (low-voltage)',
    category: 'pathLight',
    system: 'lowvoltage',
    ip: 'IP65',
    typicalLumens: { min: 80, max: 180, recommended: 120 },
    wattage: 4,
    cct: 2700,
    beam: '120°',
    price: { USD: 35, GHS: 190 },
    priceRange: { USD: [18, 70], GHS: [90, 420] },
  },
  {
    id: 'lv-bollard',
    name: 'Bollard (low-voltage)',
    category: 'bollard',
    system: 'lowvoltage',
    ip: 'IP65',
    typicalLumens: { min: 150, max: 350, recommended: 220 },
    wattage: 6,
    cct: 2700,
    beam: '360°',
    price: { USD: 70, GHS: 380 },
    priceRange: { USD: [40, 160], GHS: [180, 900] },
  },
  {
    id: 'lv-well',
    name: 'In-ground well uplight',
    category: 'wellLight',
    system: 'lowvoltage',
    ip: 'IP67',
    typicalLumens: { min: 200, max: 500, recommended: 320 },
    wattage: 6,
    cct: 2700,
    beam: '36°',
    price: { USD: 48, GHS: 270 },
    priceRange: { USD: [25, 95], GHS: [140, 650] },
  },
  {
    id: 'lv-spot',
    name: 'Adjustable spotlight (spike)',
    category: 'spotlight',
    system: 'lowvoltage',
    ip: 'IP65',
    typicalLumens: { min: 200, max: 600, recommended: 350 },
    wattage: 6,
    cct: 2700,
    beam: '24°',
    price: { USD: 40, GHS: 240 },
    priceRange: { USD: [22, 85], GHS: [120, 600] },
  },
  {
    id: 'lv-wallwash',
    name: 'Wall wash (low-voltage)',
    category: 'wallWash',
    system: 'lowvoltage',
    ip: 'IP65',
    typicalLumens: { min: 250, max: 600, recommended: 400 },
    wattage: 8,
    cct: 2700,
    beam: '60°',
    price: { USD: 55, GHS: 300 },
    priceRange: { USD: [30, 110], GHS: [160, 720] },
  },
  {
    id: 'lv-step',
    name: 'Step / deck light (low-voltage)',
    category: 'stepLight',
    system: 'lowvoltage',
    ip: 'IP65',
    typicalLumens: { min: 30, max: 100, recommended: 60 },
    wattage: 2,
    cct: 2700,
    beam: '110°',
    price: { USD: 25, GHS: 130 },
    priceRange: { USD: [12, 50], GHS: [70, 320] },
  },
  {
    id: 'lv-downlight',
    name: 'Downlight / moonlight (tree-mount)',
    category: 'downlight',
    system: 'lowvoltage',
    ip: 'IP65',
    typicalLumens: { min: 200, max: 500, recommended: 300 },
    wattage: 5,
    cct: 2700,
    beam: '60°',
    price: { USD: 60, GHS: 340 },
    priceRange: { USD: [35, 130], GHS: [180, 820] },
  },
  {
    id: 'lv-underwater',
    name: 'Underwater / pond light',
    category: 'underwater',
    system: 'lowvoltage',
    ip: 'IP68',
    typicalLumens: { min: 150, max: 400, recommended: 250 },
    wattage: 6,
    cct: 2700,
    beam: '40°',
    price: { USD: 55, GHS: 320 },
    priceRange: { USD: [30, 120], GHS: [160, 780] },
  },
  {
    id: 'lv-string',
    name: 'String / festoon run (~15 m)',
    category: 'stringLight',
    system: 'lowvoltage',
    ip: 'IP44',
    typicalLumens: { min: 800, max: 1600, recommended: 1200 },
    wattage: 24,
    cct: 2400,
    beam: '360°',
    price: { USD: 40, GHS: 260 },
    priceRange: { USD: [20, 90], GHS: [120, 650] },
  },

  // ---- Line-voltage 230V / 120V ----
  {
    id: 'line-flood',
    name: 'Security floodlight (mains)',
    category: 'floodlight',
    system: 'linevoltage',
    ip: 'IP65',
    typicalLumens: { min: 2000, max: 5000, recommended: 3000 },
    wattage: 30,
    cct: 4000,
    beam: '120°',
    price: { USD: 35, GHS: 180 },
    priceRange: { USD: [15, 90], GHS: [80, 500] },
  },
  {
    id: 'line-wall',
    name: 'Outdoor wall light (mains)',
    category: 'patioLight',
    system: 'linevoltage',
    ip: 'IP54',
    typicalLumens: { min: 400, max: 900, recommended: 600 },
    wattage: 9,
    cct: 2700,
    beam: '120°',
    price: { USD: 45, GHS: 250 },
    priceRange: { USD: [20, 110], GHS: [120, 650] },
  },
  {
    id: 'line-bulkhead',
    name: 'Bulkhead / step light (mains)',
    category: 'stepLight',
    system: 'linevoltage',
    ip: 'IP65',
    typicalLumens: { min: 250, max: 600, recommended: 400 },
    wattage: 8,
    cct: 3000,
    beam: '120°',
    price: { USD: 38, GHS: 210 },
    priceRange: { USD: [18, 80], GHS: [100, 520] },
  },

  // ---- Solar (self-powered, no wiring) ----
  {
    id: 'solar-path',
    name: 'Solar path light',
    category: 'pathLight',
    system: 'solar',
    ip: 'IP65',
    typicalLumens: { min: 40, max: 150, recommended: 100 },
    wattage: 0,
    cct: 3000,
    beam: '120°',
    price: { USD: 12, GHS: 60 },
    priceRange: { USD: [6, 30], GHS: [30, 180] },
  },
  {
    id: 'solar-spot',
    name: 'Solar spotlight / uplight',
    category: 'spotlight',
    system: 'solar',
    ip: 'IP65',
    typicalLumens: { min: 200, max: 600, recommended: 400 },
    wattage: 0,
    cct: 3000,
    beam: '45°',
    price: { USD: 22, GHS: 110 },
    priceRange: { USD: [10, 50], GHS: [50, 300] },
  },
  {
    id: 'solar-flood',
    name: 'Solar security floodlight',
    category: 'floodlight',
    system: 'solar',
    ip: 'IP66',
    typicalLumens: { min: 800, max: 2500, recommended: 1500 },
    wattage: 0,
    cct: 6000,
    beam: '120°',
    price: { USD: 28, GHS: 150 },
    priceRange: { USD: [12, 70], GHS: [60, 400] },
  },
  {
    id: 'solar-wall',
    name: 'Solar wall light',
    category: 'patioLight',
    system: 'solar',
    ip: 'IP65',
    typicalLumens: { min: 150, max: 500, recommended: 300 },
    wattage: 0,
    cct: 3000,
    beam: '120°',
    price: { USD: 18, GHS: 95 },
    priceRange: { USD: [8, 45], GHS: [45, 260] },
  },
  {
    id: 'solar-step',
    name: 'Solar deck / step light',
    category: 'stepLight',
    system: 'solar',
    ip: 'IP65',
    typicalLumens: { min: 15, max: 60, recommended: 40 },
    wattage: 0,
    cct: 3000,
    beam: '110°',
    price: { USD: 10, GHS: 55 },
    priceRange: { USD: [5, 25], GHS: [25, 150] },
  },
  {
    id: 'solar-string',
    name: 'Solar string lights (~10 m)',
    category: 'stringLight',
    system: 'solar',
    ip: 'IP44',
    typicalLumens: { min: 300, max: 900, recommended: 600 },
    wattage: 0,
    cct: 2400,
    beam: '360°',
    price: { USD: 18, GHS: 90 },
    priceRange: { USD: [8, 40], GHS: [40, 250] },
  },
];

export const LANDSCAPE_CATEGORIES: LandscapeCategory[] = [
  'pathLight',
  'bollard',
  'wellLight',
  'spotlight',
  'wallWash',
  'stepLight',
  'deckLight',
  'floodlight',
  'stringLight',
  'underwater',
  'downlight',
  'patioLight',
];

export const LANDSCAPE_SYSTEMS: (LandscapeSystem | 'any')[] = [
  'lowvoltage',
  'linevoltage',
  'solar',
  'any',
];

// Runtime registry: built-ins merged with the admin's overrides/additions by id.
// FixturesProvider hydrates this with setLandscapeFixtures() on load, mirroring
// the indoor catalogue. Built-ins are tagged builtIn so they cannot be deleted.
let catalog: LandscapeFixture[] = BUILTIN_LANDSCAPE_FIXTURES.map((f) => ({ ...f, builtIn: true }));
let byId = new Map(catalog.map((f) => [f.id, f]));

function rebuild(items: LandscapeFixture[]): void {
  const merged = new Map<string, LandscapeFixture>(
    BUILTIN_LANDSCAPE_FIXTURES.map((f) => [f.id, { ...f, builtIn: true }])
  );
  for (const item of items) {
    const base = merged.get(item.id);
    merged.set(item.id, base ? { ...base, ...item, id: item.id, builtIn: true } : { ...item, builtIn: false });
  }
  byId = merged;
  catalog = Array.from(merged.values());
}

export function setLandscapeFixtures(items: LandscapeFixture[]): void {
  rebuild(items);
}

export function resetLandscapeFixtures(): void {
  rebuild([]);
}

// Full catalogue (including archived). Use getActiveLandscapeFixtures() for selection.
export function getLandscapeFixtures(): LandscapeFixture[] {
  return catalog;
}

export function getActiveLandscapeFixtures(): LandscapeFixture[] {
  return catalog.filter((f) => !f.archived);
}

export function resolveLandscapeFixture(id: string): LandscapeFixture | undefined {
  return byId.get(id);
}

// Pick the best fixture for a technique's acceptable categories under a system.
// Prefers an exact system match, then a system-agnostic fixture, then any
// fixture in the category (flagged via `substituted` so the UI can note it).
export function selectLandscapeFixture(
  categories: LandscapeCategory[],
  system: LandscapeSystem
): { fixture: LandscapeFixture; substituted: boolean } | undefined {
  const active = getActiveLandscapeFixtures();
  for (const cat of categories) {
    const inCat = active.filter((f) => f.category === cat);
    const exact = inCat.find((f) => f.system === system || f.system === 'any');
    if (exact) return { fixture: exact, substituted: false };
  }
  // Fallback: any fixture in any acceptable category, even if its system differs.
  for (const cat of categories) {
    const any = active.find((f) => f.category === cat);
    if (any) return { fixture: any, substituted: true };
  }
  return undefined;
}

// Normalised JSON of the fields that define a landscape fixture, for diffing.
function fingerprint(f: LandscapeFixture): string {
  return JSON.stringify({
    id: f.id,
    name: f.name,
    category: f.category,
    system: f.system,
    ip: f.ip,
    typicalLumens: f.typicalLumens,
    wattage: f.wattage,
    cct: f.cct,
    beam: f.beam ?? null,
    price: f.price,
    priceRange: f.priceRange ?? null,
    archived: !!f.archived,
  });
}

// Reduce a working catalogue to just what is worth persisting: custom fixtures,
// plus built-ins that were edited or archived. Unchanged built-ins are omitted
// so future code updates to them still flow through.
export function landscapeOverrides(items: LandscapeFixture[]): LandscapeFixture[] {
  const builtins = new Map(BUILTIN_LANDSCAPE_FIXTURES.map((f) => [f.id, f]));
  return items
    .filter((item) => {
      const base = builtins.get(item.id);
      if (!base) return true;
      return fingerprint({ ...base, builtIn: true }) !== fingerprint(item);
    })
    .map(({ builtIn, ...rest }) => rest as LandscapeFixture); // drop the runtime flag
}

// Validate a parsed landscape fixtures store. Returns an error string or null.
export function validateLandscapeFixtures(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return 'Top level must be an object.';
  const store = value as Record<string, unknown>;
  if (!Array.isArray(store.items)) return '"items" must be an array.';
  const seen = new Set<string>();
  for (const raw of store.items) {
    if (typeof raw !== 'object' || raw === null) return 'Each fixture must be an object.';
    const f = raw as Record<string, unknown>;
    if (typeof f.id !== 'string' || !f.id.trim()) return 'Each fixture needs a non-empty "id".';
    if (seen.has(f.id)) return `Duplicate fixture id "${f.id}".`;
    seen.add(f.id);
    if (typeof f.name !== 'string' || !f.name.trim()) return `"${f.id}" needs a "name".`;
    if (!LANDSCAPE_CATEGORIES.includes(f.category as LandscapeCategory))
      return `"${f.id}" has an invalid category.`;
    if (!LANDSCAPE_SYSTEMS.includes(f.system as LandscapeSystem | 'any'))
      return `"${f.id}" has an invalid system.`;
    if (typeof f.ip !== 'string' || !f.ip.trim()) return `"${f.id}" needs an "ip" rating.`;
    const lm = f.typicalLumens as Record<string, unknown> | undefined;
    if (!lm || typeof lm !== 'object') return `"${f.id}" needs typicalLumens.`;
    for (const k of ['min', 'max', 'recommended']) {
      if (typeof lm[k] !== 'number' || !isFinite(lm[k] as number) || (lm[k] as number) < 0)
        return `"${f.id}.typicalLumens.${k}" must be a non-negative number.`;
    }
    if (typeof f.wattage !== 'number' || !isFinite(f.wattage as number) || (f.wattage as number) < 0)
      return `"${f.id}.wattage" must be a non-negative number.`;
    if (typeof f.cct !== 'number' || !isFinite(f.cct as number) || (f.cct as number) <= 0)
      return `"${f.id}.cct" must be a positive number.`;
    if (typeof f.price !== 'object' || f.price === null) return `"${f.id}" needs a "price" object.`;
  }
  return null;
}

export type LandscapeFixtureStore = { items: LandscapeFixture[] };

// Low-voltage transformer options (VA) and their per-market price. Sized to run
// the fixture load at <= 80% capacity.
export const TRANSFORMER_SIZES_VA = [150, 300, 600, 900] as const;

export const TRANSFORMER_PRICE: Record<number, Partial<Record<CurrencyCode, number>>> = {
  150: { USD: 80, GHS: 700 },
  300: { USD: 120, GHS: 1100 },
  600: { USD: 200, GHS: 1900 },
  900: { USD: 300, GHS: 2900 },
};

// Low-voltage landscape cable, price per metre (12-gauge direct-burial).
export const CABLE_PRICE_PER_M: Partial<Record<CurrencyCode, number>> = {
  USD: 2.2,
  GHS: 18,
};

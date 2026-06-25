import { FixtureDef } from '@/types';

// Built-in fixture catalogue (the default/fallback). The admin can override these
// or add new fixtures (persisted in Setting('fixtures')); the effective catalogue
// is resolved through fixtureCatalog.ts. Prices are per-currency and hand-set
// independently per market — no GHS↔USD exchange rate is used.
//
// Values dated June 2026 from market research (see claude.md / gemini.md):
//   • USD anchored to observed Home Depot / Lowe's / Amazon SKUs.
//   • GHS anchored to observed Jumia / Melcom / Supply Master / Jiji listings.
//   • `price` is the typical "recommended" unit price; `priceRange` is the
//     budget→premium spread shown in the shopping list.
// Re-pull GHS quarterly (PURC tariff + cedi moves) and USD twice a year (EIA).
export const BUILTIN_FIXTURES: FixtureDef[] = [
  // ---- Recessed downlights (diameter-based) ----
  {
    id: '2inch',
    name: '2 inch recessed',
    category: 'recessed',
    diameter: 2,
    diameterMm: 50.8,
    typicalLumens: { min: 200, max: 400, recommended: 300 },
    wattage: 4,
    price: { USD: 16, GHS: 45 },
    priceRange: { USD: [12, 28], GHS: [30, 90] },
    builtIn: true,
  },
  {
    id: '3inch',
    name: '3 inch recessed',
    category: 'recessed',
    diameter: 3,
    diameterMm: 76.2,
    typicalLumens: { min: 350, max: 650, recommended: 500 },
    wattage: 6,
    price: { USD: 13, GHS: 55 },
    priceRange: { USD: [9, 25], GHS: [40, 120] },
    builtIn: true,
  },
  {
    id: '4inch',
    name: '4 inch recessed',
    category: 'recessed',
    diameter: 4,
    diameterMm: 101.6,
    typicalLumens: { min: 500, max: 900, recommended: 700 },
    wattage: 9,
    price: { USD: 13, GHS: 70 },
    priceRange: { USD: [9, 30], GHS: [50, 160] },
    builtIn: true,
  },
  {
    id: '5inch',
    name: '5 inch recessed',
    category: 'recessed',
    diameter: 5,
    diameterMm: 127,
    typicalLumens: { min: 650, max: 1100, recommended: 850 },
    wattage: 12,
    price: { USD: 15, GHS: 90 },
    priceRange: { USD: [11, 32], GHS: [60, 200] },
    builtIn: true,
  },
  {
    id: '6inch',
    name: '6 inch recessed',
    category: 'recessed',
    diameter: 6,
    diameterMm: 152.4,
    typicalLumens: { min: 800, max: 1300, recommended: 1000 },
    wattage: 12,
    price: { USD: 15, GHS: 110 },
    priceRange: { USD: [9, 35], GHS: [70, 280] },
    builtIn: true,
  },
  {
    id: '8inch',
    name: '8 inch recessed',
    category: 'recessed',
    diameter: 8,
    diameterMm: 203.2,
    typicalLumens: { min: 1300, max: 2200, recommended: 1700 },
    wattage: 20,
    price: { USD: 42, GHS: 180 },
    priceRange: { USD: [25, 65], GHS: [90, 390] },
    builtIn: true,
  },

  // ---- Pendants ----
  {
    id: 'pendantSmall',
    name: 'Pendant (small)',
    category: 'pendant',
    typicalLumens: { min: 300, max: 800, recommended: 450 },
    wattage: 7,
    price: { USD: 45, GHS: 350 },
    priceRange: { USD: [20, 90], GHS: [120, 650] },
    builtIn: true,
  },
  {
    id: 'pendantLarge',
    name: 'Pendant (large)',
    category: 'pendant',
    typicalLumens: { min: 1500, max: 4000, recommended: 2500 },
    wattage: 40,
    price: { USD: 130, GHS: 1400 },
    priceRange: { USD: [80, 350], GHS: [1100, 3900] },
    builtIn: true,
  },

  // ---- Track ----
  {
    id: 'trackHead',
    name: 'Track head',
    category: 'track',
    typicalLumens: { min: 400, max: 900, recommended: 600 },
    wattage: 8,
    price: { USD: 31, GHS: 110 },
    priceRange: { USD: [14, 178], GHS: [60, 260] },
    builtIn: true,
  },

  // ---- Linear / surface ----
  {
    id: 'linear2ft',
    name: 'Linear 2 ft',
    category: 'linear',
    typicalLumens: { min: 1800, max: 2200, recommended: 2000 },
    wattage: 20,
    price: { USD: 25, GHS: 200 },
    priceRange: { USD: [18, 55], GHS: [150, 250] },
    builtIn: true,
  },
  {
    id: 'linear4ft',
    name: 'Linear 4 ft',
    category: 'linear',
    typicalLumens: { min: 3600, max: 5000, recommended: 3800 },
    wattage: 40,
    price: { USD: 45, GHS: 170 },
    priceRange: { USD: [26, 109], GHS: [150, 300] },
    builtIn: true,
  },

  // ---- Wall sconce ----
  {
    id: 'sconce',
    name: 'Wall sconce',
    category: 'sconce',
    typicalLumens: { min: 300, max: 800, recommended: 450 },
    wattage: 7,
    price: { USD: 35, GHS: 400 },
    priceRange: { USD: [15, 90], GHS: [100, 870] },
    builtIn: true,
  },

  // ---- LED strip ----
  {
    id: 'strip5m',
    name: 'LED strip (5 m run)',
    category: 'strip',
    typicalLumens: { min: 1500, max: 3000, recommended: 2250 },
    wattage: 24,
    price: { USD: 22, GHS: 250 },
    priceRange: { USD: [13, 50], GHS: [120, 700] },
    builtIn: true,
  },
  {
    id: 'strip10m',
    name: 'LED strip (10 m run)',
    category: 'strip',
    typicalLumens: { min: 3000, max: 6000, recommended: 4500 },
    wattage: 48,
    price: { USD: 40, GHS: 450 },
    priceRange: { USD: [25, 90], GHS: [240, 1300] },
    builtIn: true,
  },
];

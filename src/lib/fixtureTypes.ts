import { FixtureDef } from '@/types';

// Built-in fixture catalogue (the default/fallback). The admin can override these
// or add new fixtures (persisted in Setting('fixtures')); the effective catalogue
// is resolved through fixtureCatalog.ts. Prices are per-currency and editable —
// USD and GHS are hand-set independently (GHS figures are placeholders, ~×12.8).
export const BUILTIN_FIXTURES: FixtureDef[] = [
  // ---- Recessed downlights (diameter-based) ----
  {
    id: '2inch',
    name: '2 inch recessed',
    category: 'recessed',
    diameter: 2,
    diameterMm: 50.8,
    typicalLumens: { min: 200, max: 400, recommended: 300 },
    price: { USD: 18, GHS: 230 },
    builtIn: true,
  },
  {
    id: '3inch',
    name: '3 inch recessed',
    category: 'recessed',
    diameter: 3,
    diameterMm: 76.2,
    typicalLumens: { min: 300, max: 600, recommended: 450 },
    price: { USD: 22, GHS: 280 },
    builtIn: true,
  },
  {
    id: '4inch',
    name: '4 inch recessed',
    category: 'recessed',
    diameter: 4,
    diameterMm: 101.6,
    typicalLumens: { min: 400, max: 800, recommended: 600 },
    price: { USD: 28, GHS: 360 },
    builtIn: true,
  },
  {
    id: '5inch',
    name: '5 inch recessed',
    category: 'recessed',
    diameter: 5,
    diameterMm: 127,
    typicalLumens: { min: 500, max: 1000, recommended: 750 },
    price: { USD: 32, GHS: 410 },
    builtIn: true,
  },
  {
    id: '6inch',
    name: '6 inch recessed',
    category: 'recessed',
    diameter: 6,
    diameterMm: 152.4,
    typicalLumens: { min: 600, max: 1200, recommended: 900 },
    price: { USD: 35, GHS: 450 },
    builtIn: true,
  },
  {
    id: '8inch',
    name: '8 inch recessed',
    category: 'recessed',
    diameter: 8,
    diameterMm: 203.2,
    typicalLumens: { min: 1000, max: 2000, recommended: 1500 },
    price: { USD: 55, GHS: 700 },
    builtIn: true,
  },

  // ---- Pendants ----
  {
    id: 'pendantSmall',
    name: 'Pendant (small)',
    category: 'pendant',
    typicalLumens: { min: 300, max: 600, recommended: 450 },
    price: { USD: 45, GHS: 580 },
    builtIn: true,
  },
  {
    id: 'pendantLarge',
    name: 'Pendant (large)',
    category: 'pendant',
    typicalLumens: { min: 700, max: 1200, recommended: 900 },
    price: { USD: 80, GHS: 1030 },
    builtIn: true,
  },

  // ---- Track ----
  {
    id: 'trackHead',
    name: 'Track head',
    category: 'track',
    typicalLumens: { min: 400, max: 900, recommended: 600 },
    price: { USD: 30, GHS: 385 },
    builtIn: true,
  },

  // ---- Linear / surface ----
  {
    id: 'linear2ft',
    name: 'Linear 2 ft',
    category: 'linear',
    typicalLumens: { min: 1500, max: 2200, recommended: 1800 },
    price: { USD: 40, GHS: 515 },
    builtIn: true,
  },
  {
    id: 'linear4ft',
    name: 'Linear 4 ft',
    category: 'linear',
    typicalLumens: { min: 3200, max: 4400, recommended: 3800 },
    price: { USD: 60, GHS: 770 },
    builtIn: true,
  },

  // ---- Wall sconce ----
  {
    id: 'sconce',
    name: 'Wall sconce',
    category: 'sconce',
    typicalLumens: { min: 300, max: 700, recommended: 450 },
    price: { USD: 38, GHS: 490 },
    builtIn: true,
  },

  // ---- LED strip ----
  {
    id: 'strip5m',
    name: 'LED strip (5 m run)',
    category: 'strip',
    typicalLumens: { min: 1500, max: 3000, recommended: 2250 },
    price: { USD: 28, GHS: 360 },
    builtIn: true,
  },
];

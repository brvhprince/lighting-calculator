import { FixtureSize } from '@/types';

export const FIXTURE_SIZES: Record<string, FixtureSize> = {
  // ---- Recessed downlights (diameter-based) ----
  '2inch': {
    name: '2 inch recessed',
    category: 'recessed',
    diameter: 2,
    diameterMm: 50.8,
    typicalLumens: { min: 200, max: 400, recommended: 300 }
  },
  '3inch': {
    name: '3 inch recessed',
    category: 'recessed',
    diameter: 3,
    diameterMm: 76.2,
    typicalLumens: { min: 300, max: 600, recommended: 450 }
  },
  '4inch': {
    name: '4 inch recessed',
    category: 'recessed',
    diameter: 4,
    diameterMm: 101.6,
    typicalLumens: { min: 400, max: 800, recommended: 600 }
  },
  '5inch': {
    name: '5 inch recessed',
    category: 'recessed',
    diameter: 5,
    diameterMm: 127,
    typicalLumens: { min: 500, max: 1000, recommended: 750 }
  },
  '6inch': {
    name: '6 inch recessed',
    category: 'recessed',
    diameter: 6,
    diameterMm: 152.4,
    typicalLumens: { min: 600, max: 1200, recommended: 900 }
  },
  '8inch': {
    name: '8 inch recessed',
    category: 'recessed',
    diameter: 8,
    diameterMm: 203.2,
    typicalLumens: { min: 1000, max: 2000, recommended: 1500 }
  },

  // ---- Pendants ----
  pendantSmall: {
    name: 'Pendant (small)',
    category: 'pendant',
    typicalLumens: { min: 300, max: 600, recommended: 450 }
  },
  pendantLarge: {
    name: 'Pendant (large)',
    category: 'pendant',
    typicalLumens: { min: 700, max: 1200, recommended: 900 }
  },

  // ---- Track ----
  trackHead: {
    name: 'Track head',
    category: 'track',
    typicalLumens: { min: 400, max: 900, recommended: 600 }
  },

  // ---- Linear / surface ----
  linear2ft: {
    name: 'Linear 2 ft',
    category: 'linear',
    typicalLumens: { min: 1500, max: 2200, recommended: 1800 }
  },
  linear4ft: {
    name: 'Linear 4 ft',
    category: 'linear',
    typicalLumens: { min: 3200, max: 4400, recommended: 3800 }
  },

  // ---- Wall sconce ----
  sconce: {
    name: 'Wall sconce',
    category: 'sconce',
    typicalLumens: { min: 300, max: 700, recommended: 450 }
  },

  // ---- LED strip ----
  strip5m: {
    name: 'LED strip (5 m run)',
    category: 'strip',
    typicalLumens: { min: 1500, max: 3000, recommended: 2250 }
  }
};

export const getFixtureSize = (key: string): FixtureSize | undefined => {
  return FIXTURE_SIZES[key];
};

export const getFixtureSizeKeys = (): string[] => {
  return Object.keys(FIXTURE_SIZES);
};

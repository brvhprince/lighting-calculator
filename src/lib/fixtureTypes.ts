import { FixtureSize } from '@/types';

export const FIXTURE_SIZES: Record<string, FixtureSize> = {
  '2inch': {
    name: '2 inch',
    diameter: 2,
    diameterMm: 50.8,
    typicalLumens: { min: 200, max: 400, recommended: 300 }
  },
  '3inch': {
    name: '3 inch',
    diameter: 3,
    diameterMm: 76.2,
    typicalLumens: { min: 300, max: 600, recommended: 450 }
  },
  '4inch': {
    name: '4 inch',
    diameter: 4,
    diameterMm: 101.6,
    typicalLumens: { min: 400, max: 800, recommended: 600 }
  },
  '5inch': {
    name: '5 inch',
    diameter: 5,
    diameterMm: 127,
    typicalLumens: { min: 500, max: 1000, recommended: 750 }
  },
  '6inch': {
    name: '6 inch',
    diameter: 6,
    diameterMm: 152.4,
    typicalLumens: { min: 600, max: 1200, recommended: 900 }
  },
  '8inch': {
    name: '8 inch',
    diameter: 8,
    diameterMm: 203.2,
    typicalLumens: { min: 1000, max: 2000, recommended: 1500 }
  }
};

export const getFixtureSize = (key: string): FixtureSize | undefined => {
  return FIXTURE_SIZES[key];
};

export const getFixtureSizeKeys = (): string[] => {
  return Object.keys(FIXTURE_SIZES);
};

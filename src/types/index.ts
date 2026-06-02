export type UnitSystem = 'metric' | 'imperial';

export type NaturalLightLevel = 'none' | 'some' | 'ample';

export type RoomType = {
  name: string;
  lumensPerSqFt: {
    min: number;
    max: number;
    recommended: number;
  };
  description?: string;
};

export type FixtureSize = {
  name: string;
  diameter: number; // in inches
  diameterMm: number; // in mm
  typicalLumens: {
    min: number;
    max: number;
    recommended: number;
  };
};

export type CalculationInput = {
  // Room dimensions
  length: number;
  width: number;
  unitSystem: UnitSystem;

  // Room characteristics
  roomType: string;
  customLumensPerSqFt?: number;

  // Ceiling height (in the active unit system: feet for imperial, meters for metric).
  // Optional — when omitted a standard 8 ft / 2.4 m ceiling is assumed.
  ceilingHeight?: number;

  // Vaulted / sloped ceiling: when true, ceilingPeakHeight is the high point and
  // ceilingHeight is the low (wall) height; the calc uses their average.
  slopedCeiling?: boolean;
  ceilingPeakHeight?: number;

  // Natural light from windows/skylights reduces the artificial light required.
  naturalLight?: NaturalLightLevel;

  // Fixture specifications
  fixtureSize?: string;
  customFixtureLumens?: number;

  // User experience level
  isExpert: boolean;
};

export type CalculationResult = {
  // Area calculations
  area: number;
  areaUnit: string;

  // Lumens calculations
  totalLumensNeeded: number;
  baseLumensNeeded: number; // before ceiling-height adjustment
  lumensPerSqFt: number;
  lumensPerFixture: number;

  // Ceiling adjustment
  ceilingHeightFt: number;
  ceilingFactor: number; // multiplier applied for ceiling height (1 = standard 8 ft)

  // Natural light adjustment (1 = no reduction)
  naturalLightFactor: number;

  // Fixture calculations
  numberOfFixtures: number;
  fixtureSize: string;

  // Spacing calculations
  spacing: {
    betweenFixtures: number;
    fromWall: number;
    unit: string;
    layout: {
      rows: number;
      columns: number;
      rowSpacing: number;
      columnSpacing: number;
    };
  };

  // Recommendations
  recommendations: string[];
};

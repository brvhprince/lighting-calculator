export type UnitSystem = 'metric' | 'imperial';

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
  lumensPerSqFt: number;
  lumensPerFixture: number;

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

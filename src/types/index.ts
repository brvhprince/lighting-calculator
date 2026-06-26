import type { CurrencyCode } from '@/config/markets';

export type UnitSystem = 'metric' | 'imperial';

export type NaturalLightLevel = 'none' | 'some' | 'ample';

// Normalized room design config shared by the Calculator and Designer.
// Ceiling/peak are stored in FEET (internal standard) and shown in the active unit.
export type RoomConfigValue = {
  roomType: string;
  customRoomName: string;
  customRoomLumens: string; // lumens/ft² for a custom room
  ceilingFt: number;
  sloped: boolean;
  ceilingPeakFt: number;
  naturalLight: NaturalLightLevel;
  fixtureSize: string; // '' = auto-select
  customFixtureLumens: string; // advanced
  customLumensPerSqFt: string; // advanced override
  targetLux: string; // advanced: target illuminance in lux (overrides preset)
};

// Room inputs shared by Simple and Advanced mode (and preserved across the toggle).
export type SharedInputs = {
  unitSystem: UnitSystem;
  length: string;
  width: string;
  isExpert: boolean;
  config: RoomConfigValue;
};

export type RoomType = {
  name: string;
  lumensPerSqFt: {
    min: number;
    max: number;
    recommended: number;
  };
  description?: string;
  // IES-style maintained illuminance target on the work plane, in lux.
  targetLux?: number;
};

export type FixtureCategory =
  | 'recessed'
  | 'flush'
  | 'pendant'
  | 'track'
  | 'linear'
  | 'undercabinet'
  | 'sconce'
  | 'vanity'
  | 'lamp'
  | 'strip';

// The three lighting layers (layman-first labels live in the UI). See the
// layered-lighting brief §1.
export type LayerKey = 'ambient' | 'task' | 'accent';

// Per-currency unit price for one fixture (admin-editable; see config/markets CurrencyCode).
export type FixturePrice = Partial<Record<CurrencyCode, number>>;

// A fixture in the catalogue. `id` is the stable key that saved calculations and
// projects reference. Built-ins live in fixtureTypes.ts; admins may add/edit/
// archive fixtures, persisted in Setting('fixtures') and merged over the built-ins.
export type FixtureDef = {
  id: string;
  name: string;
  category: FixtureCategory;
  diameter?: number; // inches (recessed only)
  diameterMm?: number; // mm (recessed only)
  typicalLumens: {
    min: number;
    max: number;
    recommended: number;
  };
  wattage?: number; // nominal watts — used only to sanity-check efficacy (lm/W)
  price: FixturePrice; // unit price per fixture, by currency
  priceRange?: Partial<Record<CurrencyCode, [number, number]>>; // optional shopping low/high
  archived?: boolean; // soft-deleted: hidden from pickers, still resolvable
  builtIn?: boolean; // seeded in code (guards permanent delete)
  // Provenance, used by the layered UI to badge/filter fixtures and to decide
  // what is reusable vs design-local. Absent is treated as 'builtin'/'admin'.
  //   user    = added by a non-admin user, persisted to the personal catalogue
  //   derived = an inline override of another fixture, lives only on its design
  source?: 'builtin' | 'admin' | 'user' | 'derived';
};

// Back-compat alias — fixtures used to be `FixtureSize` without id/price.
export type FixtureSize = FixtureDef;

// A quantity of one catalogue fixture (by id), used in result/project breakdowns.
export type FixtureItem = { id: string; quantity: number };

// A point-in-time copy of a fixture's key fields, embedded in saved calculations
// and projects so a design still renders/costs even if the fixture is later
// edited or deleted from the catalogue.
export type FixtureSnapshot = {
  id: string;
  name: string;
  category: FixtureCategory;
  recommendedLumens: number;
  price: FixturePrice;
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
  fixtureCategory?: FixtureCategory;
  // Exact fixture breakdown by catalogue id (single line in Simple mode, the
  // layer mix in Advanced). Drives per-fixture pricing; absent for custom-lumen
  // designs (cost then falls back to a representative price).
  fixtureItems?: FixtureItem[];

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

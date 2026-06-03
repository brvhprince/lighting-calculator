import { CalculationInput, CalculationResult, UnitSystem, FixtureSize, NaturalLightLevel } from '@/types';
import { ROOM_TYPES } from './roomTypes';
import { FIXTURE_SIZES } from './fixtureTypes';

// Conversion constants
const SQ_FT_TO_SQ_M = 0.092903;
const INCHES_TO_FEET = 1 / 12;
const MM_TO_METERS = 0.001;
const MM_TO_FEET = 0.00328084;

// Shared, geometry-agnostic core. Given a floor area and design parameters it
// computes the full CalculationResult. The spacing/layout is delegated to the
// caller via `makeSpacing` so a rectangular room (grid) and a drawn polygon
// (clipped placement) can both feed the exact same lighting pipeline.
export type AreaLightingParams = {
  areaInSqFt: number;
  areaDisplay: number; // area value in the caller's unit (result.area)
  unitSystem: UnitSystem;
  roomType: string;
  customLumensPerSqFt?: number;
  ceilingHeightFt: number; // already resolved (sloped → average)
  naturalLight?: NaturalLightLevel;
  fixtureSize?: string;
  customFixtureLumens?: number;
  makeSpacing: (numberOfFixtures: number) => CalculationResult['spacing'];
};

export function buildLightingResult(p: AreaLightingParams): CalculationResult {
  const lumensPerSqFt =
    p.customLumensPerSqFt || ROOM_TYPES[p.roomType]?.lumensPerSqFt.recommended || 25;

  const baseLumensNeeded = Math.ceil(p.areaInSqFt * lumensPerSqFt);
  const ceilingFactor = computeCeilingFactor(p.ceilingHeightFt);
  const naturalLightFactor = naturalLightMultiplier(p.naturalLight);
  const totalLumensNeeded = Math.ceil(baseLumensNeeded * ceilingFactor * naturalLightFactor);

  // Lumens per fixture
  let lumensPerFixture: number;
  let fixtureSizeName: string;
  let fixtureCategory: CalculationResult['fixtureCategory'];
  if (p.customFixtureLumens) {
    lumensPerFixture = p.customFixtureLumens;
    const f = p.fixtureSize ? FIXTURE_SIZES[p.fixtureSize] : undefined;
    fixtureSizeName = f?.name || 'Custom';
    fixtureCategory = f?.category;
  } else if (p.fixtureSize && FIXTURE_SIZES[p.fixtureSize]) {
    const fixture = FIXTURE_SIZES[p.fixtureSize];
    lumensPerFixture = fixture.typicalLumens.recommended;
    fixtureSizeName = fixture.name;
    fixtureCategory = fixture.category;
  } else {
    const avgLumensPerFixture = totalLumensNeeded / Math.max(4, Math.ceil(p.areaInSqFt / 25));
    const selectedFixture = autoSelectFixture(avgLumensPerFixture);
    lumensPerFixture = selectedFixture.typicalLumens.recommended;
    fixtureSizeName = selectedFixture.name;
    fixtureCategory = selectedFixture.category;
  }

  const numberOfFixtures = Math.ceil(totalLumensNeeded / lumensPerFixture);
  const spacing = p.makeSpacing(numberOfFixtures);

  const recommendations = generateRecommendations(
    { roomType: p.roomType, customFixtureLumens: p.customFixtureLumens, naturalLight: p.naturalLight },
    p.areaInSqFt,
    numberOfFixtures,
    lumensPerFixture,
    totalLumensNeeded,
    p.ceilingHeightFt,
    ceilingFactor
  );

  return {
    area: p.areaDisplay,
    areaUnit: p.unitSystem === 'metric' ? 'm²' : 'ft²',
    totalLumensNeeded,
    baseLumensNeeded,
    ceilingHeightFt: p.ceilingHeightFt,
    ceilingFactor,
    naturalLightFactor,
    lumensPerSqFt,
    lumensPerFixture,
    numberOfFixtures,
    fixtureSize: fixtureSizeName,
    fixtureCategory,
    spacing,
    recommendations,
  };
}

// Resolve a ceiling configuration (incl. sloped/vaulted average) to feet.
export function resolveCeiling(
  ceilingHeight: number | undefined,
  unitSystem: UnitSystem,
  slopedCeiling?: boolean,
  ceilingPeakHeight?: number
): number {
  let ft = resolveCeilingHeightFt(ceilingHeight, unitSystem);
  if (slopedCeiling && ceilingPeakHeight) {
    const peakFt = resolveCeilingHeightFt(ceilingPeakHeight, unitSystem);
    ft = (ft + peakFt) / 2;
  }
  return ft;
}

// Convert a dimension entered in the active unit system to feet (the internal
// standard), mirroring how area is computed (imperial >50 ⇒ inches, metric
// >100 ⇒ millimetres).
export function dimToFeet(value: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'metric') {
    const meters = value > 100 ? value * MM_TO_METERS : value;
    return meters / 0.3048;
  }
  return value > 50 ? value * INCHES_TO_FEET : value;
}

export function calculateLighting(input: CalculationInput): CalculationResult {
  const area = calculateArea(input.length, input.width, input.unitSystem);
  const areaInSqFt = input.unitSystem === 'metric' ? area / SQ_FT_TO_SQ_M : area;
  const ceilingHeightFt = resolveCeiling(
    input.ceilingHeight,
    input.unitSystem,
    input.slopedCeiling,
    input.ceilingPeakHeight
  );

  return buildLightingResult({
    areaInSqFt,
    areaDisplay: area,
    unitSystem: input.unitSystem,
    roomType: input.roomType,
    customLumensPerSqFt: input.customLumensPerSqFt,
    ceilingHeightFt,
    naturalLight: input.naturalLight,
    fixtureSize: input.fixtureSize,
    customFixtureLumens: input.customFixtureLumens,
    makeSpacing: (n) => calculateSpacing(input.length, input.width, n, input.unitSystem),
  });
}

const FEET_PER_METER = 3.28084;
const STANDARD_CEILING_FT = 8;

// Resolve a ceiling-height input (given in the active unit system) to feet.
// Falls back to the standard 8 ft ceiling when not provided.
function resolveCeilingHeightFt(ceilingHeight: number | undefined, unitSystem: UnitSystem): number {
  if (!ceilingHeight || ceilingHeight <= 0) return STANDARD_CEILING_FT;
  if (unitSystem === 'metric') {
    // Accept meters (e.g. 2.7) or millimeters (e.g. 2700)
    const meters = ceilingHeight > 30 ? ceilingHeight * MM_TO_METERS : ceilingHeight;
    return meters * FEET_PER_METER;
  }
  // Imperial: accept feet (e.g. 9) or inches (e.g. 108)
  return ceilingHeight > 30 ? ceilingHeight * INCHES_TO_FEET : ceilingHeight;
}

// ~10% more output per foot above the 8 ft standard, with a sensible cap so very
// high (vaulted) ceilings don't produce runaway numbers. Lower ceilings get a
// small reduction.
export function computeCeilingFactor(ceilingHeightFt: number): number {
  const delta = ceilingHeightFt - STANDARD_CEILING_FT;
  const factor = 1 + delta * 0.1;
  return Math.min(2, Math.max(0.85, parseFloat(factor.toFixed(3))));
}

// Daylight offsets artificial lighting needs. Conservative reductions so rooms
// are never under-lit at night.
function naturalLightMultiplier(level: import('@/types').NaturalLightLevel | undefined): number {
  switch (level) {
    case 'some':
      return 0.9;
    case 'ample':
      return 0.8;
    default:
      return 1;
  }
}

export function calculateLumensOnly(
  length: number,
  width: number,
  roomType: string,
  unitSystem: UnitSystem,
  customLumensPerSqFt?: number
): { totalLumens: number; lumensPerSqFt: number; area: number; areaUnit: string } {
  const area = calculateArea(length, width, unitSystem);
  const areaInSqFt = unitSystem === 'metric' ? area / SQ_FT_TO_SQ_M : area;

  const lumensPerSqFt = customLumensPerSqFt ||
    ROOM_TYPES[roomType]?.lumensPerSqFt.recommended ||
    25;

  const totalLumens = Math.ceil(areaInSqFt * lumensPerSqFt);

  return {
    totalLumens,
    lumensPerSqFt,
    area,
    areaUnit: unitSystem === 'metric' ? 'm²' : 'ft²'
  };
}

function calculateArea(length: number, width: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'metric') {
    // Convert mm to m² if needed, or use as is if already in meters
    const lengthInMeters = length > 100 ? length * MM_TO_METERS : length;
    const widthInMeters = width > 100 ? width * MM_TO_METERS : width;
    return lengthInMeters * widthInMeters;
  } else {
    // Imperial: could be feet or inches
    const lengthInFeet = length > 50 ? length * INCHES_TO_FEET : length;
    const widthInFeet = width > 50 ? width * INCHES_TO_FEET : width;
    return lengthInFeet * widthInFeet;
  }
}

function autoSelectFixture(targetLumens: number): FixtureSize {
  // Auto-selection stays within the recessed family; other fixture types are
  // chosen explicitly by the user.
  const fixtures = Object.values(FIXTURE_SIZES).filter((f) => f.category === 'recessed');

  // Find the fixture closest to target lumens
  let bestMatch = fixtures[0];
  let minDiff = Math.abs(targetLumens - bestMatch.typicalLumens.recommended);

  for (const fixture of fixtures) {
    const diff = Math.abs(targetLumens - fixture.typicalLumens.recommended);
    if (diff < minDiff) {
      minDiff = diff;
      bestMatch = fixture;
    }
  }

  return bestMatch;
}

function calculateSpacing(
  length: number,
  width: number,
  numberOfFixtures: number,
  unitSystem: UnitSystem
): CalculationResult['spacing'] {
  // Convert to feet for calculation
  let lengthInFeet: number;
  let widthInFeet: number;

  if (unitSystem === 'metric') {
    lengthInFeet = length > 100 ? length * MM_TO_FEET : length * 3.28084;
    widthInFeet = width > 100 ? width * MM_TO_FEET : width * 3.28084;
  } else {
    lengthInFeet = length > 50 ? length * INCHES_TO_FEET : length;
    widthInFeet = width > 50 ? width * INCHES_TO_FEET : width;
  }

  // Calculate optimal layout
  const aspectRatio = lengthInFeet / widthInFeet;
  let rows = Math.ceil(Math.sqrt(numberOfFixtures / aspectRatio));
  let columns = Math.ceil(numberOfFixtures / rows);

  // Ensure we have enough fixtures
  while (rows * columns < numberOfFixtures) {
    if (columns * aspectRatio < rows) {
      columns++;
    } else {
      rows++;
    }
  }

  // Calculate spacing (following the rule: spacing from wall is half the spacing between fixtures)
  const wallSpacing = 2; // feet (conservative default: 2 feet from wall)

  const columnSpacing = columns > 1
    ? (widthInFeet - 2 * wallSpacing) / (columns - 1)
    : 0;

  const rowSpacing = rows > 1
    ? (lengthInFeet - 2 * wallSpacing) / (rows - 1)
    : 0;

  const avgSpacing = (columnSpacing + rowSpacing) / 2;

  // Convert to requested unit system
  let unit: string;
  let displayWallSpacing: number;
  let displayBetweenFixtures: number;
  let displayRowSpacing: number;
  let displayColumnSpacing: number;

  if (unitSystem === 'metric') {
    unit = 'mm';
    displayWallSpacing = Math.round(wallSpacing * 304.8); // feet to mm
    displayBetweenFixtures = Math.round(avgSpacing * 304.8);
    displayRowSpacing = Math.round(rowSpacing * 304.8);
    displayColumnSpacing = Math.round(columnSpacing * 304.8);
  } else {
    unit = 'inches';
    displayWallSpacing = Math.round(wallSpacing * 12);
    displayBetweenFixtures = Math.round(avgSpacing * 12);
    displayRowSpacing = Math.round(rowSpacing * 12);
    displayColumnSpacing = Math.round(columnSpacing * 12);
  }

  return {
    betweenFixtures: displayBetweenFixtures,
    fromWall: displayWallSpacing,
    unit,
    layout: {
      rows,
      columns,
      rowSpacing: displayRowSpacing,
      columnSpacing: displayColumnSpacing
    }
  };
}

function generateRecommendations(
  input: { roomType: string; customFixtureLumens?: number; naturalLight?: NaturalLightLevel },
  areaInSqFt: number,
  numberOfFixtures: number,
  lumensPerFixture: number,
  totalLumensNeeded: number,
  ceilingHeightFt: number,
  ceilingFactor: number
): string[] {
  const recommendations: string[] = [];

  const roomType = ROOM_TYPES[input.roomType];

  if (roomType) {
    recommendations.push(
      `For a ${roomType.name.toLowerCase()}, the recommended lighting is ${roomType.lumensPerSqFt.recommended} lumens per square foot.`
    );
  }

  recommendations.push(
    `Install ${numberOfFixtures} recessed lights with approximately ${lumensPerFixture} lumens each.`
  );

  recommendations.push(
    `Total light output: ${totalLumensNeeded.toLocaleString()} lumens for ${Math.round(areaInSqFt)} sq ft.`
  );

  if (!input.customFixtureLumens) {
    recommendations.push(
      `When purchasing fixtures, look for lights rated between ${Math.round(lumensPerFixture * 0.9)}-${Math.round(lumensPerFixture * 1.1)} lumens each.`
    );
  }

  recommendations.push(
    'Spacing between lights should be twice the distance from the wall to the first light.'
  );

  // Ceiling-height guidance
  if (ceilingFactor > 1) {
    recommendations.push(
      `Your ${ceilingHeightFt.toFixed(1)} ft ceiling raises the required output by ${Math.round((ceilingFactor - 1) * 100)}% versus a standard 8 ft ceiling — already factored into the totals above.`
    );
  }
  if (input.naturalLight === 'ample') {
    recommendations.push(
      'Ample daylight lets us trim artificial output by ~20%. Pair with dimmers and daylight sensors to capture the savings without losing brightness after dark.'
    );
  } else if (input.naturalLight === 'some') {
    recommendations.push(
      'Some natural light reduces the artificial requirement by ~10%. Zone window-side fixtures separately so they can dim independently during the day.'
    );
  }

  if (ceilingHeightFt >= 10) {
    recommendations.push(
      'For ceilings 10 ft and higher, choose fixtures with a narrower beam angle (≤40°) or higher lumen output to keep light from dispersing before it reaches the floor.'
    );
  } else if (ceilingHeightFt < 8) {
    recommendations.push(
      'On lower ceilings, favour wide-beam (>60°) trims and dimmable fixtures to avoid hot-spots and glare.'
    );
  }

  if (numberOfFixtures < 4) {
    recommendations.push(
      'Consider adding more fixtures for better light distribution, even if they have lower lumens per fixture.'
    );
  }

  return recommendations;
}

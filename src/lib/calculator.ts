import { CalculationInput, CalculationResult, UnitSystem, FixtureSize } from '@/types';
import { ROOM_TYPES } from './roomTypes';
import { FIXTURE_SIZES } from './fixtureTypes';

// Conversion constants
const SQ_FT_TO_SQ_M = 0.092903;
const INCHES_TO_FEET = 1 / 12;
const MM_TO_METERS = 0.001;
const MM_TO_FEET = 0.00328084;

export function calculateLighting(input: CalculationInput): CalculationResult {
  // Step 1: Calculate area in square feet (internal standard)
  const area = calculateArea(input.length, input.width, input.unitSystem);
  const areaInSqFt = input.unitSystem === 'metric' ? area / SQ_FT_TO_SQ_M : area;

  // Step 2: Determine lumens per square foot
  const lumensPerSqFt = input.customLumensPerSqFt ||
    ROOM_TYPES[input.roomType]?.lumensPerSqFt.recommended ||
    25;

  // Step 3: Calculate base lumens, then adjust for ceiling height.
  // Light spreads and attenuates with mounting height. A standard residential
  // ceiling is 8 ft; taller ceilings need proportionally more output to land the
  // same illuminance on the working plane (~10% per foot above 8 ft).
  const baseLumensNeeded = Math.ceil(areaInSqFt * lumensPerSqFt);

  // For a sloped/vaulted ceiling, light is designed to the average height
  // between the low (wall) side and the high (peak) side.
  let ceilingHeightFt = resolveCeilingHeightFt(input.ceilingHeight, input.unitSystem);
  if (input.slopedCeiling && input.ceilingPeakHeight) {
    const peakFt = resolveCeilingHeightFt(input.ceilingPeakHeight, input.unitSystem);
    ceilingHeightFt = (ceilingHeightFt + peakFt) / 2;
  }
  const ceilingFactor = computeCeilingFactor(ceilingHeightFt);

  // Natural daylight from windows/skylights offsets some artificial light.
  const naturalLightFactor = naturalLightMultiplier(input.naturalLight);

  const totalLumensNeeded = Math.ceil(baseLumensNeeded * ceilingFactor * naturalLightFactor);

  // Step 4: Determine lumens per fixture
  let lumensPerFixture: number;
  let fixtureSizeName: string;

  if (input.customFixtureLumens) {
    lumensPerFixture = input.customFixtureLumens;
    fixtureSizeName = input.fixtureSize
      ? FIXTURE_SIZES[input.fixtureSize]?.name || 'Custom'
      : 'Custom';
  } else if (input.fixtureSize && FIXTURE_SIZES[input.fixtureSize]) {
    const fixture = FIXTURE_SIZES[input.fixtureSize];
    lumensPerFixture = fixture.typicalLumens.recommended;
    fixtureSizeName = fixture.name;
  } else {
    // Auto-select fixture size based on room size and lumens needed
    const avgLumensPerFixture = totalLumensNeeded / Math.max(4, Math.ceil(areaInSqFt / 25));
    const selectedFixture = autoSelectFixture(avgLumensPerFixture);
    lumensPerFixture = selectedFixture.typicalLumens.recommended;
    fixtureSizeName = selectedFixture.name;
  }

  // Step 5: Calculate number of fixtures
  const numberOfFixtures = Math.ceil(totalLumensNeeded / lumensPerFixture);

  // Step 6: Calculate spacing
  const spacing = calculateSpacing(
    input.length,
    input.width,
    numberOfFixtures,
    input.unitSystem
  );

  // Step 7: Generate recommendations
  const recommendations = generateRecommendations(
    input,
    areaInSqFt,
    numberOfFixtures,
    lumensPerFixture,
    totalLumensNeeded,
    ceilingHeightFt,
    ceilingFactor
  );

  return {
    area,
    areaUnit: input.unitSystem === 'metric' ? 'm²' : 'ft²',
    totalLumensNeeded,
    baseLumensNeeded,
    ceilingHeightFt,
    ceilingFactor,
    naturalLightFactor,
    lumensPerSqFt,
    lumensPerFixture,
    numberOfFixtures,
    fixtureSize: fixtureSizeName,
    spacing,
    recommendations
  };
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
  const fixtures = Object.values(FIXTURE_SIZES);

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
  input: CalculationInput,
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

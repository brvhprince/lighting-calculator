// Lighting-design guidance + curated Penlabs fixtures, derived from room type and
// ceiling height. Specs are illustrative of the Penlabs product line.

export type SpecGuidance = {
  colorTemp: string; // e.g. "2700K – 3000K (warm white)"
  cctMin: number; // numeric CCT range (Kelvin) for the preview swatch
  cctMax: number;
  colorTempReason: string;
  cri: string; // e.g. "CRI 90+"
  criReason: string;
  beamAngle: string;
  beamReason: string;
  dimming: string;
};

export type PenlabsProduct = {
  name: string;
  tagline: string;
  lumens: string;
  watts: string;
  colorTemp: string;
  cri: string;
  smart: string;
  finish: string;
};

// Room groups with similar lighting character.
const WARM_ROOMS = new Set(['bedroom', 'livingRoom', 'greatRoom', 'diningRoom', 'outdoor']);
const COOL_TASK_ROOMS = new Set(['kitchen', 'bathroom', 'office', 'garage', 'laundry']);
const HIGH_CRI_ROOMS = new Set(['kitchen', 'bathroom', 'office', 'diningRoom']);

export function getSpecGuidance(roomType: string, ceilingHeightFt: number): SpecGuidance {
  const warm = WARM_ROOMS.has(roomType);
  const cool = COOL_TASK_ROOMS.has(roomType);

  const colorTemp = warm
    ? '2700K – 3000K (warm white)'
    : cool
    ? '3500K – 4000K (neutral / cool white)'
    : '3000K (soft white)';
  const cctMin = warm ? 2700 : cool ? 3500 : 3000;
  const cctMax = warm ? 3000 : cool ? 4000 : 3000;
  const colorTempReason = warm
    ? 'Warm tones create a relaxing, residential atmosphere for living and resting spaces.'
    : cool
    ? 'Cooler, crisper light improves visibility and focus for task-oriented areas.'
    : 'A balanced soft white suits multi-purpose and transitional spaces.';

  const highCri = HIGH_CRI_ROOMS.has(roomType);
  const cri = highCri ? 'CRI 90+' : 'CRI 80+';
  const criReason = highCri
    ? 'High colour rendering makes food, skin tones and finishes look true — essential for kitchens, baths and dining.'
    : 'CRI 80+ is comfortable and accurate for general living spaces.';

  let beamAngle: string;
  let beamReason: string;
  if (ceilingHeightFt >= 12) {
    beamAngle = 'Narrow 24° – 36° spot';
    beamReason = 'Very high ceilings need a tighter beam so light reaches the floor without dispersing.';
  } else if (ceilingHeightFt >= 9) {
    beamAngle = 'Medium 38° – 50° flood';
    beamReason = 'Standard-to-tall ceilings balance coverage and intensity with a medium beam.';
  } else {
    beamAngle = 'Wide 60°+ flood';
    beamReason = 'Lower ceilings benefit from a wide beam to avoid hot-spots and even out coverage.';
  }

  return {
    colorTemp,
    cctMin,
    cctMax,
    colorTempReason,
    cri,
    criReason,
    beamAngle,
    beamReason,
    dimming:
      'Specify TRIAC/ELV or 0–10V dimmable drivers and a matched LED dimmer. For smart control, choose fixtures compatible with Matter, so they work across Apple Home, Google Home and Alexa.',
  };
}

export function getPenlabsProducts(roomType: string, ceilingHeightFt: number): PenlabsProduct[] {
  const warm = WARM_ROOMS.has(roomType);
  const baseTemp = warm ? '2700K' : '3500K';
  const tunable = '2700K–5000K tunable';

  const products: PenlabsProduct[] = [
    {
      name: 'Penlabs Aperture 4″',
      tagline: 'Trimless recessed downlight',
      lumens: '650 lm',
      watts: '8 W',
      colorTemp: baseTemp,
      cri: 'CRI 95',
      smart: 'Matter over Thread',
      finish: 'Bronze / Matte Black',
    },
    {
      name: 'Penlabs Lumen Slim',
      tagline: 'Ultra-thin canless wafer',
      lumens: '900 lm',
      watts: '11 W',
      colorTemp: tunable,
      cri: 'CRI 90',
      smart: 'Matter + app scenes',
      finish: 'Warm Bone bezel',
    },
  ];

  if (ceilingHeightFt >= 11) {
    products.push({
      name: 'Penlabs Deepthrow 3″',
      tagline: 'Narrow-beam high-ceiling spot',
      lumens: '1,100 lm',
      watts: '13 W',
      colorTemp: baseTemp,
      cri: 'CRI 97',
      smart: 'Matter + DALI',
      finish: 'Deep Basalt',
    });
  } else {
    products.push({
      name: 'Penlabs Halo Wide',
      tagline: 'Wide-flood ambient downlight',
      lumens: '800 lm',
      watts: '10 W',
      colorTemp: tunable,
      cri: 'CRI 92',
      smart: 'Matter + motion sensor',
      finish: 'Brushed Brass',
    });
  }

  return products;
}

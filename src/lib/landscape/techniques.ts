import {
  LandscapeCategory,
  LandscapeFeature,
  LandscapeMeasure,
  LandscapeTechnique,
} from '@/types/landscape';

export type TechniqueDef = {
  key: LandscapeTechnique;
  name: string;
  blurb: string;
  measure: LandscapeMeasure;
  measureLabel: string; // label for the quantity input
  // Acceptable outdoor categories, best first; the engine picks the first that
  // exists for the chosen system.
  categories: LandscapeCategory[];
  // Whether a height input is relevant (walls, trees) and its default (feet).
  usesHeight?: boolean;
  defaultHeightFt?: number;
  // Fixtures required for this feature, from its measure.
  quantity: (f: LandscapeFeature) => number;
  // One-line placement guidance shown in the schedule.
  note: string;
};

const ceilPos = (n: number, min = 1) => Math.max(min, Math.ceil(n || 0));

// Per-tree fixture count by canopy height: taller/wider trees need more.
function uplightsPerTree(heightFt: number): number {
  if (heightFt >= 25) return 3;
  if (heightFt >= 12) return 2;
  return 1;
}

export const TECHNIQUES: Record<LandscapeTechnique, TechniqueDef> = {
  path: {
    key: 'path',
    name: 'Path / walkway',
    blurb: 'Low, glare-free light along a walkway or driveway edge.',
    measure: 'length',
    measureLabel: 'Path length',
    categories: ['pathLight', 'bollard'],
    quantity: (f) => ceilPos((f.lengthFt ?? 0) / 8, 2), // staggered ~8 ft apart
    note: 'Stagger both sides every 6 to 10 ft; avoid a runway line.',
  },
  treeUplight: {
    key: 'treeUplight',
    name: 'Tree / shrub uplighting',
    blurb: 'Graze light up a trunk and into the canopy for drama.',
    measure: 'count',
    measureLabel: 'Number of trees',
    categories: ['wellLight', 'spotlight'],
    usesHeight: true,
    defaultHeightFt: 15,
    quantity: (f) => ceilPos((f.count ?? 0) * uplightsPerTree(f.heightFt ?? 15)),
    note: '1 fixture for small trees, 2 to 3 for tall or wide canopies.',
  },
  wallWash: {
    key: 'wallWash',
    name: 'Facade / wall wash',
    blurb: 'Even, soft light across a wall or facade.',
    measure: 'length',
    measureLabel: 'Wall length',
    categories: ['wallWash', 'spotlight', 'floodlight'],
    usesHeight: true,
    defaultHeightFt: 9,
    quantity: (f) => ceilPos((f.lengthFt ?? 0) / Math.max(4, f.heightFt ?? 9)),
    note: 'Space fixtures roughly one wall-height apart for an even wash.',
  },
  wallGraze: {
    key: 'wallGraze',
    name: 'Wall / texture grazing',
    blurb: 'Mount close to a textured surface to throw long shadows.',
    measure: 'length',
    measureLabel: 'Wall length',
    categories: ['wallWash', 'spotlight'],
    quantity: (f) => ceilPos((f.lengthFt ?? 0) / 4), // close spacing for texture
    note: 'Place close to the wall (within 1 ft) every ~4 ft to reveal texture.',
  },
  steps: {
    key: 'steps',
    name: 'Steps / stairs',
    blurb: 'Mark step edges for safe footing after dark.',
    measure: 'count',
    measureLabel: 'Number of steps',
    categories: ['stepLight', 'deckLight'],
    quantity: (f) => ceilPos((f.count ?? 0) / 2), // every other step is usually enough
    note: 'Light every other step (or every step on long flights).',
  },
  spotlight: {
    key: 'spotlight',
    name: 'Accent / focal point',
    blurb: 'Highlight a statue, sign, or architectural feature.',
    measure: 'count',
    measureLabel: 'Number of focal points',
    categories: ['spotlight', 'wellLight'],
    quantity: (f) => ceilPos(f.count ?? 0),
    note: 'One narrow-beam fixture per feature; add a second to fill shadows.',
  },
  deckRail: {
    key: 'deckRail',
    name: 'Deck / railing',
    blurb: 'Post-cap or rail lights to outline a deck.',
    measure: 'length',
    measureLabel: 'Railing length',
    categories: ['deckLight', 'stepLight'],
    quantity: (f) => ceilPos((f.lengthFt ?? 0) / 6),
    note: 'Post caps every ~6 ft, or under-rail lighting for a softer line.',
  },
  gardenBed: {
    key: 'gardenBed',
    name: 'Garden bed / border',
    blurb: 'Graze planting beds and borders for depth.',
    measure: 'length',
    measureLabel: 'Bed length',
    categories: ['wellLight', 'spotlight', 'pathLight'],
    quantity: (f) => ceilPos((f.lengthFt ?? 0) / 8),
    note: 'Tuck low fixtures among plants every ~8 ft; hide the source.',
  },
  waterFeature: {
    key: 'waterFeature',
    name: 'Water feature / pond',
    blurb: 'Submerged or grazing light on a pond or fountain.',
    measure: 'count',
    measureLabel: 'Number of features',
    categories: ['underwater', 'spotlight'],
    quantity: (f) => ceilPos((f.count ?? 0) * 2),
    note: 'Two fixtures per feature; keep sources below the waterline.',
  },
  downlight: {
    key: 'downlight',
    name: 'Downlight / moonlighting',
    blurb: 'Mount high in a tree to cast a soft, dappled pool below.',
    measure: 'count',
    measureLabel: 'Number of trees',
    categories: ['downlight', 'spotlight'],
    usesHeight: true,
    defaultHeightFt: 20,
    quantity: (f) => ceilPos((f.count ?? 0) * 2),
    note: 'Mount high with 1 to 2 per tree; aim through branches for shadow.',
  },
  securityFlood: {
    key: 'securityFlood',
    name: 'Security floodlight',
    blurb: 'Bright, wide cover for entries, drives, and yards.',
    measure: 'count',
    measureLabel: 'Number of floods',
    categories: ['floodlight'],
    quantity: (f) => ceilPos(f.count ?? 0),
    note: 'Aim down to limit glare and light trespass to neighbours.',
  },
  string: {
    key: 'string',
    name: 'String / festoon',
    blurb: 'Overhead string lights for patios and pergolas.',
    measure: 'length',
    measureLabel: 'Run length',
    categories: ['stringLight'],
    quantity: (f) => ceilPos((f.lengthFt ?? 0) / 48), // ~48 ft per standard run
    note: 'Hang in catenary swoops; one run covers about 45 to 50 ft.',
  },
  patio: {
    key: 'patio',
    name: 'Patio / outdoor living',
    blurb: 'General and task light for an outdoor seating or dining area.',
    measure: 'area',
    measureLabel: 'Area',
    categories: ['patioLight', 'wallWash'],
    quantity: (f) => ceilPos((f.areaSqFt ?? 0) / 120, 2),
    note: 'Wall or overhead fixtures plus a dimmable task light over dining.',
  },
};

// Ordered list for the technique picker.
export const TECHNIQUE_ORDER: LandscapeTechnique[] = [
  'path',
  'treeUplight',
  'wallWash',
  'wallGraze',
  'spotlight',
  'gardenBed',
  'steps',
  'deckRail',
  'patio',
  'string',
  'waterFeature',
  'downlight',
  'securityFlood',
];

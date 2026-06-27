import { FixturePrice } from './index';
import { CurrencyCode } from '@/config/markets';

// Wiring system for a landscape scheme.
//   lowvoltage  = 12V, transformer + landscape cable (US/premium standard)
//   linevoltage = 230V/120V mains, hardwired by an electrician
//   solar       = self-powered per fixture, no wiring or transformer
export type LandscapeSystem = 'lowvoltage' | 'linevoltage' | 'solar';

// Outdoor fixture families.
export type LandscapeCategory =
  | 'pathLight'
  | 'bollard'
  | 'wellLight' // in-ground uplight
  | 'spotlight' // adjustable spike/accent
  | 'wallWash'
  | 'stepLight'
  | 'deckLight'
  | 'floodlight'
  | 'stringLight'
  | 'underwater'
  | 'downlight' // tree-mounted moonlighting
  | 'patioLight'; // outdoor wall / living-area light

// An outdoor fixture. Mirrors the indoor FixtureDef shape where it overlaps
// (id/name/typicalLumens/price) so the shared pricing helpers work, plus the
// outdoor-specific fields (system, ingress protection, beam).
export type LandscapeFixture = {
  id: string;
  name: string;
  category: LandscapeCategory;
  system: LandscapeSystem | 'any';
  ip: string; // ingress protection, e.g. "IP65"
  typicalLumens: { min: number; max: number; recommended: number };
  wattage: number; // electrical load (0 for solar), used for transformer sizing
  cct: number; // Kelvin
  beam?: string; // e.g. "24°" or "120°"
  price: FixturePrice;
  priceRange?: Partial<Record<CurrencyCode, [number, number]>>;
};

// How a feature is measured by the user.
export type LandscapeMeasure = 'count' | 'length' | 'area';

// Lighting techniques the user can apply to their property.
export type LandscapeTechnique =
  | 'path'
  | 'treeUplight'
  | 'wallWash'
  | 'wallGraze'
  | 'steps'
  | 'spotlight'
  | 'deckRail'
  | 'gardenBed'
  | 'waterFeature'
  | 'downlight'
  | 'securityFlood'
  | 'string'
  | 'patio';

// One feature on the property. The measure used (count/lengthFt/areaSqFt)
// depends on the technique; lengths/areas are stored in feet internally.
export type LandscapeFeature = {
  id: string;
  technique: LandscapeTechnique;
  label?: string;
  count?: number;
  lengthFt?: number;
  areaSqFt?: number;
  heightFt?: number; // wall/tree height, where it affects beam or quantity
};

export type LandscapeInput = {
  system: LandscapeSystem;
  features: LandscapeFeature[];
};

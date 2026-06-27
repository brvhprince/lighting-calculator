import { LandscapeFixture, LandscapeInput, LandscapeSystem, LandscapeTechnique } from '@/types/landscape';
import { CurrencyCode, Market } from '@/config/markets';
import { fixturePrice, fixturePriceRange } from '@/lib/fixtureCatalog';
import {
  selectLandscapeFixture,
  TRANSFORMER_SIZES_VA,
  TRANSFORMER_PRICE,
  CABLE_PRICE_PER_M,
} from './fixtures';
import { TECHNIQUES } from './techniques';

const FT_TO_M = 0.3048;
const NIGHT_HOURS = 6; // typical dusk-to-late-evening run with a timer/photocell
const TRANSFORMER_LOAD = 0.8; // size to <= 80% of rated VA
const CABLE_M_PER_FIXTURE = 7; // rough planning allowance (spacing + home runs)

export type LandscapeLine = {
  featureId: string;
  technique: LandscapeTechnique;
  techniqueName: string;
  label?: string;
  fixture: LandscapeFixture;
  substituted: boolean; // fixture system differs from the chosen system
  quantity: number;
  lumensEach: number;
  wattsEach: number;
  costLow: number;
  costHigh: number;
  note: string;
};

export type LandscapeBomLine = {
  fixture: LandscapeFixture;
  quantity: number;
  unitPrice: number;
  costLow: number;
  costHigh: number;
};

export type LandscapeResult = {
  system: LandscapeSystem;
  lines: LandscapeLine[];
  totalFixtures: number;
  totalWatts: number;
  totalLumens: number;
  // Low-voltage engineering
  transformer?: { sizeVA: number; count: number; loadWatts: number; headroomPct: number; price: number };
  cableMeters?: number;
  cablePrice?: number;
  // Line-voltage engineering
  circuits?: number;
  // Cost (active currency)
  materialLow: number;
  materialHigh: number;
  install: number;
  installedLow: number;
  installedHigh: number;
  annualEnergyCost: number;
  bom: LandscapeBomLine[];
  notes: string[];
};

function sizeTransformer(loadWatts: number, currency: CurrencyCode) {
  const requiredVA = loadWatts / TRANSFORMER_LOAD;
  const single = TRANSFORMER_SIZES_VA.find((s) => s >= requiredVA);
  const sizeVA = single ?? TRANSFORMER_SIZES_VA[TRANSFORMER_SIZES_VA.length - 1];
  const count = single ? 1 : Math.max(1, Math.ceil(requiredVA / sizeVA));
  const capacity = sizeVA * count;
  const headroomPct = capacity > 0 ? Math.round(((capacity - loadWatts) / capacity) * 100) : 0;
  const unit = TRANSFORMER_PRICE[sizeVA]?.[currency] ?? TRANSFORMER_PRICE[sizeVA]?.USD ?? 0;
  return { sizeVA, count, loadWatts, headroomPct, price: unit * count };
}

export function computeLandscape(
  input: LandscapeInput,
  market: Market,
  opts?: { cableMetersOverride?: number }
): LandscapeResult {
  const currency = market.code;
  const { system } = input;

  const lines: LandscapeLine[] = [];
  let substitutedAny = false;

  for (const feature of input.features) {
    const tech = TECHNIQUES[feature.technique];
    if (!tech) continue;
    const sel = selectLandscapeFixture(tech.categories, system);
    if (!sel) continue;
    const quantity = tech.quantity(feature);
    if (quantity <= 0) continue;
    const [low, high] = fixturePriceRange(sel.fixture, currency);
    if (sel.substituted) substitutedAny = true;
    lines.push({
      featureId: feature.id,
      technique: feature.technique,
      techniqueName: tech.name,
      label: feature.label,
      fixture: sel.fixture,
      substituted: sel.substituted,
      quantity,
      lumensEach: sel.fixture.typicalLumens.recommended,
      wattsEach: sel.fixture.wattage,
      costLow: low * quantity,
      costHigh: high * quantity,
      note: tech.note,
    });
  }

  const totalFixtures = lines.reduce((s, l) => s + l.quantity, 0);
  const totalWatts = lines.reduce((s, l) => s + l.quantity * l.wattsEach, 0);
  const totalLumens = lines.reduce((s, l) => s + l.quantity * l.lumensEach, 0);

  let materialLow = lines.reduce((s, l) => s + l.costLow, 0);
  let materialHigh = lines.reduce((s, l) => s + l.costHigh, 0);

  const notes: string[] = [];
  let transformer: LandscapeResult['transformer'];
  let cableMeters: number | undefined;
  let cablePrice: number | undefined;
  let circuits: number | undefined;

  if (system === 'lowvoltage') {
    transformer = sizeTransformer(totalWatts, currency);
    materialLow += transformer.price;
    materialHigh += transformer.price;
    // Measured run from the site plan when available, else a per-fixture estimate.
    cableMeters =
      opts?.cableMetersOverride != null
        ? Math.round(opts.cableMetersOverride)
        : Math.round(totalFixtures * CABLE_M_PER_FIXTURE);
    const perM = CABLE_PRICE_PER_M[currency] ?? CABLE_PRICE_PER_M.USD ?? 0;
    cablePrice = Math.round(cableMeters * perM);
    materialLow += cablePrice;
    materialHigh += cablePrice;
    notes.push(
      `12V system: mount the ${transformer.sizeVA}VA transformer${transformer.count > 1 ? ` (×${transformer.count})` : ''} on a weatherproof exterior outlet, sized to about ${transformer.headroomPct}% headroom.`
    );
    notes.push(
      'Keep each cable run within voltage-drop limits; use a hub layout for long or heavily loaded runs.'
    );
  } else if (system === 'linevoltage') {
    // 230V markets carry ~2x the per-circuit wattage of 120V ones.
    const perCircuit = market.code === 'GHS' ? 3000 : 1500;
    circuits = Math.max(1, Math.ceil(totalWatts / perCircuit));
    notes.push(
      `Mains wiring must be installed by a qualified electrician on weatherproof RCD/GFCI-protected circuit${circuits > 1 ? 's' : ''} (about ${circuits} needed for this load).`
    );
  } else {
    notes.push(
      'Solar: place each panel where it gets unobstructed midday sun. Expect shorter runtime in the rainy season and after cloudy days; choose units with replaceable batteries.'
    );
  }

  // Labour: per-fixture finish labour for wired systems; solar is largely DIY.
  const install = system === 'solar' ? 0 : Math.round(totalFixtures * market.installCostPerFixture);
  const installedLow = materialLow + install;
  const installedHigh = materialHigh + install;

  // Running cost: solar draws no grid power.
  const annualEnergyCost =
    system === 'solar'
      ? 0
      : Math.round(((totalWatts / 1000) * NIGHT_HOURS * 365 * market.electricityRate));

  // Shared good-practice guidance.
  notes.push('Use warm 2700K light and shield fixtures to control glare and light trespass to neighbours.');
  if (substitutedAny) {
    notes.push('Some features use the closest available fixture for this system; swap to a matching model where possible.');
  }

  // Bill of materials, aggregated by fixture id.
  const agg = new Map<string, number>();
  const fixtureById = new Map<string, LandscapeFixture>();
  for (const l of lines) {
    agg.set(l.fixture.id, (agg.get(l.fixture.id) ?? 0) + l.quantity);
    fixtureById.set(l.fixture.id, l.fixture);
  }
  const bom: LandscapeBomLine[] = Array.from(agg, ([id, quantity]) => {
    const fixture = fixtureById.get(id)!;
    const [low, high] = fixturePriceRange(fixture, currency);
    return {
      fixture,
      quantity,
      unitPrice: fixturePrice(fixture, currency),
      costLow: low * quantity,
      costHigh: high * quantity,
    };
  }).sort((a, b) => a.fixture.name.localeCompare(b.fixture.name));

  return {
    system,
    lines,
    totalFixtures,
    totalWatts,
    totalLumens,
    transformer,
    cableMeters,
    cablePrice,
    circuits,
    materialLow: Math.round(materialLow),
    materialHigh: Math.round(materialHigh),
    install,
    installedLow: Math.round(installedLow),
    installedHigh: Math.round(installedHigh),
    annualEnergyCost,
    bom,
    notes,
  };
}

// Convert a stored-ft length to the active unit for display.
export function ftToUnit(ft: number, metric: boolean): number {
  return metric ? ft * FT_TO_M : ft;
}
export function unitToFt(value: number, metric: boolean): number {
  return metric ? value / FT_TO_M : value;
}

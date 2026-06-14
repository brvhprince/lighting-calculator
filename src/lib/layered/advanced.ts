import { CalculationResult, FixtureCategory, LayerKey } from '@/types';
import { FIXTURE_SIZES } from '@/lib/fixtureTypes';

// Advanced (layered) mode keeps the SAME required-lumens budget as Simple mode
// (room lumens/ft² × ceiling factor × daylight factor — computed by
// calculateLighting). The user then chooses real fixtures per layer and we check
// the installed total against that budget. Nothing here re-lights the room three
// times: the per-layer suggestions are SHARES of the one budget.

// Share of the room's required lumens suggested for each layer. Tunable.
// Ambient carries the baseline; task adds a local boost; accent is atmosphere.
export const LAYER_BUDGET_SHARE: Record<LayerKey, number> = {
  ambient: 0.6,
  task: 0.3,
  accent: 0.1,
};

// Which fixture families belong to each layer (brief §1, mapped to the existing
// FIXTURE_SIZES categories). The user picks specific sizes within these.
export const LAYER_FIXTURE_CATEGORIES: Record<LayerKey, FixtureCategory[]> = {
  ambient: ['recessed', 'pendant', 'linear'],
  task: ['track', 'linear'],
  accent: ['sconce', 'strip'],
};

// On-target band: within ±10% of target is "on target"; beyond ±25% is flagged
// as a strong under/over (the "very low / very high" the design should avoid).
const ON_TARGET_LOW = 0.9;
const ON_TARGET_HIGH = 1.1;
const STRONG_LOW = 0.75;
const STRONG_HIGH = 1.25;

export type Flag = {
  verdict: 'below' | 'on-target' | 'above';
  strong: boolean; // outside the ±25% band
  ratio: number; // achieved / target
  diff: number; // achieved − target (signed lumens)
  pct: number; // (ratio − 1) × 100
};

export function flagLumens(achieved: number, target: number): Flag {
  const ratio = target > 0 ? achieved / target : achieved > 0 ? Infinity : 1;
  const verdict = ratio < ON_TARGET_LOW ? 'below' : ratio > ON_TARGET_HIGH ? 'above' : 'on-target';
  const strong = ratio < STRONG_LOW || ratio > STRONG_HIGH;
  return {
    verdict,
    strong,
    ratio,
    diff: Math.round(achieved - target),
    pct: Math.round((ratio - 1) * 100),
  };
}

// Suggested per-layer lumen targets — the required budget split across the
// SELECTED layers (shares renormalised so they always sum to the budget).
export function suggestedLayerLumens(
  requiredLumens: number,
  selectedLayers: LayerKey[]
): Record<LayerKey, number> {
  const totalShare = selectedLayers.reduce((s, l) => s + LAYER_BUDGET_SHARE[l], 0) || 1;
  const out = { ambient: 0, task: 0, accent: 0 } as Record<LayerKey, number>;
  for (const l of selectedLayers) {
    out[l] = Math.round((requiredLumens * LAYER_BUDGET_SHARE[l]) / totalShare);
  }
  return out;
}

// Fixture presets available to a layer, each with its recommended lumens.
export function fixturesForLayer(layer: LayerKey): { key: string; name: string; lumens: number }[] {
  const cats = LAYER_FIXTURE_CATEGORIES[layer];
  return Object.entries(FIXTURE_SIZES)
    .filter(([, f]) => cats.includes(f.category))
    .map(([key, f]) => ({ key, name: f.name, lumens: f.typicalLumens.recommended }));
}

// User selection: per layer, a map of fixture preset key → quantity.
export type FixtureCounts = Record<LayerKey, Record<string, number>>;

export const emptyFixtureCounts = (): FixtureCounts => ({ ambient: {}, task: {}, accent: {} });

export type LayerTotals = {
  layer: LayerKey;
  fixtures: { key: string; name: string; quantity: number; lumens: number; subtotal: number }[];
  count: number;
  lumens: number;
};

export function layerTotals(layer: LayerKey, counts: FixtureCounts): LayerTotals {
  const map = counts[layer] || {};
  const fixtures = Object.entries(map)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => {
      const f = FIXTURE_SIZES[key];
      const lumens = f?.typicalLumens.recommended ?? 0;
      return { key, name: f?.name ?? key, quantity: qty, lumens, subtotal: qty * lumens };
    });
  return {
    layer,
    fixtures,
    count: fixtures.reduce((s, f) => s + f.quantity, 0),
    lumens: fixtures.reduce((s, f) => s + f.subtotal, 0),
  };
}

export type AdvancedTotals = {
  perLayer: Record<LayerKey, LayerTotals>;
  achievedLumens: number;
  totalFixtures: number;
};

export function computeAdvancedTotals(selectedLayers: LayerKey[], counts: FixtureCounts): AdvancedTotals {
  const perLayer = { ambient: layerTotals('ambient', counts), task: layerTotals('task', counts), accent: layerTotals('accent', counts) };
  const selected = selectedLayers;
  const achievedLumens = selected.reduce((s, l) => s + perLayer[l].lumens, 0);
  const totalFixtures = selected.reduce((s, l) => s + perLayer[l].count, 0);
  return { perLayer, achievedLumens, totalFixtures };
}

// Build a CalculationResult that represents the chosen layered design, so the
// full Simple result stack (delivered-light check, cost/energy, zones, products,
// shopping) works unchanged. We keep the room's adjustment factors from `base`
// but replace the fixture totals with the user's actual selection.
export function synthesizeLayeredResult(args: {
  base: CalculationResult; // from calculateLighting (required budget + factors)
  achievedLumens: number;
  totalFixtures: number;
  layerSummary: string; // e.g. "8× 6 inch recessed, 1× LED strip…"
}): CalculationResult {
  const { base, achievedLumens, totalFixtures } = args;
  const lumensPerFixture = totalFixtures > 0 ? Math.round(achievedLumens / totalFixtures) : 0;
  return {
    ...base,
    totalLumensNeeded: achievedLumens, // what this design actually installs
    numberOfFixtures: totalFixtures,
    lumensPerFixture,
    fixtureSize: 'Layered design',
    fixtureCategory: undefined,
    recommendations: [args.layerSummary, ...base.recommendations.slice(1)],
  };
}

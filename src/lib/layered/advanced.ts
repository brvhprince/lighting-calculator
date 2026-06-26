import { CalculationResult, FixtureCategory, FixtureItem, LayerKey } from '@/types';
import { getActiveFixtures, resolveFixture } from '@/lib/fixtureCatalog';

// Advanced (layered) mode keeps the SAME required-lumens budget as Simple mode
// (room lumens/ft² × ceiling factor × daylight factor, computed by
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

// Which fixture families are suggested as default rows for each layer (brief §1).
// A category may appear under more than one layer; this is a suggestion, not a
// restriction, since any fixture can be added to any layer.
export const LAYER_FIXTURE_CATEGORIES: Record<LayerKey, FixtureCategory[]> = {
  ambient: ['recessed', 'flush', 'pendant', 'linear'],
  task: ['track', 'linear', 'undercabinet', 'vanity', 'lamp'],
  accent: ['sconce', 'strip', 'undercabinet'],
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

// Suggested per-layer lumen targets, the required budget split across the
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

// A fixture offered in a picker: its catalogue id (key), display name, the
// lumens it contributes, and its category (for grouping in the "add" menu).
export type FixtureOption = { key: string; name: string; lumens: number; category: FixtureCategory };

const toOption = (f: { id: string; name: string; category: FixtureCategory; typicalLumens: { recommended: number } }): FixtureOption => ({
  key: f.id,
  name: f.name,
  lumens: f.typicalLumens.recommended,
  category: f.category,
});

// Suggested default rows for a layer: fixtures whose category maps to it. This is
// a suggestion for the picker, not a restriction, any fixture can still be added
// to any layer via allSelectableFixtures().
export function fixturesForLayer(layer: LayerKey): FixtureOption[] {
  const cats = LAYER_FIXTURE_CATEGORIES[layer];
  return getActiveFixtures()
    .filter((f) => cats.includes(f.category))
    .map(toOption);
}

// Every active fixture (built-in, admin, personal, registered design), for the
// "add any fixture to this layer" menu. No category gating.
export function allSelectableFixtures(): FixtureOption[] {
  return getActiveFixtures().map(toOption);
}

// The layer a category is suggested for (first match), used to label fixtures in
// the cross-layer "add" menu. Undefined when a category maps to no layer.
export function suggestedLayerForCategory(category: FixtureCategory): LayerKey | undefined {
  return (Object.keys(LAYER_FIXTURE_CATEGORIES) as LayerKey[]).find((l) =>
    LAYER_FIXTURE_CATEGORIES[l].includes(category)
  );
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

// Resolve a fixture id to a display name + lumens. Defaults to the live catalogue;
// restore flows pass a resolver that falls back to the saved snapshot (ghost).
export type FixtureResolve = (id: string) => { name: string; lumens: number } | undefined;

const defaultResolve: FixtureResolve = (id) => {
  const f = resolveFixture(id);
  return f ? { name: f.name, lumens: f.typicalLumens.recommended } : undefined;
};

export function layerTotals(
  layer: LayerKey,
  counts: FixtureCounts,
  resolve: FixtureResolve = defaultResolve
): LayerTotals {
  const map = counts[layer] || {};
  const fixtures = Object.entries(map)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => {
      const r = resolve(key);
      const lumens = r?.lumens ?? 0;
      return { key, name: r?.name ?? key, quantity: qty, lumens, subtotal: qty * lumens };
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
  fixtureItems: FixtureItem[]; // combined mix across selected layers, by fixture id
};

export function computeAdvancedTotals(
  selectedLayers: LayerKey[],
  counts: FixtureCounts,
  resolve: FixtureResolve = defaultResolve
): AdvancedTotals {
  const perLayer = {
    ambient: layerTotals('ambient', counts, resolve),
    task: layerTotals('task', counts, resolve),
    accent: layerTotals('accent', counts, resolve),
  };
  const selected = selectedLayers;
  const achievedLumens = selected.reduce((s, l) => s + perLayer[l].lumens, 0);
  const totalFixtures = selected.reduce((s, l) => s + perLayer[l].count, 0);

  // Merge identical fixture ids across layers (the same size can appear in two layers).
  const merged = new Map<string, number>();
  for (const l of selected) {
    for (const f of perLayer[l].fixtures) merged.set(f.key, (merged.get(f.key) ?? 0) + f.quantity);
  }
  const fixtureItems: FixtureItem[] = Array.from(merged, ([id, quantity]) => ({ id, quantity }));

  return { perLayer, achievedLumens, totalFixtures, fixtureItems };
}

// Build a CalculationResult that represents the chosen layered design, so the
// full Simple result stack (delivered-light check, cost/energy, zones, products,
// shopping) works unchanged. We keep the room's adjustment factors from `base`
// but replace the fixture totals with the user's actual selection.
export function synthesizeLayeredResult(args: {
  base: CalculationResult; // from calculateLighting (required budget + factors)
  achievedLumens: number;
  totalFixtures: number;
  fixtureItems: FixtureItem[]; // the chosen layer mix (drives per-fixture cost)
  layerSummary: string; // e.g. "8× 6 inch recessed, 1× LED strip…"
}): CalculationResult {
  const { base, achievedLumens, totalFixtures, fixtureItems } = args;
  const lumensPerFixture = totalFixtures > 0 ? Math.round(achievedLumens / totalFixtures) : 0;
  return {
    ...base,
    totalLumensNeeded: achievedLumens, // what this design actually installs
    numberOfFixtures: totalFixtures,
    lumensPerFixture,
    fixtureSize: 'Layered design',
    fixtureCategory: undefined,
    fixtureItems,
    recommendations: [args.layerSummary, ...base.recommendations.slice(1)],
  };
}

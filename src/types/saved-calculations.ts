import { CalculationInput, CalculationResult, FixtureDef, FixtureSnapshot, LayerKey } from './index';
import type { DesignerState } from '@/lib/shareUrl';

// Advanced (layered) selection: which layers are on, and the quantity of each
// preset fixture chosen per layer. Stored so a layered design fully restores.
export type AdvancedState = {
  selectedLayers: LayerKey[];
  fixtureCounts: Record<LayerKey, Record<string, number>>;
  // Custom and derived (override) fixtures this design references, carried inline
  // so the design restores on any browser even without the personal catalogue.
  // Derived overrides (source: 'derived') only ever live here, never in the
  // personal catalogue; user fixtures are copied here too for portability.
  customFixtures?: FixtureDef[];
};

export type SavedCalculation = {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  type: 'full' | 'lumens';
  // Which calculator produced this. Absent ⇒ legacy simple calculation.
  mode?: 'simple' | 'advanced';
  input: CalculationInput | LumensOnlyInput;
  result: CalculationResult | LumensOnlyResult;
  // Present for advanced (layered) saves, restores the layer/fixture selection.
  advanced?: AdvancedState;
  // Snapshot of every fixture this design references, so it still renders/costs
  // if a fixture is later edited or deleted from the catalogue.
  fixtureSnapshot?: FixtureSnapshot[];
  // Present when saved from the Room Designer, restores the actual drawn shape.
  designer?: DesignerState;
};

export type LumensOnlyInput = {
  length: number;
  width: number;
  roomType: string;
  unitSystem: 'metric' | 'imperial';
  customLumensPerSqFt?: number;
};

export type LumensOnlyResult = {
  totalLumens: number;
  lumensPerSqFt: number;
  area: number;
  areaUnit: string;
};

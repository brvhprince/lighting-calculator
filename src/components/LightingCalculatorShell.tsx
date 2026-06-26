'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calculator, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { calculateLighting, dimToFeet } from '@/lib/calculator';
import { decodeInput } from '@/lib/shareUrl';
import { CalculationInput, CalculationResult, FixtureSnapshot, RoomConfigValue, SharedInputs, UnitSystem } from '@/types';
import { AdvancedState, SavedCalculation } from '@/types/saved-calculations';
import { defaultRoomConfig } from './RoomConfigFields';
import { SavedCalculations } from './SavedCalculations';
import FullLightingCalculator from './FullLightingCalculator';
import AdvancedLightingCalculator from './AdvancedLightingCalculator';
import { useFixtures } from '@/context/FixturesProvider';

type Mode = 'simple' | 'advanced';

const defaultShared = (): SharedInputs => ({
  unitSystem: 'imperial',
  length: '',
  width: '',
  isExpert: false,
  config: defaultRoomConfig(),
});

const defaultAdvanced = (): AdvancedState => ({
  selectedLayers: ['ambient', 'task', 'accent'],
  fixtureCounts: { ambient: {}, task: {}, accent: {} },
});

// Owns all calculator state so the Simple/Advanced toggle (and restoring a save)
// preserves inputs across both modes. Both calculators are controlled by this.
export default function LightingCalculatorShell() {
  const [mode, setMode] = useState<Mode>('simple');
  const [shared, setShared] = useState<SharedInputs>(defaultShared);
  const [advanced, setAdvanced] = useState<AdvancedState>(defaultAdvanced);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [snapshot, setSnapshot] = useState<FixtureSnapshot[] | undefined>(undefined);
  const { registerDesignFixtures } = useFixtures();

  const onUnitSystem = (unitSystem: UnitSystem) => setShared((s) => ({ ...s, unitSystem }));
  const onLength = (length: string) => setShared((s) => ({ ...s, length }));
  const onWidth = (width: string) => setShared((s) => ({ ...s, width }));
  const onIsExpert = (isExpert: boolean) => setShared((s) => ({ ...s, isExpert }));
  const onConfig = (patch: Partial<RoomConfigValue>) =>
    setShared((s) => ({ ...s, config: { ...s.config, ...patch } }));

  const selectMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setResult(null); // a result belongs to the mode that produced it
    track('lighting_mode', { mode: next });
  };

  // Rehydrate the shared inputs from a stored CalculationInput.
  const applyInput = useCallback((input: CalculationInput) => {
    setShared({
      unitSystem: input.unitSystem,
      length: input.length.toString(),
      width: input.width.toString(),
      isExpert: input.isExpert,
      config: defaultRoomConfig({
        roomType: input.roomType,
        customRoomLumens:
          input.roomType === 'other' && input.customLumensPerSqFt
            ? String(input.customLumensPerSqFt)
            : '',
        customLumensPerSqFt:
          input.roomType !== 'other' && input.customLumensPerSqFt
            ? String(input.customLumensPerSqFt)
            : '',
        ceilingFt: input.ceilingHeight ? dimToFeet(input.ceilingHeight, input.unitSystem) : 8,
        sloped: input.slopedCeiling ?? false,
        ceilingPeakFt: input.ceilingPeakHeight
          ? dimToFeet(input.ceilingPeakHeight, input.unitSystem)
          : 0,
        naturalLight: input.naturalLight ?? 'none',
        fixtureSize: input.fixtureSize || '',
        customFixtureLumens: input.customFixtureLumens?.toString() || '',
      }),
    });
  }, []);

  // Load a shared configuration from the URL (?c=...) on first render (Simple).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const encoded = new URLSearchParams(window.location.search).get('c');
    if (!encoded) return;
    const input = decodeInput(encoded);
    if (input) {
      applyInput(input);
      setMode('simple');
      setResult(calculateLighting(input));
    }
  }, [applyInput]);

  const handleLoad = (calc: SavedCalculation) => {
    if (calc.type !== 'full') return;
    applyInput(calc.input as CalculationInput);
    const loadedMode: Mode = calc.mode === 'advanced' ? 'advanced' : 'simple';
    setAdvanced(calc.advanced ?? defaultAdvanced());
    // Register the design's custom/derived fixtures so cost, shopping and PDF
    // resolve them by id immediately on restore.
    if (calc.advanced?.customFixtures?.length) registerDesignFixtures(calc.advanced.customFixtures);
    setSnapshot(calc.fixtureSnapshot);
    setMode(loadedMode);
    setResult(calc.result as CalculationResult);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Calculator mode"
          className="inline-flex rounded-lg border border-border bg-muted/30 p-1"
        >
          <button
            role="tab"
            aria-selected={mode === 'simple'}
            onClick={() => selectMode('simple')}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              mode === 'simple'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Calculator className="h-4 w-4" />
            Simple
          </button>
          <button
            role="tab"
            aria-selected={mode === 'advanced'}
            onClick={() => selectMode('advanced')}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              mode === 'advanced'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="h-4 w-4" />
            Advanced · Layered lighting
          </button>
        </div>

        <SavedCalculations onLoad={handleLoad} />
      </div>

      {mode === 'simple' ? (
        <FullLightingCalculator
          shared={shared}
          onUnitSystem={onUnitSystem}
          onLength={onLength}
          onWidth={onWidth}
          onIsExpert={onIsExpert}
          onConfig={onConfig}
          result={result}
          setResult={setResult}
        />
      ) : (
        <AdvancedLightingCalculator
          shared={shared}
          onUnitSystem={onUnitSystem}
          onLength={onLength}
          onWidth={onWidth}
          onIsExpert={onIsExpert}
          onConfig={onConfig}
          advanced={advanced}
          onAdvanced={setAdvanced}
          result={result}
          setResult={setResult}
          snapshot={snapshot}
        />
      )}
    </div>
  );
}

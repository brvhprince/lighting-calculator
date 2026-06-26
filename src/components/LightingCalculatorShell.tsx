'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calculator, Layers, FilePlus2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';
import { calculateLighting, dimToFeet } from '@/lib/calculator';
import { decodeInput } from '@/lib/shareUrl';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { buildCalculationInput } from '@/lib/roomConfig';
import { saveCalculation, generateCalculationId } from '@/lib/savedCalculations';
import { snapshotFixtures } from '@/lib/fixtureCatalog';
import { CalculationInput, CalculationResult, FixtureDef, FixtureSnapshot, RoomConfigValue, SharedInputs, UnitSystem } from '@/types';
import { AdvancedState, SavedCalculation } from '@/types/saved-calculations';
import { defaultRoomConfig } from './RoomConfigFields';
import { SavedCalculations } from './SavedCalculations';
import FullLightingCalculator from './FullLightingCalculator';
import AdvancedLightingCalculator from './AdvancedLightingCalculator';
import { useFixtures } from '@/context/FixturesProvider';

type Mode = 'simple' | 'advanced';

const defaultShared = (): SharedInputs => ({
  unitSystem: 'metric',
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
  const [description, setDescription] = useState('');
  // The id of the restored save currently being edited (null = unsaved/new), so
  // we can offer "Save changes" (overwrite) alongside "Save as new".
  const [loadedId, setLoadedId] = useState<string | null>(null);
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
    setLoadedId(null); // and so does the "editing a save" link
    track('lighting_mode', { mode: next });
  };

  // Build a SavedCalculation for the current mode/inputs/result under a given id.
  const buildSaved = (id: string): SavedCalculation | null => {
    if (!result) return null;
    const { config } = shared;
    const roomName =
      config.roomType === 'other' && config.customRoomName
        ? config.customRoomName
        : ROOM_TYPES[config.roomType]?.name || 'Room';
    const suffix = mode === 'advanced' ? ' (layered)' : '';
    const ids = (result.fixtureItems ?? []).map((i) => i.id);
    const fresh = snapshotFixtures(ids);
    // Keep snapshots for still-referenced fixtures no longer in the catalogue.
    const carried = (snapshot ?? []).filter(
      (s) => ids.includes(s.id) && !fresh.some((f) => f.id === s.id)
    );
    const base: SavedCalculation = {
      id,
      name: `${roomName}${suffix} - ${result.area.toFixed(0)} ${result.areaUnit}`,
      description: description.trim() || undefined,
      timestamp: Date.now(),
      type: 'full',
      mode,
      input: buildCalculationInput(shared),
      result,
      fixtureSnapshot: [...fresh, ...carried],
    };
    if (mode !== 'advanced') return base;
    // Advanced: carry only custom/derived fixtures still referenced.
    const referenced = new Set<string>();
    for (const map of Object.values(advanced.fixtureCounts)) {
      for (const [k, q] of Object.entries(map)) if (q > 0) referenced.add(k);
    }
    const customFixtures = (advanced.customFixtures ?? []).filter((f: FixtureDef) =>
      referenced.has(f.id)
    );
    return {
      ...base,
      advanced: { ...advanced, customFixtures: customFixtures.length ? customFixtures : undefined },
    };
  };

  const onSaveNew = () => {
    const calc = buildSaved(generateCalculationId());
    if (!calc) return;
    saveCalculation(calc);
    setLoadedId(calc.id); // the new save becomes the one we're editing
    track('save_calculation', { mode, kind: 'new' });
  };

  const onSaveChanges = () => {
    if (!loadedId) return;
    const calc = buildSaved(loadedId);
    if (!calc) return;
    saveCalculation(calc);
    track('save_calculation', { mode, kind: 'update' });
  };

  // Reset everything to a blank slate, keeping the current mode.
  const onStartNew = () => {
    if (result && !window.confirm('Start a new calculation? Any unsaved changes will be lost.')) {
      return;
    }
    setShared(defaultShared());
    setAdvanced(defaultAdvanced());
    setResult(null);
    setSnapshot(undefined);
    setDescription('');
    setLoadedId(null);
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
    setDescription(calc.description ?? '');
    setLoadedId(calc.id); // mark this as the save we're now editing
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

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onStartNew} className="gap-1.5">
            <FilePlus2 className="h-4 w-4" />
            Start new
          </Button>
          <SavedCalculations onLoad={handleLoad} />
        </div>
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
          description={description}
          onDescription={setDescription}
          loadedId={loadedId}
          onSaveNew={onSaveNew}
          onSaveChanges={onSaveChanges}
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
          description={description}
          onDescription={setDescription}
          loadedId={loadedId}
          onSaveNew={onSaveNew}
          onSaveChanges={onSaveChanges}
        />
      )}
    </div>
  );
}

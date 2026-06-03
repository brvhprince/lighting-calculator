'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { Calculator, Grid3x3, Save, Wand2, Share2, Check, Pentagon } from 'lucide-react';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { ROOM_PRESETS, presetDimensions, RoomPreset } from '@/lib/roomPresets';
import { calculateLighting, dimToFeet } from '@/lib/calculator';
import { rectangleShape } from '@/lib/geometry';
import { resolveCustomLumensPerSqFt } from '@/lib/roomConfig';
import { CalculationInput, CalculationResult, UnitSystem, RoomConfigValue } from '@/types';
import { SavedCalculations } from './SavedCalculations';
import { SavedCalculation } from '@/types/saved-calculations';
import { saveCalculation, generateCalculationId } from '@/lib/savedCalculations';
import { PDFExport } from './PDFExport';
import { buildShareUrl, decodeInput, buildDesignerUrl, DesignerState } from '@/lib/shareUrl';
import { LightingResults } from './LightingResults';
import { RoomConfigFields, defaultRoomConfig } from './RoomConfigFields';

export default function FullLightingCalculator() {
  const router = useRouter();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [isExpert, setIsExpert] = useState(false);
  const [config, setConfig] = useState<RoomConfigValue>(() => defaultRoomConfig());
  const updateConfig = (patch: Partial<RoomConfigValue>) => setConfig((c) => ({ ...c, ...patch }));
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [description, setDescription] = useState<string>('');
  const [shareCopied, setShareCopied] = useState(false);

  // Ceiling/peak are stored in feet in config; CalculationInput expects the
  // active unit (resolveCeiling reads metric as m, imperial as ft).
  const ftToUnit = useCallback(
    (ft: number) => (unitSystem === 'metric' ? ft * 0.3048 : ft),
    [unitSystem]
  );

  const buildInput = useCallback((): CalculationInput => ({
    length: parseFloat(length),
    width: parseFloat(width),
    unitSystem,
    roomType: config.roomType,
    isExpert,
    ceilingHeight: config.ceilingFt ? ftToUnit(config.ceilingFt) : undefined,
    slopedCeiling: config.sloped || undefined,
    ceilingPeakHeight: config.sloped && config.ceilingPeakFt ? ftToUnit(config.ceilingPeakFt) : undefined,
    naturalLight: config.naturalLight !== 'none' ? config.naturalLight : undefined,
    customLumensPerSqFt: resolveCustomLumensPerSqFt(config),
    fixtureSize: config.fixtureSize || undefined,
    customFixtureLumens: config.customFixtureLumens ? parseFloat(config.customFixtureLumens) : undefined,
  }), [length, width, unitSystem, config, isExpert, ftToUnit]);

  // Apply a decoded/loaded input to the form state.
  const applyInput = useCallback((input: CalculationInput) => {
    setUnitSystem(input.unitSystem);
    setLength(input.length.toString());
    setWidth(input.width.toString());
    setIsExpert(input.isExpert);
    setConfig(
      defaultRoomConfig({
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
      })
    );
  }, []);

  // Load a shared configuration from the URL (?c=...) on first render.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const encoded = new URLSearchParams(window.location.search).get('c');
    if (!encoded) return;
    const input = decodeInput(encoded);
    if (input) {
      applyInput(input);
      setResult(calculateLighting(input));
    }
  }, [applyInput]);

  const handleShare = async () => {
    const url = buildShareUrl(buildInput());
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt('Copy this share link:', url);
    }
  };

  // Hand off to the Room Designer as an editable rectangle carrying the config.
  const openInDesigner = () => {
    if (!length || !width) {
      alert('Enter room dimensions first');
      return;
    }
    const wFt = dimToFeet(parseFloat(width), unitSystem);
    const lFt = dimToFeet(parseFloat(length), unitSystem);
    const state: DesignerState = {
      unit: unitSystem,
      config: { ...config, roomType: config.roomType || 'livingRoom' },
      points: rectangleShape(wFt, lFt),
    };
    router.push(buildDesignerUrl(state));
  };

  const handleCalculate = () => {
    if (!length || !width || !config.roomType) {
      alert('Please fill in room dimensions and select a room type');
      return;
    }

    if (config.roomType === 'other' && (!config.customRoomName || !config.customRoomLumens)) {
      alert('Please enter a room name and lumens per square foot for custom room type');
      return;
    }

    setResult(calculateLighting(buildInput()));
  };

  const handleSave = () => {
    if (!result) return;

    const input = buildInput();

    const roomName =
      config.roomType === 'other' && config.customRoomName
        ? config.customRoomName
        : ROOM_TYPES[config.roomType]?.name || 'Room';
    const savedCalc: SavedCalculation = {
      id: generateCalculationId(),
      name: `${roomName} - ${result.area.toFixed(0)} ${result.areaUnit}`,
      description: description.trim() || undefined,
      timestamp: Date.now(),
      type: 'full',
      input,
      result,
    };

    saveCalculation(savedCalc);
    alert('Calculation saved successfully!');
  };

  const handleLoad = (calculation: SavedCalculation) => {
    if (calculation.type !== 'full') return;
    applyInput(calculation.input as CalculationInput);
    setResult(calculation.result as CalculationResult);
  };

  const applyPreset = (preset: RoomPreset) => {
    const dims = presetDimensions(preset, unitSystem);
    setLength(dims.length);
    setWidth(dims.width);
    updateConfig({ roomType: preset.roomType, ceilingFt: preset.ceilingFt });
    setResult(null);
  };

  const getDimensionLabel = () => {
    return unitSystem === 'metric' ? 'millimeters (mm) or meters (m)' : 'inches or feet';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SavedCalculations onLoad={handleLoad} />
      </div>

      {/* Quick-apply room presets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wand2 className="h-4 w-4 text-brand-bronze" />
            Quick Start Templates
          </CardTitle>
          <CardDescription>
            Apply a common room size, then fine-tune the numbers below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ROOM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="group rounded-lg border border-border bg-muted/30 px-3 py-2 text-left transition-colors hover:border-brand-bronze hover:bg-accent/60"
              >
                <span className="block text-sm font-medium">{preset.label}</span>
                <span className="block text-xs text-muted-foreground">{preset.blurb}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Complete Lighting Calculator
          </CardTitle>
          <CardDescription>
            Calculate the number of lights, spacing, and lumens needed for your room
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unit System */}
          <div className="space-y-3">
            <Label>Measurement System</Label>
            <RadioGroup
              value={unitSystem}
              onValueChange={(value) => setUnitSystem(value as UnitSystem)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="imperial" id="imperial" />
                <Label htmlFor="imperial" className="font-normal cursor-pointer">
                  Imperial (ft/in)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="metric" id="metric" />
                <Label htmlFor="metric" className="font-normal cursor-pointer">
                  Metric (m/mm)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Room Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">
                Room Length <span className="text-muted-foreground text-xs">({getDimensionLabel()})</span>
              </Label>
              <Input
                id="length"
                type="number"
                placeholder={unitSystem === 'metric' ? '3658' : '144'}
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">
                Room Width <span className="text-muted-foreground text-xs">({getDimensionLabel()})</span>
              </Label>
              <Input
                id="width"
                type="number"
                placeholder={unitSystem === 'metric' ? '2439' : '96'}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
          </div>

          {/* Experience level */}
          <div className="space-y-3">
            <Label>Experience Level</Label>
            <RadioGroup
              value={isExpert ? 'expert' : 'homeowner'}
              onValueChange={(value) => setIsExpert(value === 'expert')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="homeowner" id="homeowner" />
                <Label htmlFor="homeowner" className="font-normal cursor-pointer">
                  Homeowner (Recommended defaults)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expert" id="expert" />
                <Label htmlFor="expert" className="font-normal cursor-pointer">
                  Professional (Custom values)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Shared room configuration */}
          <RoomConfigFields
            value={config}
            onChange={updateConfig}
            unitSystem={unitSystem}
            showAdvanced={isExpert}
            idPrefix="calc"
          />

          <Button onClick={handleCalculate} className="w-full" size="lg">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Lighting Requirements
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          <div className="flex flex-wrap items-end justify-end gap-3">
            <div className="min-w-[200px] flex-1 max-w-md space-y-1">
              <Label htmlFor="description-full" className="text-sm">
                Description (optional)
              </Label>
              <Input
                id="description-full"
                type="text"
                placeholder="e.g., Master bedroom closet, Guest room"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button onClick={openInDesigner} variant="outline" className="gap-2">
              <Pentagon className="h-4 w-4" />
              Open in Designer
            </Button>
            <Button onClick={handleShare} variant="outline" className="gap-2">
              {shareCopied ? <Check className="h-4 w-4 text-brand-sage" /> : <Share2 className="h-4 w-4" />}
              {shareCopied ? 'Link copied' : 'Share'}
            </Button>
            <PDFExport
              result={result}
              roomType={config.roomType}
              customRoomName={config.roomType === 'other' ? config.customRoomName : undefined}
            />
            <Button onClick={handleSave} variant="default" className="gap-2">
              <Save className="h-4 w-4" />
              Save Calculation
            </Button>
          </div>
          <LightingResults
            result={result}
            roomType={config.roomType}
            customRoomName={config.roomType === 'other' ? config.customRoomName : undefined}
            visual={
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5" />
                    Spacing &amp; Layout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Grid Layout:</span>
                      <span className="font-semibold">
                        {result.spacing.layout.rows} rows × {result.spacing.layout.columns} columns
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance from Wall:</span>
                      <span className="font-semibold">
                        {result.spacing.fromWall} {result.spacing.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Row Spacing:</span>
                      <span className="font-semibold">
                        {result.spacing.layout.rowSpacing} {result.spacing.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Column Spacing:</span>
                      <span className="font-semibold">
                        {result.spacing.layout.columnSpacing} {result.spacing.unit}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="aspect-square w-full border-2 border-dashed rounded-lg p-4 relative bg-muted/20">
                      <div
                        className="absolute inset-0 grid gap-2 p-4"
                        style={{
                          gridTemplateColumns: `repeat(${result.spacing.layout.columns}, 1fr)`,
                          gridTemplateRows: `repeat(${result.spacing.layout.rows}, 1fr)`,
                        }}
                      >
                        {Array.from({ length: result.numberOfFixtures }).map((_, i) => (
                          <div key={i} className="flex items-center justify-center">
                            <div className="w-3 h-3 bg-brand-bronze rounded-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Fixture layout visualization
                    </p>
                  </div>
                </CardContent>
              </Card>
            }
          />
        </>
      )}
    </div>
  );
}

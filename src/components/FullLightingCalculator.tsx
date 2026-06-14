'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Calculator, Grid3x3, Save, Wand2, Share2, Check, Pentagon } from 'lucide-react';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { ROOM_PRESETS, presetDimensions, RoomPreset } from '@/lib/roomPresets';
import { calculateLighting, dimToFeet } from '@/lib/calculator';
import { rectangleShape } from '@/lib/geometry';
import { buildCalculationInput } from '@/lib/roomConfig';
import { track } from '@/lib/analytics';
import { CalculationInput, CalculationResult, RoomConfigValue, UnitSystem } from '@/types';
import { SavedCalculation } from '@/types/saved-calculations';
import { saveCalculation, generateCalculationId } from '@/lib/savedCalculations';
import { PDFExport } from './PDFExport';
import { buildShareUrl, buildDesignerUrl, DesignerState } from '@/lib/shareUrl';
import { LightingResults } from './LightingResults';
import { RoomInputs, SharedInputs } from './RoomInputs';

type Props = {
  shared: SharedInputs;
  onUnitSystem: (u: UnitSystem) => void;
  onLength: (v: string) => void;
  onWidth: (v: string) => void;
  onIsExpert: (v: boolean) => void;
  onConfig: (patch: Partial<RoomConfigValue>) => void;
  result: CalculationResult | null;
  setResult: (r: CalculationResult | null) => void;
};

export default function FullLightingCalculator({
  shared,
  onUnitSystem,
  onLength,
  onWidth,
  onIsExpert,
  onConfig,
  result,
  setResult,
}: Props) {
  const router = useRouter();
  const { unitSystem, length, width, config } = shared;
  const [description, setDescription] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  const buildInput = useCallback((): CalculationInput => buildCalculationInput(shared), [shared]);

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
    track('open_in_designer', { room: config.roomType });
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
    track('calculate', { room: config.roomType, unit: unitSystem });
  };

  const handleSave = () => {
    if (!result) return;

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
      mode: 'simple',
      input: buildInput(),
      result,
    };

    saveCalculation(savedCalc);
    alert('Calculation saved successfully!');
  };

  const applyPreset = (preset: RoomPreset) => {
    const dims = presetDimensions(preset, unitSystem);
    onLength(dims.length);
    onWidth(dims.width);
    onConfig({ roomType: preset.roomType, ceilingFt: preset.ceilingFt });
    setResult(null);
  };

  return (
    <div className="space-y-6">
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
          <RoomInputs
            value={shared}
            onUnitSystem={onUnitSystem}
            onLength={onLength}
            onWidth={onWidth}
            onIsExpert={onIsExpert}
            onConfig={onConfig}
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

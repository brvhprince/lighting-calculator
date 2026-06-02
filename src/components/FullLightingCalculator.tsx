'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calculator, Lightbulb, Ruler, Grid3x3, Save, ArrowUpDown, Wand2, Share2, Check } from 'lucide-react';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { FIXTURE_SIZES } from '@/lib/fixtureTypes';
import { ROOM_PRESETS, presetDimensions, RoomPreset } from '@/lib/roomPresets';
import { calculateLighting } from '@/lib/calculator';
import { CalculationInput, CalculationResult, UnitSystem, NaturalLightLevel } from '@/types';
import { SavedCalculations } from './SavedCalculations';
import { SavedCalculation } from '@/types/saved-calculations';
import { saveCalculation, generateCalculationId } from '@/lib/savedCalculations';
import { ShoppingList } from './ShoppingList';
import { PDFExport } from './PDFExport';
import { buildShareUrl, decodeInput } from '@/lib/shareUrl';
import { CostEnergyEstimator } from './CostEnergyEstimator';
import { LightingZones } from './LightingZones';
import { ProductRecommendations } from './ProductRecommendations';

export default function FullLightingCalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [ceilingHeight, setCeilingHeight] = useState<string>('');
  const [slopedCeiling, setSlopedCeiling] = useState(false);
  const [ceilingPeakHeight, setCeilingPeakHeight] = useState<string>('');
  const [naturalLight, setNaturalLight] = useState<NaturalLightLevel>('none');
  const [roomType, setRoomType] = useState<string>('');
  const [customRoomName, setCustomRoomName] = useState<string>('');
  const [customRoomLumens, setCustomRoomLumens] = useState<string>('');
  const [isExpert, setIsExpert] = useState(false);
  const [customLumens, setCustomLumens] = useState<string>('');
  const [fixtureSize, setFixtureSize] = useState<string>('');
  const [customFixtureLumens, setCustomFixtureLumens] = useState<string>('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [description, setDescription] = useState<string>('');
  const [shareCopied, setShareCopied] = useState(false);

  const buildInput = useCallback((): CalculationInput => ({
    length: parseFloat(length),
    width: parseFloat(width),
    unitSystem,
    roomType,
    isExpert,
    ceilingHeight: ceilingHeight ? parseFloat(ceilingHeight) : undefined,
    slopedCeiling: slopedCeiling || undefined,
    ceilingPeakHeight: slopedCeiling && ceilingPeakHeight ? parseFloat(ceilingPeakHeight) : undefined,
    naturalLight: naturalLight !== 'none' ? naturalLight : undefined,
    customLumensPerSqFt:
      roomType === 'other' && customRoomLumens
        ? parseFloat(customRoomLumens)
        : customLumens
        ? parseFloat(customLumens)
        : undefined,
    fixtureSize: fixtureSize || undefined,
    customFixtureLumens: customFixtureLumens ? parseFloat(customFixtureLumens) : undefined,
  }), [length, width, unitSystem, roomType, isExpert, ceilingHeight, slopedCeiling, ceilingPeakHeight, naturalLight, customRoomLumens, customLumens, fixtureSize, customFixtureLumens]);

  // Apply a decoded/loaded input to the form state.
  const applyInput = useCallback((input: CalculationInput) => {
    setUnitSystem(input.unitSystem);
    setLength(input.length.toString());
    setWidth(input.width.toString());
    setRoomType(input.roomType);
    setIsExpert(input.isExpert);
    setCeilingHeight(input.ceilingHeight?.toString() || '');
    setSlopedCeiling(input.slopedCeiling ?? false);
    setCeilingPeakHeight(input.ceilingPeakHeight?.toString() || '');
    setNaturalLight(input.naturalLight ?? 'none');
    setCustomLumens(input.customLumensPerSqFt?.toString() || '');
    setFixtureSize(input.fixtureSize || '');
    setCustomFixtureLumens(input.customFixtureLumens?.toString() || '');
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

  const handleCalculate = () => {
    if (!length || !width || !roomType) {
      alert('Please fill in room dimensions and select a room type');
      return;
    }

    if (roomType === 'other') {
      if (!customRoomName || !customRoomLumens) {
        alert('Please enter a room name and lumens per square foot for custom room type');
        return;
      }
    }

    setResult(calculateLighting(buildInput()));
  };

  const handleSave = () => {
    if (!result) return;

    const input = buildInput();

    const roomName = roomType === 'other' && customRoomName
      ? customRoomName
      : ROOM_TYPES[roomType]?.name || 'Room';
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
    setCeilingHeight(dims.ceiling);
    setRoomType(preset.roomType);
    setResult(null);
  };

  const getDimensionLabel = () => {
    return unitSystem === 'metric' ? 'millimeters (mm) or meters (m)' : 'inches or feet';
  };

  const getCeilingLabel = () => {
    return unitSystem === 'metric' ? 'meters (m)' : 'feet (ft)';
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

          {/* Ceiling Height */}
          <div className="space-y-2">
            <Label htmlFor="ceilingHeight" className="flex items-center gap-1.5">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              Ceiling Height <span className="text-muted-foreground text-xs">({getCeilingLabel()}, optional)</span>
            </Label>
            <Input
              id="ceilingHeight"
              type="number"
              placeholder={unitSystem === 'metric' ? '2.7' : '8'}
              value={ceilingHeight}
              onChange={(e) => setCeilingHeight(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Taller ceilings need more output to reach the floor. Leave blank to assume a standard{' '}
              {unitSystem === 'metric' ? '2.4 m' : '8 ft'} ceiling.
            </p>
          </div>

          {/* Sloped / vaulted ceiling */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-[hsl(var(--brand-bronze))]"
                checked={slopedCeiling}
                onChange={(e) => setSlopedCeiling(e.target.checked)}
              />
              <span className="text-sm font-medium">Sloped / vaulted ceiling</span>
            </label>
            {slopedCeiling && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="ceilingPeak">
                  Peak Height <span className="text-muted-foreground text-xs">({getCeilingLabel()})</span>
                </Label>
                <Input
                  id="ceilingPeak"
                  type="number"
                  placeholder={unitSystem === 'metric' ? '3.6' : '12'}
                  value={ceilingPeakHeight}
                  onChange={(e) => setCeilingPeakHeight(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We design to the average of the wall height (above) and this peak.
                </p>
              </div>
            )}
          </div>

          {/* Natural light */}
          <div className="space-y-2">
            <Label htmlFor="naturalLight">Natural Light</Label>
            <Select value={naturalLight} onValueChange={(v) => setNaturalLight(v as NaturalLightLevel)}>
              <SelectTrigger id="naturalLight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No / minimal windows</SelectItem>
                <SelectItem value="some">Some daylight (standard windows)</SelectItem>
                <SelectItem value="ample">Ample daylight (large windows / skylights)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Daylight offsets artificial lighting needs by up to 20%.
            </p>
          </div>

          {/* Room Type */}
          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Select value={roomType} onValueChange={setRoomType}>
              <SelectTrigger id="roomType">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROOM_TYPES).map(([key, room]) => (
                  <SelectItem key={key} value={key}>
                    {room.name} ({room.lumensPerSqFt.recommended} lumens/ft²)
                  </SelectItem>
                ))}
                <SelectItem value="other">Other (Custom)</SelectItem>
              </SelectContent>
            </Select>
            {roomType && roomType !== 'other' && (
              <p className="text-sm text-muted-foreground">
                {ROOM_TYPES[roomType]?.description}
              </p>
            )}
          </div>

          {/* Custom Room Type Fields */}
          {roomType === 'other' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold text-sm">Custom Room Type</h4>
              <div className="space-y-2">
                <Label htmlFor="customRoomName">Room Name</Label>
                <Input
                  id="customRoomName"
                  type="text"
                  placeholder="e.g., Sunroom, Workshop, Studio"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customRoomLumens">Lumens per Square Foot</Label>
                <Input
                  id="customRoomLumens"
                  type="number"
                  placeholder="e.g., 30"
                  value={customRoomLumens}
                  onChange={(e) => setCustomRoomLumens(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Typical range: 10-80 lumens/ft² depending on room purpose
                </p>
              </div>
            </div>
          )}

          {/* Expert Mode Toggle */}
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

          {/* Expert Options */}
          {isExpert && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold text-sm">Professional Options</h4>

              <div className="space-y-2">
                <Label htmlFor="customLumens">
                  Custom Lumens per Square Foot (optional)
                </Label>
                <Input
                  id="customLumens"
                  type="number"
                  placeholder="e.g., 35"
                  value={customLumens}
                  onChange={(e) => setCustomLumens(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fixtureSize">Fixture Size (optional)</Label>
                <Select value={fixtureSize || undefined} onValueChange={setFixtureSize}>
                  <SelectTrigger id="fixtureSize">
                    <SelectValue placeholder="Auto-select based on room" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIXTURE_SIZES).map(([key, fixture]) => (
                      <SelectItem key={key} value={key}>
                        {fixture.name} ({fixture.typicalLumens.recommended} lumens typical)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customFixtureLumens">
                  Fixture Lumen Rating (optional)
                </Label>
                <Input
                  id="customFixtureLumens"
                  type="number"
                  placeholder="e.g., 800"
                  value={customFixtureLumens}
                  onChange={(e) => setCustomFixtureLumens(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the exact lumen rating of your fixtures if known
                </p>
              </div>
            </div>
          )}

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
            <Button onClick={handleShare} variant="outline" className="gap-2">
              {shareCopied ? <Check className="h-4 w-4 text-brand-sage" /> : <Share2 className="h-4 w-4" />}
              {shareCopied ? 'Link copied' : 'Share'}
            </Button>
            <PDFExport
              result={result}
              roomType={roomType}
              customRoomName={roomType === 'other' ? customRoomName : undefined}
            />
            <Button onClick={handleSave} variant="default" className="gap-2">
              <Save className="h-4 w-4" />
              Save Calculation
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
          {/* Main Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Lighting Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Room Area</p>
                  <p className="text-2xl font-bold">
                    {result.area.toFixed(1)} {result.areaUnit}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Lumens</p>
                  <p className="text-2xl font-bold">
                    {result.totalLumensNeeded.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Number of Fixtures:</span>
                  <span className="font-semibold">{result.numberOfFixtures}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fixture Size:</span>
                  <span className="font-semibold">{result.fixtureSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lumens per Fixture:</span>
                  <span className="font-semibold">{result.lumensPerFixture}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lumens per Sq Ft:</span>
                  <span className="font-semibold">{result.lumensPerSqFt}</span>
                </div>
                {result.ceilingFactor != null && result.ceilingFactor !== 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Ceiling Adjustment ({result.ceilingHeightFt?.toFixed(1)} ft):
                    </span>
                    <span className="font-semibold text-brand-bronze">
                      {result.ceilingFactor > 1 ? '+' : ''}
                      {Math.round((result.ceilingFactor - 1) * 100)}%
                    </span>
                  </div>
                )}
                {result.naturalLightFactor != null && result.naturalLightFactor !== 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daylight Reduction:</span>
                    <span className="font-semibold text-brand-sage">
                      −{Math.round((1 - result.naturalLightFactor) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spacing Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5" />
                Spacing & Layout
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
                  <div className="absolute inset-0 grid gap-2 p-4"
                    style={{
                      gridTemplateColumns: `repeat(${result.spacing.layout.columns}, 1fr)`,
                      gridTemplateRows: `repeat(${result.spacing.layout.rows}, 1fr)`,
                    }}
                  >
                    {Array.from({ length: result.numberOfFixtures }).map((_, i) => (
                      <div key={i} className="flex items-center justify-center">
                        <div className="w-3 h-3 bg-primary rounded-full" />
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

          {/* Recommendations */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

          {/* Layered lighting plan */}
          <LightingZones roomType={roomType} totalLumens={result.totalLumensNeeded} />

          {/* Cost & Energy */}
          <CostEnergyEstimator result={result} />

          {/* Product recommendations */}
          <ProductRecommendations
            roomType={roomType}
            ceilingHeightFt={result.ceilingHeightFt ?? 8}
          />

          {/* Shopping List */}
          <ShoppingList
            result={result}
            roomType={roomType}
            customRoomName={roomType === 'other' ? customRoomName : undefined}
          />
        </>
      )}
    </div>
  );
}

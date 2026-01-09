'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calculator, Lightbulb, Ruler, Grid3x3, Save } from 'lucide-react';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { FIXTURE_SIZES } from '@/lib/fixtureTypes';
import { calculateLighting } from '@/lib/calculator';
import { CalculationInput, CalculationResult, UnitSystem } from '@/types';
import { SavedCalculations } from './SavedCalculations';
import { SavedCalculation } from '@/types/saved-calculations';
import { saveCalculation, generateCalculationId } from '@/lib/savedCalculations';
import { ShoppingList } from './ShoppingList';
import { PDFExport } from './PDFExport';

export default function FullLightingCalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [roomType, setRoomType] = useState<string>('');
  const [isExpert, setIsExpert] = useState(false);
  const [customLumens, setCustomLumens] = useState<string>('');
  const [fixtureSize, setFixtureSize] = useState<string>('');
  const [customFixtureLumens, setCustomFixtureLumens] = useState<string>('');
  const [result, setResult] = useState<CalculationResult | null>(null);

  const handleCalculate = () => {
    if (!length || !width || !roomType) {
      alert('Please fill in room dimensions and select a room type');
      return;
    }

    const input: CalculationInput = {
      length: parseFloat(length),
      width: parseFloat(width),
      unitSystem,
      roomType,
      isExpert,
      customLumensPerSqFt: customLumens ? parseFloat(customLumens) : undefined,
      fixtureSize: fixtureSize || undefined,
      customFixtureLumens: customFixtureLumens ? parseFloat(customFixtureLumens) : undefined,
    };

    const calculationResult = calculateLighting(input);
    setResult(calculationResult);
  };

  const handleSave = () => {
    if (!result) return;

    const input: CalculationInput = {
      length: parseFloat(length),
      width: parseFloat(width),
      unitSystem,
      roomType,
      isExpert,
      customLumensPerSqFt: customLumens ? parseFloat(customLumens) : undefined,
      fixtureSize: fixtureSize || undefined,
      customFixtureLumens: customFixtureLumens ? parseFloat(customFixtureLumens) : undefined,
    };

    const roomName = ROOM_TYPES[roomType]?.name || 'Room';
    const savedCalc: SavedCalculation = {
      id: generateCalculationId(),
      name: `${roomName} - ${result.area.toFixed(0)} ${result.areaUnit}`,
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

    const input = calculation.input as CalculationInput;
    setUnitSystem(input.unitSystem);
    setLength(input.length.toString());
    setWidth(input.width.toString());
    setRoomType(input.roomType);
    setIsExpert(input.isExpert);
    setCustomLumens(input.customLumensPerSqFt?.toString() || '');
    setFixtureSize(input.fixtureSize || '');
    setCustomFixtureLumens(input.customFixtureLumens?.toString() || '');
    setResult(calculation.result as CalculationResult);
  };

  const getDimensionLabel = () => {
    return unitSystem === 'metric' ? 'millimeters (mm) or meters (m)' : 'inches or feet';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SavedCalculations onLoad={handleLoad} />
      </div>
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
              </SelectContent>
            </Select>
            {roomType && (
              <p className="text-sm text-muted-foreground">
                {ROOM_TYPES[roomType]?.description}
              </p>
            )}
          </div>

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
          <div className="flex justify-end gap-3">
            <PDFExport result={result} roomType={roomType} />
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

          {/* Shopping List */}
          <ShoppingList result={result} roomType={roomType} />
        </>
      )}
    </div>
  );
}

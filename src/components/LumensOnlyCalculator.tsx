'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Lightbulb, Zap, Save } from 'lucide-react';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { calculateLumensOnly } from '@/lib/calculator';
import { UnitSystem } from '@/types';
import { SavedCalculations } from './SavedCalculations';
import { SavedCalculation, LumensOnlyInput, LumensOnlyResult } from '@/types/saved-calculations';
import { saveCalculation, generateCalculationId } from '@/lib/savedCalculations';

export default function LumensOnlyCalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [roomType, setRoomType] = useState<string>('');
  const [customRoomName, setCustomRoomName] = useState<string>('');
  const [customRoomLumens, setCustomRoomLumens] = useState<string>('');
  const [customLumens, setCustomLumens] = useState<string>('');
  const [result, setResult] = useState<{
    totalLumens: number;
    lumensPerSqFt: number;
    area: number;
    areaUnit: string;
  } | null>(null);

  const handleCalculate = () => {
    if (!length || !width || !roomType) {
      alert('Please fill in all required fields');
      return;
    }

    if (roomType === 'other') {
      if (!customRoomName || !customRoomLumens) {
        alert('Please enter a room name and lumens per square foot for custom room type');
        return;
      }
    }

    const lumensPerSqFt = roomType === 'other' && customRoomLumens
      ? parseFloat(customRoomLumens)
      : customLumens
      ? parseFloat(customLumens)
      : undefined;

    const calculationResult = calculateLumensOnly(
      parseFloat(length),
      parseFloat(width),
      roomType,
      unitSystem,
      lumensPerSqFt
    );

    setResult(calculationResult);
  };

  const handleSave = () => {
    if (!result) return;

    const input: LumensOnlyInput = {
      length: parseFloat(length),
      width: parseFloat(width),
      roomType,
      unitSystem,
      customLumensPerSqFt: roomType === 'other' && customRoomLumens
        ? parseFloat(customRoomLumens)
        : customLumens
        ? parseFloat(customLumens)
        : undefined,
    };

    const roomName = roomType === 'other' && customRoomName
      ? customRoomName
      : ROOM_TYPES[roomType]?.name || 'Room';
    const savedCalc: SavedCalculation = {
      id: generateCalculationId(),
      name: `${roomName} Lumens - ${result.area.toFixed(0)} ${result.areaUnit}`,
      timestamp: Date.now(),
      type: 'lumens',
      input,
      result,
    };

    saveCalculation(savedCalc);
    alert('Calculation saved successfully!');
  };

  const handleLoad = (calculation: SavedCalculation) => {
    if (calculation.type !== 'lumens') return;

    const input = calculation.input as LumensOnlyInput;
    setUnitSystem(input.unitSystem);
    setLength(input.length.toString());
    setWidth(input.width.toString());
    setRoomType(input.roomType);
    setCustomLumens(input.customLumensPerSqFt?.toString() || '');
    setResult(calculation.result as LumensOnlyResult);
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
            <Lightbulb className="h-6 w-6" />
            Lumens Calculator
          </CardTitle>
          <CardDescription>
            Calculate total lumens needed for your room
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
                <RadioGroupItem value="imperial" id="imperial-lumens" />
                <Label htmlFor="imperial-lumens" className="font-normal cursor-pointer">
                  Imperial (ft/in)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="metric" id="metric-lumens" />
                <Label htmlFor="metric-lumens" className="font-normal cursor-pointer">
                  Metric (m/mm)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Room Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length-lumens">
                Room Length <span className="text-muted-foreground text-xs">({getDimensionLabel()})</span>
              </Label>
              <Input
                id="length-lumens"
                type="number"
                placeholder={unitSystem === 'metric' ? '3658' : '144'}
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width-lumens">
                Room Width <span className="text-muted-foreground text-xs">({getDimensionLabel()})</span>
              </Label>
              <Input
                id="width-lumens"
                type="number"
                placeholder={unitSystem === 'metric' ? '2439' : '96'}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
          </div>

          {/* Room Type */}
          <div className="space-y-2">
            <Label htmlFor="roomType-lumens">Room Type</Label>
            <Select value={roomType} onValueChange={setRoomType}>
              <SelectTrigger id="roomType-lumens">
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
                <Label htmlFor="customRoomName-lumens">Room Name</Label>
                <Input
                  id="customRoomName-lumens"
                  type="text"
                  placeholder="e.g., Sunroom, Workshop, Studio"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customRoomLumens-lumens">Lumens per Square Foot</Label>
                <Input
                  id="customRoomLumens-lumens"
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

          {/* Custom Lumens (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customLumens-only">
              Custom Lumens per Square Foot (optional)
            </Label>
            <Input
              id="customLumens-only"
              type="number"
              placeholder="Leave empty for recommended value"
              value={customLumens}
              onChange={(e) => setCustomLumens(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Override the recommended lumens/ft² if you have specific requirements
            </p>
          </div>

          <Button onClick={handleCalculate} className="w-full" size="lg">
            <Zap className="mr-2 h-4 w-4" />
            Calculate Lumens
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          <div className="flex justify-end">
            <Button onClick={handleSave} variant="default" className="gap-2">
              <Save className="h-4 w-4" />
              Save Calculation
            </Button>
          </div>
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Your Lighting Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 text-center p-6 border rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">Room Area</p>
                <p className="text-3xl font-bold text-primary">
                  {result.area.toFixed(1)}
                </p>
                <p className="text-sm font-medium">{result.areaUnit}</p>
              </div>

              <div className="space-y-2 text-center p-6 border rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground">Lumens per Sq Ft</p>
                <p className="text-3xl font-bold text-primary">
                  {result.lumensPerSqFt}
                </p>
                <p className="text-sm font-medium">lumens/ft²</p>
              </div>

              <div className="space-y-2 text-center p-6 border rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground">Total Lumens Needed</p>
                <p className="text-3xl font-bold text-primary">
                  {result.totalLumens.toLocaleString()}
                </p>
                <p className="text-sm font-medium">lumens</p>
              </div>
            </div>

            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                What This Means
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    When shopping for lights, the combined lumen output of all your fixtures
                    should total approximately <strong>{result.totalLumens.toLocaleString()} lumens</strong>.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    This calculation is based on {result.lumensPerSqFt} lumens per square foot
                    {roomType === 'other' && customRoomName
                      ? `, which you specified for your ${customRoomName.toLowerCase()}.`
                      : roomType !== 'other'
                      ? `, which is appropriate for a ${ROOM_TYPES[roomType]?.name.toLowerCase()}.`
                      : '.'}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    For complete fixture planning including spacing and layout,
                    use the Complete Lighting Calculator.
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}

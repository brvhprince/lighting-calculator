'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Layers, Sun, Lightbulb, Sparkles, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { dimToFeet, resolveCeiling } from '@/lib/calculator';
import { track } from '@/lib/analytics';
import { CalculationInput, FixtureCategory, LayerKey, UnitSystem } from '@/types';
import { ROOM_PROFILES, hasRoomProfile, getRoomProfile } from '@/lib/layered/roomProfiles';
import { distributeLayers, areaInUnit, LayeredResult } from '@/lib/layered/distribute';
import { LAYER_INFO, KRUITHOF_NOTE } from '@/lib/layered/guidance';
import { kelvinToCss } from '@/lib/cct';

const ORDERED_LAYERS: LayerKey[] = ['ambient', 'task', 'accent'];
const LAYER_ICON: Record<LayerKey, typeof Sun> = { ambient: Sun, task: Lightbulb, accent: Sparkles };

// Rooms with a layered profile (§3). Advanced mode is limited to these.
const PROFILE_ROOMS = Object.keys(ROOM_PROFILES).filter((k) => k in ROOM_TYPES);

export default function AdvancedLightingCalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [ceiling, setCeiling] = useState('');
  const [roomType, setRoomType] = useState('');
  const [selectedLayers, setSelectedLayers] = useState<LayerKey[]>(['ambient', 'task', 'accent']);
  const [fixtureOverride, setFixtureOverride] = useState<Partial<Record<LayerKey, FixtureCategory>>>(
    {}
  );
  const [result, setResult] = useState<LayeredResult | null>(null);

  const dimensionLabel = unitSystem === 'metric' ? 'mm or m' : 'inches or feet';
  const profile = roomType ? getRoomProfile(roomType) : undefined;

  const toggleLayer = (layer: LayerKey) => {
    setSelectedLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]
    );
  };

  const handleCalculate = () => {
    if (!length || !width || !roomType) {
      alert('Please enter room dimensions and select a room type');
      return;
    }
    const activeProfile = getRoomProfile(roomType);
    if (!activeProfile) {
      alert('This room does not have a layered profile yet.');
      return;
    }
    if (selectedLayers.length === 0) {
      alert('Select at least one lighting layer');
      return;
    }

    // Floor area in ft² (mirrors the existing calculator's unit handling).
    const lFt = dimToFeet(parseFloat(length), unitSystem);
    const wFt = dimToFeet(parseFloat(width), unitSystem);
    const areaSqFt = lFt * wFt;
    const ceilingHeightFt = resolveCeiling(
      ceiling ? parseFloat(ceiling) : undefined,
      unitSystem
    );

    // Order layers canonically so ambient is computed before task (task subtracts
    // the ambient baseline — see distributeLayers).
    const layers = ORDERED_LAYERS.filter((l) => selectedLayers.includes(l));

    setResult(
      distributeLayers({
        profile: activeProfile,
        areaSqFt,
        ceilingHeightFt,
        selection: { layers, fixtureOverride },
      })
    );
    track('calculate_layered', { room: roomType, unit: unitSystem, layers: layers.join('+') });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-brand-bronze" />
            Layered Lighting Designer
          </CardTitle>
          <CardDescription>
            Design a room in layers — ceiling, task and mood lighting. Each layer is sized for its
            own share of the room&apos;s light, so the result is correctly lit rather than
            triple-lit.
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
                <RadioGroupItem value="imperial" id="adv-imperial" />
                <Label htmlFor="adv-imperial" className="font-normal cursor-pointer">
                  Imperial (ft/in)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="metric" id="adv-metric" />
                <Label htmlFor="adv-metric" className="font-normal cursor-pointer">
                  Metric (m/mm)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Room type — limited to rooms with a layered profile */}
          <div className="space-y-2">
            <Label htmlFor="adv-room">Room Type</Label>
            <Select
              value={roomType}
              onValueChange={(v) => {
                setRoomType(v);
                setFixtureOverride({});
                setResult(null);
              }}
            >
              <SelectTrigger id="adv-room">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_ROOMS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {ROOM_TYPES[key].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dimensions + ceiling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adv-length">
                Length <span className="text-muted-foreground text-xs">({dimensionLabel})</span>
              </Label>
              <Input
                id="adv-length"
                type="number"
                placeholder={unitSystem === 'metric' ? '3658' : '144'}
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adv-width">
                Width <span className="text-muted-foreground text-xs">({dimensionLabel})</span>
              </Label>
              <Input
                id="adv-width"
                type="number"
                placeholder={unitSystem === 'metric' ? '2439' : '96'}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adv-ceiling">
                Ceiling height{' '}
                <span className="text-muted-foreground text-xs">
                  ({unitSystem === 'metric' ? 'm' : 'ft'}, optional)
                </span>
              </Label>
              <Input
                id="adv-ceiling"
                type="number"
                placeholder={unitSystem === 'metric' ? '2.7' : '9'}
                value={ceiling}
                onChange={(e) => setCeiling(e.target.value)}
              />
            </div>
          </div>

          {/* Layer selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              Lighting layers
              <span
                className="inline-flex"
                title="Pick any combination. Ambient is the general room light; task lights work surfaces; accent adds mood. See each layer below."
              >
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ORDERED_LAYERS.map((layer) => {
                const info = LAYER_INFO[layer];
                const Icon = LAYER_ICON[layer];
                const active = selectedLayers.includes(layer);
                return (
                  <button
                    key={layer}
                    type="button"
                    onClick={() => toggleLayer(layer)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-colors',
                      active
                        ? 'border-brand-bronze bg-accent/60'
                        : 'border-border bg-muted/30 hover:border-brand-bronze/60'
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="h-4 w-4 text-brand-bronze" />
                      {info.laymanLabel}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {info.technical} · {info.help}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional per-layer fixture choice */}
          {profile && selectedLayers.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm">Fixture per layer (optional — defaults to recommended)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ORDERED_LAYERS.filter((l) => selectedLayers.includes(l)).map((layer) => {
                  const candidates = profile.layers[layer].fixtures;
                  return (
                    <div key={layer} className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        {LAYER_INFO[layer].technical}
                      </span>
                      <Select
                        value={fixtureOverride[layer] ?? 'auto'}
                        onValueChange={(v) =>
                          setFixtureOverride((prev) => ({
                            ...prev,
                            [layer]: v === 'auto' ? undefined : (v as FixtureCategory),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto ({candidates[0]})</SelectItem>
                          {candidates.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button onClick={handleCalculate} className="w-full" size="lg">
            <Layers className="mr-2 h-4 w-4" />
            Design Layers
          </Button>
        </CardContent>
      </Card>

      {result && <LayeredResults result={result} unitSystem={unitSystem} />}
    </div>
  );
}

function LayeredResults({ result, unitSystem }: { result: LayeredResult; unitSystem: UnitSystem }) {
  const roomArea = areaInUnit(result.areaSqFt, unitSystem);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Room total</CardTitle>
          <CardDescription>
            {Math.round(roomArea.value)} {roomArea.label} · {result.totalLumens.toLocaleString()}{' '}
            lumens across {result.roomLayers.length}{' '}
            {result.roomLayers.length === 1 ? 'layer' : 'layers'} — each layer lights its own share,
            not the whole room.
          </CardDescription>
        </CardHeader>
        {result.cctSpreadWarning && (
          <CardContent className="pt-0">
            <p className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {result.cctSpreadWarning}
            </p>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {result.roomLayers.map((layer) => {
          const info = LAYER_INFO[layer.layer];
          const Icon = LAYER_ICON[layer.layer];
          const zoneArea = areaInUnit(layer.areaSqFt, unitSystem);
          return (
            <Card key={layer.layer}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-brand-bronze" />
                  {info.laymanLabel}
                </CardTitle>
                <CardDescription title={info.help}>{info.technical} layer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="text-2xl font-bold">
                  {layer.quantity}×{' '}
                  <span className="text-base font-medium text-muted-foreground">
                    {layer.fixtureName}
                  </span>
                </div>
                <Row label="Lumens / fixture" value={`${layer.lumensPerFixture.toLocaleString()} lm`} />
                <Row label="Layer total" value={`${layer.layerLumens.toLocaleString()} lm`} />
                <Row
                  label="Target"
                  value={`${layer.targetLux} lx${
                    layer.zoneLabel ? ` · ${layer.zoneLabel}` : ''
                  }`}
                />
                <Row label="Lights" value={`${Math.round(zoneArea.value)} ${zoneArea.label}`} />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Colour (CCT)</span>
                  <span className="flex items-center gap-2 font-semibold">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                      style={{ backgroundColor: kelvinToCss(layer.cct) }}
                    />
                    {layer.cct}K
                  </span>
                </div>
                <p className="flex items-start gap-1.5 border-t pt-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  {layer.criNote}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="flex items-start gap-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {KRUITHOF_NOTE}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

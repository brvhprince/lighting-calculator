'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Layers,
  Sun,
  Lightbulb,
  Sparkles,
  Info,
  Minus,
  Plus,
  Check,
  ArrowDown,
  ArrowUp,
  Save,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { calculateLighting } from '@/lib/calculator';
import { buildCalculationInput } from '@/lib/roomConfig';
import { track } from '@/lib/analytics';
import { CalculationResult, FixtureSnapshot, LayerKey, RoomConfigValue, UnitSystem } from '@/types';
import { AdvancedState, SavedCalculation } from '@/types/saved-calculations';
import { saveCalculation, generateCalculationId } from '@/lib/savedCalculations';
import { buildShareUrl } from '@/lib/shareUrl';
import { resolveFixture, resolveFixtureOrGhost, snapshotFixtures } from '@/lib/fixtureCatalog';
import { RoomInputs, SharedInputs } from './RoomInputs';
import { LightingResults } from './LightingResults';
import { PDFExport } from './PDFExport';
import {
  fixturesForLayer,
  computeAdvancedTotals,
  suggestedLayerLumens,
  flagLumens,
  synthesizeLayeredResult,
  Flag,
  AdvancedTotals,
} from '@/lib/layered/advanced';
import { LAYER_INFO, KRUITHOF_NOTE, resolveLayerCct, layerCriNote, resolveColorQuality } from '@/lib/layered/guidance';
import { kelvinToCss } from '@/lib/cct';

const ORDERED_LAYERS: LayerKey[] = ['ambient', 'task', 'accent'];
const LAYER_ICON: Record<LayerKey, typeof Sun> = { ambient: Sun, task: Lightbulb, accent: Sparkles };

type Props = {
  shared: SharedInputs;
  onUnitSystem: (u: UnitSystem) => void;
  onLength: (v: string) => void;
  onWidth: (v: string) => void;
  onIsExpert: (v: boolean) => void;
  onConfig: (patch: Partial<RoomConfigValue>) => void;
  advanced: AdvancedState;
  onAdvanced: (next: AdvancedState) => void;
  result: CalculationResult | null;
  setResult: (r: CalculationResult | null) => void;
  // Fixture snapshot from a restored save — lets discontinued fixtures still
  // render (ghost) and be remapped.
  snapshot?: FixtureSnapshot[];
};

type LayerView = {
  layer: LayerKey;
  count: number;
  lumens: number;
  suggested: number;
  flag: Flag;
  cct: number;
  criNote: string;
};

type MissingFixture = { layer: LayerKey; id: string; name: string; quantity: number };

type AdvancedView = {
  required: number;
  achieved: number;
  totalFixtures: number;
  totalFlag: Flag;
  layers: LayerView[];
  missing: MissingFixture[];
  synthesized: CalculationResult;
};

export default function AdvancedLightingCalculator({
  shared,
  onUnitSystem,
  onLength,
  onWidth,
  onIsExpert,
  onConfig,
  advanced,
  onAdvanced,
  result,
  setResult,
  snapshot,
}: Props) {
  const { length, width, unitSystem, config } = shared;
  const [description, setDescription] = useState('');
  const [view, setView] = useState<AdvancedView | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const { selectedLayers, fixtureCounts } = advanced;

  const toggleLayer = (layer: LayerKey) => {
    const next = selectedLayers.includes(layer)
      ? selectedLayers.filter((l) => l !== layer)
      : [...ORDERED_LAYERS.filter((l) => l === layer || selectedLayers.includes(l))];
    onAdvanced({ ...advanced, selectedLayers: next });
  };

  const setCount = (layer: LayerKey, key: string, qty: number) => {
    const layerMap = { ...(fixtureCounts[layer] || {}) };
    if (qty <= 0) delete layerMap[key];
    else layerMap[key] = qty;
    onAdvanced({ ...advanced, fixtureCounts: { ...fixtureCounts, [layer]: layerMap } });
  };

  const inputsValid = Boolean(length && width && config.roomType && selectedLayers.length > 0);

  // Live required-lumens budget (for the per-layer "suggested" hints while picking).
  const liveRequired = useMemo(() => {
    if (!length || !width || !config.roomType) return 0;
    if (config.roomType === 'other' && !config.customRoomLumens) return 0;
    try {
      return calculateLighting(buildCalculationInput(shared)).totalLumensNeeded;
    } catch {
      return 0;
    }
  }, [length, width, config, shared]);

  const liveSuggested = useMemo(
    () => suggestedLayerLumens(liveRequired, selectedLayers),
    [liveRequired, selectedLayers]
  );

  // Build the full snapshot view-model from the current inputs + selection.
  const buildView = (): AdvancedView | null => {
    if (!length || !width || !config.roomType) return null;
    if (config.roomType === 'other' && (!config.customRoomName || !config.customRoomLumens)) return null;
    if (selectedLayers.length === 0) return null;

    const base = calculateLighting(buildCalculationInput(shared));
    const required = base.totalLumensNeeded;
    // Resolve fixtures via the live catalogue, falling back to the saved snapshot
    // so a discontinued fixture still contributes its lumens on restore.
    const resolve = (id: string) => {
      const f = resolveFixtureOrGhost(id, snapshot);
      return { name: f.name, lumens: f.typicalLumens.recommended };
    };
    const totals: AdvancedTotals = computeAdvancedTotals(selectedLayers, fixtureCounts, resolve);
    const suggested = suggestedLayerLumens(required, selectedLayers);

    // Fixtures referenced in the selection that no longer exist in the catalogue.
    const missing: MissingFixture[] = [];
    for (const layer of selectedLayers) {
      for (const [id, qty] of Object.entries(fixtureCounts[layer] || {})) {
        if (qty > 0 && !resolveFixture(id)) {
          missing.push({ layer, id, name: resolveFixtureOrGhost(id, snapshot).name, quantity: qty });
        }
      }
    }

    const layers: LayerView[] = selectedLayers.map((layer) => {
      const lt = totals.perLayer[layer];
      return {
        layer,
        count: lt.count,
        lumens: lt.lumens,
        suggested: suggested[layer],
        flag: flagLumens(lt.lumens, suggested[layer]),
        cct: resolveLayerCct(config.roomType, layer),
        criNote: layerCriNote(layer, resolveColorQuality(config.roomType)),
      };
    });

    const summaryParts = selectedLayers.flatMap((layer) =>
      totals.perLayer[layer].fixtures.map((f) => `${f.quantity}× ${f.name}`)
    );
    const synthesized = synthesizeLayeredResult({
      base,
      achievedLumens: totals.achievedLumens,
      totalFixtures: totals.totalFixtures,
      fixtureItems: totals.fixtureItems,
      layerSummary: summaryParts.length
        ? `Layered design: ${summaryParts.join(', ')}.`
        : 'Layered design.',
    });

    return {
      required,
      achieved: totals.achievedLumens,
      totalFixtures: totals.totalFixtures,
      totalFlag: flagLumens(totals.achievedLumens, required),
      layers,
      missing,
      synthesized,
    };
  };

  // Move a discontinued fixture's quantity onto a current fixture.
  const remapFixture = (layer: LayerKey, oldId: string, newId: string) => {
    if (!newId) return;
    const layerMap = { ...(fixtureCounts[layer] || {}) };
    const qty = layerMap[oldId] ?? 0;
    delete layerMap[oldId];
    layerMap[newId] = (layerMap[newId] ?? 0) + qty;
    onAdvanced({ ...advanced, fixtureCounts: { ...fixtureCounts, [layer]: layerMap } });
  };

  // After a restore (result set by the shell) rebuild the view from the restored
  // inputs, which were set together with the result.
  useEffect(() => {
    if (result && !view) {
      const v = buildView();
      if (v) setView(v);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleCalculate = () => {
    if (!length || !width || !config.roomType) {
      alert('Please fill in room dimensions and select a room type');
      return;
    }
    if (config.roomType === 'other' && (!config.customRoomName || !config.customRoomLumens)) {
      alert('Please enter a room name and lumens per square foot for custom room type');
      return;
    }
    if (selectedLayers.length === 0) {
      alert('Select at least one lighting layer');
      return;
    }
    const v = buildView();
    if (!v) return;
    if (v.totalFixtures === 0) {
      alert('Add at least one fixture to a layer using the + steppers');
      return;
    }
    setView(v);
    setResult(v.synthesized);
    track('calculate_layered', {
      room: config.roomType,
      unit: unitSystem,
      layers: selectedLayers.join('+'),
      fixtures: v.totalFixtures,
    });
  };

  const handleSave = () => {
    if (!view || !result) return;
    const ids = (result.fixtureItems ?? []).map((i) => i.id);
    const fresh = snapshotFixtures(ids);
    // Keep snapshots for still-referenced fixtures that are no longer in the catalogue.
    const carried = (snapshot ?? []).filter(
      (s) => ids.includes(s.id) && !fresh.some((f) => f.id === s.id)
    );
    const fixtureSnapshot = [...fresh, ...carried];
    const roomName =
      config.roomType === 'other' && config.customRoomName
        ? config.customRoomName
        : ROOM_TYPES[config.roomType]?.name || 'Room';
    const saved: SavedCalculation = {
      id: generateCalculationId(),
      name: `${roomName} (layered) - ${result.area.toFixed(0)} ${result.areaUnit}`,
      description: description.trim() || undefined,
      timestamp: Date.now(),
      type: 'full',
      mode: 'advanced',
      input: buildCalculationInput(shared),
      result,
      advanced,
      fixtureSnapshot,
    };
    saveCalculation(saved);
    alert('Layered design saved successfully!');
  };

  const handleShare = async () => {
    const url = buildShareUrl(buildCalculationInput(shared));
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt('Copy this share link:', url);
    }
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
            Everything the simple calculator does, plus lighting layers. We compute the room&apos;s
            required lumens (room type, ceiling height and daylight included), then you choose the
            fixtures per layer and we check your design against that budget.
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
            idPrefix="adv"
            showFixture={false}
          />

          {/* Live required-lumens budget */}
          {liveRequired > 0 && (
            <div className="rounded-lg border border-brand-bronze/40 bg-brand-bronze/5 p-3 text-sm">
              <span className="text-muted-foreground">Required for this room: </span>
              <span className="font-semibold">{liveRequired.toLocaleString()} lumens</span>
              <span className="text-muted-foreground">
                {' '}
                — split as suggestions across the layers you pick below.
              </span>
            </div>
          )}

          {/* Layer selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              Lighting layers
              <span
                className="inline-flex"
                title="Pick any combination. Ambient is the general room light; task lights work surfaces; accent adds mood."
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

          {/* Fixture pickers per selected layer */}
          {config.roomType &&
            ORDERED_LAYERS.filter((l) => selectedLayers.includes(l)).map((layer) => (
              <LayerFixturePicker
                key={layer}
                layer={layer}
                counts={fixtureCounts[layer] || {}}
                suggested={liveSuggested[layer]}
                cct={resolveLayerCct(config.roomType, layer)}
                onCount={(key, qty) => setCount(layer, key, qty)}
              />
            ))}

          <Button onClick={handleCalculate} className="w-full" size="lg" disabled={!inputsValid}>
            <Layers className="mr-2 h-4 w-4" />
            Calculate Layered Design
          </Button>
        </CardContent>
      </Card>

      {view && result && (
        <>
          {view.missing.length > 0 && (
            <Card className="border-brand-bronze/50 bg-brand-bronze/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-brand-bronze">
                  <AlertTriangle className="h-4 w-4" />
                  Discontinued fixtures in this design
                </CardTitle>
                <CardDescription>
                  These fixtures are no longer in the catalogue. The design still totals using the
                  saved snapshot — pick a current replacement to keep it accurate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {view.missing.map((m) => (
                  <div key={`${m.layer}-${m.id}`} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">
                      {m.quantity}× {m.name}
                    </span>
                    <span className="text-xs text-muted-foreground">({LAYER_INFO[m.layer].technical})</span>
                    <span className="text-muted-foreground">→</span>
                    <Select onValueChange={(v) => remapFixture(m.layer, m.id, v)}>
                      <SelectTrigger className="h-8 w-56">
                        <SelectValue placeholder="Replace with…" />
                      </SelectTrigger>
                      <SelectContent>
                        {fixturesForLayer(m.layer).map((f) => (
                          <SelectItem key={f.key} value={f.key}>
                            {f.name} ({f.lumens.toLocaleString()} lm)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <LayeredSummary view={view} />

          <div className="flex flex-wrap items-end justify-end gap-3">
            <div className="min-w-[200px] flex-1 max-w-md space-y-1">
              <Label htmlFor="description-adv" className="text-sm">
                Description (optional)
              </Label>
              <Input
                id="description-adv"
                type="text"
                placeholder="e.g., Kitchen layered scheme"
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
              roomType={config.roomType}
              customRoomName={config.roomType === 'other' ? config.customRoomName : undefined}
            />
            <Button onClick={handleSave} variant="default" className="gap-2">
              <Save className="h-4 w-4" />
              Save Design
            </Button>
          </div>

          <LightingResults
            result={result}
            roomType={config.roomType}
            customRoomName={config.roomType === 'other' ? config.customRoomName : undefined}
          />
        </>
      )}
    </div>
  );
}

function LayerFixturePicker({
  layer,
  counts,
  suggested,
  cct,
  onCount,
}: {
  layer: LayerKey;
  counts: Record<string, number>;
  suggested: number;
  cct: number;
  onCount: (key: string, qty: number) => void;
}) {
  const info = LAYER_INFO[layer];
  const Icon = LAYER_ICON[layer];
  const fixtures = fixturesForLayer(layer);
  const subtotal = fixtures.reduce((s, f) => s + (counts[f.key] || 0) * f.lumens, 0);

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-brand-bronze" />
          {info.laymanLabel}
          <span className="text-xs font-normal text-muted-foreground">({info.technical})</span>
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="inline-block h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: kelvinToCss(cct) }}
          />
          {cct}K
        </span>
      </div>

      <div className="space-y-2">
        {fixtures.map((f) => {
          const qty = counts[f.key] || 0;
          return (
            <div key={f.key} className="flex items-center justify-between gap-3">
              <span className="text-sm">
                {f.name}{' '}
                <span className="text-xs text-muted-foreground">({f.lumens.toLocaleString()} lm)</span>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onCount(f.key, Math.max(0, qty - 1))}
                  aria-label={`Decrease ${f.name}`}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  min={0}
                  value={qty || ''}
                  placeholder="0"
                  onChange={(e) => onCount(f.key, Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-7 w-14 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onCount(f.key, qty + 1)}
                  aria-label={`Increase ${f.name}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between border-t pt-2 text-sm">
        <span className="text-muted-foreground">
          Selected {subtotal.toLocaleString()} lm
          {suggested > 0 && ` · suggested ≈ ${suggested.toLocaleString()} lm`}
        </span>
      </div>
    </div>
  );
}

function LayeredSummary({ view }: { view: AdvancedView }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Design vs. required</CardTitle>
          <CardDescription>
            Your fixtures deliver {view.achieved.toLocaleString()} lm against a required{' '}
            {view.required.toLocaleString()} lm ({view.totalFixtures} fixtures).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FlagBanner flag={view.totalFlag} unit="lm" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {view.layers.map((lv) => {
          const info = LAYER_INFO[lv.layer];
          const Icon = LAYER_ICON[lv.layer];
          return (
            <Card key={lv.layer}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-brand-bronze" />
                  {info.laymanLabel}
                </CardTitle>
                <CardDescription title={info.help}>{info.technical} layer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-2xl font-bold">
                  {lv.count}{' '}
                  <span className="text-base font-medium text-muted-foreground">
                    {lv.count === 1 ? 'fixture' : 'fixtures'}
                  </span>
                </div>
                <Row label="Delivers" value={`${lv.lumens.toLocaleString()} lm`} />
                <Row label="Suggested" value={`${lv.suggested.toLocaleString()} lm`} />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Colour (CCT)</span>
                  <span className="flex items-center gap-2 font-semibold">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                      style={{ backgroundColor: kelvinToCss(lv.cct) }}
                    />
                    {lv.cct}K
                  </span>
                </div>
                <div className="pt-1">
                  <FlagBadge flag={lv.flag} />
                </div>
                <p className="flex items-start gap-1.5 border-t pt-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  {lv.criNote}
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

function flagTone(flag: Flag) {
  if (flag.verdict === 'on-target')
    return { color: 'text-brand-sage', Icon: Check, label: 'On target' };
  const label = `${flag.strong ? 'Well ' : ''}${flag.verdict === 'below' ? 'below' : 'above'} target`;
  return { color: 'text-brand-bronze', Icon: flag.verdict === 'below' ? ArrowDown : ArrowUp, label };
}

function FlagBanner({ flag, unit }: { flag: Flag; unit: string }) {
  const tone = flagTone(flag);
  const diffText =
    flag.diff === 0
      ? 'exactly on the required budget'
      : `${flag.diff > 0 ? '+' : '−'}${Math.abs(flag.diff).toLocaleString()} ${unit} (${
          flag.pct > 0 ? '+' : ''
        }${flag.pct}%) vs required`;
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border p-4 text-sm',
        flag.verdict === 'on-target'
          ? 'border-brand-sage/40 bg-brand-sage/10'
          : 'border-brand-bronze/40 bg-brand-bronze/10'
      )}
    >
      <tone.Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone.color)} />
      <div className="text-muted-foreground">
        <span className={cn('font-semibold', tone.color)}>
          {tone.label} — {Math.round(flag.ratio * 100)}% of required.
        </span>{' '}
        {diffText}.{' '}
        {flag.verdict === 'below'
          ? 'Add or upsize fixtures to close the gap.'
          : flag.verdict === 'above'
          ? 'You have headroom — drop a fixture or add dimming to tune and save energy.'
          : 'This design meets the room’s required output.'}
      </div>
    </div>
  );
}

function FlagBadge({ flag }: { flag: Flag }) {
  const tone = flagTone(flag);
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', tone.color)}>
      <tone.Icon className="h-3 w-3" />
      {tone.label} · {flag.pct > 0 ? '+' : ''}
      {flag.pct}%
    </span>
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

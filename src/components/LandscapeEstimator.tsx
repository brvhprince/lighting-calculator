'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trees, Plus, Trash2, Cable, Sun, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyProvider';
import { useFixtures } from '@/context/FixturesProvider';
import { LandscapeFeature, LandscapeSystem, LandscapeTechnique } from '@/types/landscape';
import { TECHNIQUES, TECHNIQUE_ORDER } from '@/lib/landscape/techniques';
import { computeLandscape, ftToUnit, unitToFt } from '@/lib/landscape/engine';
import { loadLogoDataUrl } from '@/lib/pdf/brand';
import { gatherLandscapeReportData } from '@/lib/pdf/landscapeReportData';
import { LandscapeResults } from './LandscapeResults';
import { track } from '@/lib/analytics';

const SQFT_TO_SQM = 0.092903;

const SYSTEMS: { key: LandscapeSystem; label: string; blurb: string; Icon: typeof Cable }[] = [
  { key: 'lowvoltage', label: 'Low-voltage 12V', blurb: 'Transformer + landscape cable', Icon: Cable },
  { key: 'solar', label: 'Solar', blurb: 'No wiring, per-fixture panels', Icon: Sun },
  { key: 'linevoltage', label: 'Line-voltage (mains)', blurb: '230V/120V, by an electrician', Icon: Zap },
];

let seq = 0;
const newId = () => `feat-${Date.now().toString(36)}-${seq++}`;

function defaultFeature(technique: LandscapeTechnique): LandscapeFeature {
  const t = TECHNIQUES[technique];
  const f: LandscapeFeature = { id: newId(), technique };
  if (t.measure === 'count') f.count = technique === 'steps' ? 4 : 2;
  if (t.measure === 'length') f.lengthFt = 20;
  if (t.measure === 'area') f.areaSqFt = 150;
  if (t.usesHeight) f.heightFt = t.defaultHeightFt;
  return f;
}

export default function LandscapeEstimator() {
  const { market } = useCurrency();
  // The admin-edited outdoor catalogue lives in the registry; depend on it so the
  // estimate recomputes once it hydrates or an admin saves changes.
  const { landscapeCatalog } = useFixtures();
  const [system, setSystem] = useState<LandscapeSystem>('lowvoltage');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [features, setFeatures] = useState<LandscapeFeature[]>([
    { id: newId(), technique: 'path', lengthFt: 40 },
    { id: newId(), technique: 'treeUplight', count: 2, heightFt: 15 },
  ]);
  const [techniqueToAdd, setTechniqueToAdd] = useState<LandscapeTechnique>('wallWash');
  const [pdfBusy, setPdfBusy] = useState(false);

  const metric = unit === 'metric';
  const lenUnit = metric ? 'm' : 'ft';
  const areaUnit = metric ? 'm²' : 'ft²';

  const result = useMemo(
    () => computeLandscape({ system, features }, market),
    // landscapeCatalog is a deliberate recompute trigger: computeLandscape reads
    // the module registry, which the provider rehydrates from admin edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [system, features, market, landscapeCatalog]
  );

  const addFeature = () => setFeatures((prev) => [...prev, defaultFeature(techniqueToAdd)]);
  const removeFeature = (id: string) => setFeatures((prev) => prev.filter((f) => f.id !== id));
  const patchFeature = (id: string, patch: Partial<LandscapeFeature>) =>
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const handleExportPdf = async () => {
    setPdfBusy(true);
    try {
      const logoSrc = await loadLogoDataUrl();
      const { buildLandscapeReportBlob } = await import('@/lib/pdf/landscapeReport');
      const blob = await buildLandscapeReportBlob(gatherLandscapeReportData({ result, market, logoSrc }));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'penlabs-landscape-plan.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      track('landscape_pdf_export', { system, features: features.length });
    } catch (e) {
      console.error('Landscape PDF export failed:', e);
      alert('Sorry, the landscape PDF could not be generated.');
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trees className="h-6 w-6 text-brand-bronze" />
            Landscape Lighting Estimator
          </CardTitle>
          <CardDescription>
            Describe the features you want to light. We size the fixtures, wiring and cost for an
            outdoor scheme, warm and glare-controlled to the Pen Homes standard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System + units */}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label>Wiring system</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {SYSTEMS.map((sys) => {
                  const active = system === sys.key;
                  return (
                    <button
                      key={sys.key}
                      type="button"
                      onClick={() => setSystem(sys.key)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-lg border p-3 text-left transition-colors',
                        active
                          ? 'border-brand-bronze bg-accent/60'
                          : 'border-border bg-muted/30 hover:border-brand-bronze/60'
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <sys.Icon className="h-4 w-4 text-brand-bronze" />
                        {sys.label}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{sys.blurb}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Units</Label>
              <RadioGroup
                value={unit}
                onValueChange={(v) => setUnit(v as 'metric' | 'imperial')}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="metric" id="ls-met" />
                  <Label htmlFor="ls-met" className="font-normal cursor-pointer">Metric</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="imperial" id="ls-imp" />
                  <Label htmlFor="ls-imp" className="font-normal cursor-pointer">Imperial</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label>Features to light</Label>
            {features.map((f) => {
              const t = TECHNIQUES[f.technique];
              return (
                <div key={f.id} className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.blurb}</p>
                    </div>
                    <button
                      onClick={() => removeFeature(f.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${t.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {t.measureLabel}
                        {t.measure === 'length' ? ` (${lenUnit})` : t.measure === 'area' ? ` (${areaUnit})` : ''}
                      </Label>
                      {t.measure === 'count' && (
                        <Input
                          type="number"
                          min={0}
                          className="h-9 w-28"
                          value={f.count ?? ''}
                          onChange={(e) => patchFeature(f.id, { count: Math.max(0, parseInt(e.target.value) || 0) })}
                        />
                      )}
                      {t.measure === 'length' && (
                        <Input
                          type="number"
                          min={0}
                          step="0.5"
                          className="h-9 w-28"
                          value={Number(ftToUnit(f.lengthFt ?? 0, metric).toFixed(1))}
                          onChange={(e) => patchFeature(f.id, { lengthFt: Math.max(0, unitToFt(parseFloat(e.target.value) || 0, metric)) })}
                        />
                      )}
                      {t.measure === 'area' && (
                        <Input
                          type="number"
                          min={0}
                          className="h-9 w-28"
                          value={Number((metric ? (f.areaSqFt ?? 0) * SQFT_TO_SQM : f.areaSqFt ?? 0).toFixed(1))}
                          onChange={(e) => {
                            const v = Math.max(0, parseFloat(e.target.value) || 0);
                            patchFeature(f.id, { areaSqFt: metric ? v / SQFT_TO_SQM : v });
                          }}
                        />
                      )}
                    </div>
                    {t.usesHeight && (
                      <div className="space-y-1">
                        <Label className="text-xs">Height ({lenUnit})</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.5"
                          className="h-9 w-24"
                          value={Number(ftToUnit(f.heightFt ?? t.defaultHeightFt ?? 0, metric).toFixed(1))}
                          onChange={(e) => patchFeature(f.id, { heightFt: Math.max(0, unitToFt(parseFloat(e.target.value) || 0, metric)) })}
                        />
                      </div>
                    )}
                    <div className="space-y-1 flex-1 min-w-[140px]">
                      <Label className="text-xs">Label (optional)</Label>
                      <Input
                        className="h-9"
                        placeholder="e.g. Front oak, side path"
                        value={f.label ?? ''}
                        onChange={(e) => patchFeature(f.id, { label: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border p-3">
              <div className="min-w-[200px] flex-1 space-y-1">
                <Label className="text-xs">Add a feature</Label>
                <Select value={techniqueToAdd} onValueChange={(v) => setTechniqueToAdd(v as LandscapeTechnique)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TECHNIQUE_ORDER.map((k) => (
                      <SelectItem key={k} value={k}>
                        {TECHNIQUES[k].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addFeature} variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {features.length > 0 && result.totalFixtures > 0 && (
        <LandscapeResults result={result} onExport={handleExportPdf} pdfBusy={pdfBusy} />
      )}
    </div>
  );
}

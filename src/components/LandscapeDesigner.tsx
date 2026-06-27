'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Map, Cable, Sun, Zap, Trash2, Undo2, Check, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Point } from '@/lib/geometry';
import { useCurrency } from '@/context/CurrencyProvider';
import { useFixtures } from '@/context/FixturesProvider';
import { LandscapeSystem, LandscapeTechnique } from '@/types/landscape';
import { TECHNIQUES, TECHNIQUE_ORDER } from '@/lib/landscape/techniques';
import { computeLandscape, ftToUnit, unitToFt } from '@/lib/landscape/engine';
import {
  PlacedFeature,
  drawKind,
  placedToFeatures,
  polylineLengthFt,
  anchorsForFeature,
  cableRunMeters,
} from '@/lib/landscape/siteplan';
import { polygonArea } from '@/lib/geometry';
import { loadLogoDataUrl } from '@/lib/pdf/brand';
import { gatherLandscapeReportData } from '@/lib/pdf/landscapeReportData';
import { LandscapeResults } from './LandscapeResults';
import { track } from '@/lib/analytics';

const CANVAS_W = 720;
const CANVAS_H = 520;
const SQFT_TO_SQM = 0.092903;

const SYSTEMS: { key: LandscapeSystem; label: string; Icon: typeof Cable }[] = [
  { key: 'lowvoltage', label: 'Low-voltage 12V', Icon: Cable },
  { key: 'solar', label: 'Solar', Icon: Sun },
  { key: 'linevoltage', label: 'Line-voltage', Icon: Zap },
];

let seq = 0;
const newId = () => `pf-${Date.now().toString(36)}-${seq++}`;

export default function LandscapeDesigner() {
  const { market } = useCurrency();
  const { landscapeCatalog } = useFixtures();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [system, setSystem] = useState<LandscapeSystem>('lowvoltage');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [siteWidthFt, setSiteWidthFt] = useState(60);
  const [siteDepthFt, setSiteDepthFt] = useState(40);
  const [technique, setTechnique] = useState<LandscapeTechnique>('treeUplight');
  const [placed, setPlaced] = useState<PlacedFeature[]>([]);
  const [draft, setDraft] = useState<Point[]>([]);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [placingTransformer, setPlacingTransformer] = useState(false);
  const [transformer, setTransformer] = useState<Point | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const metric = unit === 'metric';
  const lenUnit = metric ? 'm' : 'ft';
  const kind = drawKind(technique);

  // Fit the plot rectangle into the canvas (no pan/zoom for v1).
  const view = useMemo(() => {
    const pad = 48;
    const scale = Math.min((CANVAS_W - pad * 2) / siteWidthFt, (CANVAS_H - pad * 2) / siteDepthFt);
    return {
      scale,
      ox: (CANVAS_W - siteWidthFt * scale) / 2,
      oy: (CANVAS_H - siteDepthFt * scale) / 2,
    };
  }, [siteWidthFt, siteDepthFt]);

  const toScreen = useCallback((p: Point) => ({ x: view.ox + p.x * view.scale, y: view.oy + p.y * view.scale }), [view]);
  const toFeet = useCallback(
    (sx: number, sy: number): Point => {
      const snap = (v: number) => Math.round(v / 0.5) * 0.5;
      return {
        x: Math.max(0, Math.min(siteWidthFt, snap((sx - view.ox) / view.scale))),
        y: Math.max(0, Math.min(siteDepthFt, snap((sy - view.oy) / view.scale))),
      };
    },
    [view, siteWidthFt, siteDepthFt]
  );

  // ---- Engine result (with measured cable when a transformer is placed) ----
  const result = useMemo(() => {
    const features = placedToFeatures(placed);
    const base = computeLandscape({ system, features }, market);
    if (system !== 'lowvoltage' || !transformer) return base;
    const anchors: Point[] = [];
    for (const line of base.lines) {
      const pf = placed.find((p) => p.id === line.featureId);
      if (pf) anchors.push(...anchorsForFeature(pf, line.quantity));
    }
    const cableM = cableRunMeters(transformer, anchors);
    return computeLandscape({ system, features }, market, { cableMetersOverride: cableM });
    // landscapeCatalog triggers a recompute after admin edits hydrate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed, system, transformer, market, landscapeCatalog]);

  // ---- Canvas drawing ----
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== CANVAS_W * dpr) {
      canvas.width = CANVAS_W * dpr;
      canvas.height = CANVAS_H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const styles = getComputedStyle(document.documentElement);
    const bronze = `hsl(${styles.getPropertyValue('--brand-bronze').trim()})`;
    const sage = `hsl(${styles.getPropertyValue('--brand-sage').trim()})`;
    const basalt = `hsl(${styles.getPropertyValue('--brand-basalt').trim()})`;
    const isDark = document.documentElement.classList.contains('dark');
    const grid = isDark ? 'rgba(245,242,237,0.08)' : 'rgba(44,51,46,0.08)';

    // Plot outline + 5 ft grid
    const tl = toScreen({ x: 0, y: 0 });
    const br = toScreen({ x: siteWidthFt, y: siteDepthFt });
    ctx.fillStyle = isDark ? 'rgba(138,150,130,0.06)' : 'rgba(138,150,130,0.10)';
    ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= siteWidthFt; x += 5) {
      const s = toScreen({ x, y: 0 });
      ctx.beginPath();
      ctx.moveTo(s.x, tl.y);
      ctx.lineTo(s.x, br.y);
      ctx.stroke();
    }
    for (let y = 0; y <= siteDepthFt; y += 5) {
      const s = toScreen({ x: 0, y });
      ctx.beginPath();
      ctx.moveTo(tl.x, s.y);
      ctx.lineTo(br.x, s.y);
      ctx.stroke();
    }
    ctx.strokeStyle = sage;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);

    // Cable chain (behind features)
    if (system === 'lowvoltage' && transformer) {
      const anchors: Point[] = [];
      for (const line of result.lines) {
        const pf = placed.find((p) => p.id === line.featureId);
        if (pf) anchors.push(...anchorsForFeature(pf, line.quantity));
      }
      // mirror the greedy chain order used for the length estimate
      const remaining = anchors.slice();
      let cur = transformer;
      ctx.strokeStyle = 'rgba(166,137,102,0.5)';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1;
      while (remaining.length) {
        let bi = 0;
        let bd = Infinity;
        for (let i = 0; i < remaining.length; i++) {
          const d = Math.hypot(remaining[i].x - cur.x, remaining[i].y - cur.y);
          if (d < bd) {
            bd = d;
            bi = i;
          }
        }
        const a = toScreen(cur);
        const b = toScreen(remaining[bi]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        cur = remaining.splice(bi, 1)[0];
      }
      ctx.setLineDash([]);
    }

    // Placed features
    for (const pf of placed) {
      const k = drawKind(pf.technique);
      if (k === 'point') {
        const s = toScreen(pf.points[0]);
        const r = Math.max(6, 5 * view.scale); // ~5 ft light pool
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
        grad.addColorStop(0, 'rgba(166,137,102,0.35)');
        grad.addColorStop(1, 'rgba(166,137,102,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bronze;
        ctx.strokeStyle = isDark ? basalt : '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        const sp = pf.points.map(toScreen);
        ctx.beginPath();
        ctx.moveTo(sp[0].x, sp[0].y);
        for (let i = 1; i < sp.length; i++) ctx.lineTo(sp[i].x, sp[i].y);
        if (k === 'area') {
          ctx.closePath();
          ctx.fillStyle = 'rgba(166,137,102,0.15)';
          ctx.fill();
        }
        ctx.strokeStyle = bronze;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }

    // Draft in-progress
    if (draft.length) {
      const sp = draft.map(toScreen);
      ctx.beginPath();
      ctx.moveTo(sp[0].x, sp[0].y);
      for (let i = 1; i < sp.length; i++) ctx.lineTo(sp[i].x, sp[i].y);
      if (cursor) {
        const c = toScreen(cursor);
        ctx.lineTo(c.x, c.y);
      }
      ctx.strokeStyle = sage;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      for (const p of sp) {
        ctx.beginPath();
        ctx.fillStyle = sage;
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Transformer
    if (transformer) {
      const s = toScreen(transformer);
      ctx.fillStyle = basalt;
      ctx.strokeStyle = bronze;
      ctx.lineWidth = 2;
      ctx.fillRect(s.x - 7, s.y - 7, 14, 14);
      ctx.strokeRect(s.x - 7, s.y - 7, 14, 14);
    }
  }, [placed, draft, cursor, transformer, system, result, view, toScreen, siteWidthFt, siteDepthFt]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ---- Pointer interaction ----
  const local = (e: React.PointerEvent | React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      sx: ((e.clientX - rect.left) * CANVAS_W) / rect.width,
      sy: ((e.clientY - rect.top) * CANVAS_H) / rect.height,
    };
  };

  const onClick = (e: React.MouseEvent) => {
    const { sx, sy } = local(e);
    const pt = toFeet(sx, sy);
    if (placingTransformer) {
      setTransformer(pt);
      setPlacingTransformer(false);
      return;
    }
    if (kind === 'point') {
      const t = TECHNIQUES[technique];
      setPlaced((prev) => [
        ...prev,
        {
          id: newId(),
          technique,
          points: [pt],
          count: technique === 'steps' ? 4 : 1,
          heightFt: t.usesHeight ? t.defaultHeightFt : undefined,
        },
      ]);
    } else {
      setDraft((prev) => [...prev, pt]);
    }
  };

  const onMove = (e: React.MouseEvent) => {
    if (kind === 'point' || !draft.length) {
      if (cursor) setCursor(null);
      return;
    }
    const { sx, sy } = local(e);
    setCursor(toFeet(sx, sy));
  };

  const finishDraft = () => {
    const min = kind === 'area' ? 3 : 2;
    if (draft.length < min) return;
    const t = TECHNIQUES[technique];
    setPlaced((prev) => [
      ...prev,
      { id: newId(), technique, points: draft, heightFt: t.usesHeight ? t.defaultHeightFt : undefined },
    ]);
    setDraft([]);
    setCursor(null);
  };

  const patchPlaced = (id: string, patch: Partial<PlacedFeature>) =>
    setPlaced((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePlaced = (id: string) => setPlaced((prev) => prev.filter((p) => p.id !== id));

  const handleExportPdf = async () => {
    setPdfBusy(true);
    try {
      const logoSrc = await loadLogoDataUrl();
      const { buildLandscapeReportBlob } = await import('@/lib/pdf/landscapeReport');
      const blob = await buildLandscapeReportBlob(gatherLandscapeReportData({ result, market, logoSrc }));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'penlabs-landscape-siteplan.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      track('landscape_siteplan_pdf', { system, features: placed.length });
    } catch (e) {
      console.error('Landscape site-plan PDF failed:', e);
      alert('Sorry, the site-plan PDF could not be generated.');
    } finally {
      setPdfBusy(false);
    }
  };

  const measureText = (pf: PlacedFeature): string => {
    const k = drawKind(pf.technique);
    if (k === 'point') return `${pf.count ?? 1} unit${(pf.count ?? 1) === 1 ? '' : 's'}`;
    if (k === 'line') return `${ftToUnit(polylineLengthFt(pf.points), metric).toFixed(1)} ${lenUnit}`;
    return `${(metric ? polygonArea(pf.points) * SQFT_TO_SQM : polygonArea(pf.points)).toFixed(1)} ${metric ? 'm²' : 'ft²'}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Canvas */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-brand-bronze" />
              Site plan
            </CardTitle>
            <CardDescription>
              Set your plot size, pick a technique, then click to place fixtures. Lines and areas:
              click points and press Finish (or double-click).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Plot width ({lenUnit})</Label>
                <Input
                  type="number"
                  className="h-9 w-24"
                  value={Number(ftToUnit(siteWidthFt, metric).toFixed(1))}
                  onChange={(e) => setSiteWidthFt(Math.max(5, unitToFt(parseFloat(e.target.value) || 0, metric)))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Plot depth ({lenUnit})</Label>
                <Input
                  type="number"
                  className="h-9 w-24"
                  value={Number(ftToUnit(siteDepthFt, metric).toFixed(1))}
                  onChange={(e) => setSiteDepthFt(Math.max(5, unitToFt(parseFloat(e.target.value) || 0, metric)))}
                />
              </div>
              <div className="space-y-1 min-w-[170px] flex-1">
                <Label className="text-xs">Technique to place</Label>
                <Select value={technique} onValueChange={(v) => { setTechnique(v as LandscapeTechnique); setDraft([]); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TECHNIQUE_ORDER.map((k) => (
                      <SelectItem key={k} value={k}>
                        {TECHNIQUES[k].name} ({drawKind(k)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20" style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}>
              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Landscape site plan canvas"
                className="h-full w-full rounded-lg"
                style={{ cursor: placingTransformer ? 'cell' : 'crosshair' }}
                onClick={onClick}
                onMouseMove={onMove}
                onDoubleClick={finishDraft}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {kind !== 'point' && (
                <>
                  <Button variant="outline" size="sm" onClick={finishDraft} disabled={draft.length < (kind === 'area' ? 3 : 2)} className="gap-1.5">
                    <Check className="h-4 w-4" /> Finish {kind}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDraft((p) => p.slice(0, -1))} disabled={!draft.length} className="gap-1.5">
                    <Undo2 className="h-4 w-4" /> Undo point
                  </Button>
                </>
              )}
              {system === 'lowvoltage' && (
                <Button
                  variant={placingTransformer ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPlacingTransformer((v) => !v)}
                  className="gap-1.5"
                >
                  <Plug className="h-4 w-4" /> {transformer ? 'Move transformer' : 'Place transformer'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setPlaced([]); setDraft([]); setTransformer(null); }}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {system === 'lowvoltage' && !transformer
                ? 'Place the transformer to measure the cable run; until then cable is an estimate.'
                : 'Grid squares are 5 ft. Light pools shown for point fixtures.'}
            </p>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Wiring system</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SYSTEMS.map((sys) => (
                    <button
                      key={sys.key}
                      type="button"
                      onClick={() => { setSystem(sys.key); if (sys.key !== 'lowvoltage') setPlacingTransformer(false); }}
                      aria-pressed={system === sys.key}
                      className={cn(
                        'rounded-lg border p-2 text-center transition-colors',
                        system === sys.key ? 'border-brand-bronze bg-accent/60' : 'border-border bg-muted/30 hover:border-brand-bronze/60'
                      )}
                    >
                      <sys.Icon className="mx-auto h-4 w-4 text-brand-bronze" />
                      <span className="mt-1 block text-[0.7rem] font-medium">{sys.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Units</Label>
                <RadioGroup value={unit} onValueChange={(v) => setUnit(v as 'metric' | 'imperial')} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="metric" id="lsd-met" />
                    <Label htmlFor="lsd-met" className="font-normal cursor-pointer">Metric</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="imperial" id="lsd-imp" />
                    <Label htmlFor="lsd-imp" className="font-normal cursor-pointer">Imperial</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Placed features ({placed.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {placed.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing placed yet. Pick a technique and click on the plan.</p>
              ) : (
                placed.map((pf) => {
                  const t = TECHNIQUES[pf.technique];
                  const k = drawKind(pf.technique);
                  return (
                    <div key={pf.id} className="rounded-md border border-border/60 p-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{t.name}</span>
                        <button onClick={() => removePlaced(pf.id)} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${t.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{measureText(pf)}</span>
                        {k === 'point' && (
                          <label className="flex items-center gap-1">
                            count
                            <Input
                              type="number"
                              min={1}
                              className="h-7 w-16"
                              value={pf.count ?? 1}
                              onChange={(e) => patchPlaced(pf.id, { count: Math.max(1, parseInt(e.target.value) || 1) })}
                            />
                          </label>
                        )}
                        {t.usesHeight && (
                          <label className="flex items-center gap-1">
                            h ({lenUnit})
                            <Input
                              type="number"
                              className="h-7 w-16"
                              value={Number(ftToUnit(pf.heightFt ?? t.defaultHeightFt ?? 0, metric).toFixed(1))}
                              onChange={(e) => patchPlaced(pf.id, { heightFt: Math.max(0, unitToFt(parseFloat(e.target.value) || 0, metric)) })}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {placed.length > 0 && result.totalFixtures > 0 && (
        <LandscapeResults result={result} onExport={handleExportPdf} pdfBusy={pdfBusy} />
      )}
    </div>
  );
}

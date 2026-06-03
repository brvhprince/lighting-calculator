'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Point,
  polygonArea,
  polygonPerimeter,
  placeFixturesInPolygon,
  rectangleShape,
  lShape,
  tShape,
  boundingBox,
  FixturePlacement,
} from '@/lib/geometry';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { buildLightingResult, dimToFeet } from '@/lib/calculator';
import { CalculationInput, CalculationResult, UnitSystem, RoomConfigValue } from '@/types';
import { saveCalculation, generateCalculationId } from '@/lib/savedCalculations';
import { SavedCalculation } from '@/types/saved-calculations';
import { buildShareUrl, decodeDesigner, DesignerState } from '@/lib/shareUrl';
import { LightingResults } from './LightingResults';
import { RoomConfigFields, defaultRoomConfig } from './RoomConfigFields';
import { resolveCustomLumensPerSqFt } from '@/lib/roomConfig';
import { SavedCalculations } from './SavedCalculations';
import { PDFExport } from './PDFExport';
import {
  Pentagon,
  Square,
  Trash2,
  Undo2,
  Maximize2,
  Flame,
  Lightbulb,
  Ruler,
  Pencil,
  ArrowLeftToLine,
  ArrowRightToLine,
  MoveHorizontal,
  Grid2x2,
  Save,
  Calculator,
  X,
} from 'lucide-react';

const FT_TO_M = 0.3048;
const SQFT_TO_SQM = 0.092903;
const FREE_SCALE = 16; // px per foot while drawing freeform
const SNAP_FT = 0.5;

type ShapeMode = 'rect' | 'l' | 't' | 'free';
type View = { scale: number; ox: number; oy: number };

const CANVAS_W = 720;
const CANVAS_H = 520;

export default function RoomDesigner() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [unit, setUnit] = useState<'imperial' | 'metric'>('imperial');
  const [mode, setMode] = useState<ShapeMode>('rect');
  const [points, setPoints] = useState<Point[]>(rectangleShape(14, 12));
  const [closed, setClosed] = useState(true);
  const [view, setView] = useState<View>({ scale: 1, ox: 0, oy: 0 });
  const [cursor, setCursor] = useState<Point | null>(null);
  const dragIndex = useRef<number | null>(null);

  // Shape dimension inputs (feet, internal)
  const [shapeW, setShapeW] = useState(14);
  const [shapeH, setShapeH] = useState(12);

  // Lighting parameters
  const [config, setConfig] = useState<RoomConfigValue>(() =>
    defaultRoomConfig({ roomType: 'livingRoom', ceilingFt: 9, fixtureSize: '4inch' })
  );
  const updateConfig = (patch: Partial<RoomConfigValue>) => setConfig((c) => ({ ...c, ...patch }));
  const [saved, setSaved] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [scaleRatio, setScaleRatio] = useState<'fit' | '20' | '50' | '100'>('fit');
  const [showDims, setShowDims] = useState(false);
  const [ortho, setOrtho] = useState(false);
  // Edge (wall) editing
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [edgeLen, setEdgeLen] = useState('');

  const unitLabel = unit === 'metric' ? 'm' : 'ft';
  const areaUnit = unit === 'metric' ? 'm²' : 'ft²';

  const toDisplayLen = useCallback(
    (ft: number) => (unit === 'metric' ? ft * FT_TO_M : ft),
    [unit]
  );

  // ---- View fitting -------------------------------------------------------
  const fitView = useCallback((pts: Point[]) => {
    if (pts.length < 2) {
      setView({ scale: FREE_SCALE, ox: 40, oy: 40 });
      return;
    }
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const w = Math.max(1, Math.max(...xs) - minX);
    const h = Math.max(1, Math.max(...ys) - minY);
    const pad = 56;
    const scale = Math.min((CANVAS_W - pad * 2) / w, (CANVAS_H - pad * 2) / h);
    const ox = (CANVAS_W - w * scale) / 2 - minX * scale;
    const oy = (CANVAS_H - h * scale) / 2 - minY * scale;
    setView({ scale, ox, oy });
  }, []);

  // Architectural drawing scale. At ~96 dpi, 1 ft drawn at `s` px gives a ratio
  // of 1 : (1152 / s). So a 1:N scale means s = 1152 / N px per foot.
  const PX_PER_INCH = 96;
  const centerAtScale = useCallback((pts: Point[], scale: number) => {
    if (!pts.length) {
      setView({ scale, ox: 40, oy: 40 });
      return;
    }
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    setView({ scale, ox: CANVAS_W / 2 - cx * scale, oy: CANVAS_H / 2 - cy * scale });
  }, []);

  const applyScale = useCallback(
    (mode: 'fit' | '20' | '50' | '100') => {
      setScaleRatio(mode);
      if (mode === 'fit') {
        fitView(points);
      } else {
        centerAtScale(points, (12 * PX_PER_INCH) / parseInt(mode, 10));
      }
    },
    [points, fitView, centerAtScale]
  );

  // Live ratio readout (1:N) derived from the current scale.
  const currentRatio = Math.max(1, Math.round((12 * PX_PER_INCH) / view.scale));

  // Generate a starter shape from the dimension inputs.
  const generateShape = useCallback(
    (m: ShapeMode, w: number, h: number) => {
      let pts: Point[] = [];
      if (m === 'rect') pts = rectangleShape(w, h);
      else if (m === 'l') pts = lShape(w, h);
      else if (m === 't') pts = tShape(w, h);
      if (pts.length) {
        setPoints(pts);
        setClosed(true);
        setScaleRatio('fit');
        setSelectedEdge(null);
        fitView(pts);
      }
    },
    [fitView]
  );

  const selectMode = (m: ShapeMode) => {
    setMode(m);
    setSelectedEdge(null);
    if (m === 'free') {
      setPoints([]);
      setClosed(false);
      setView({ scale: FREE_SCALE, ox: 40, oy: 40 });
    } else {
      generateShape(m, shapeW, shapeH);
    }
  };

  // Re-generate starter shapes when dimensions change.
  useEffect(() => {
    if (mode !== 'free') generateShape(mode, shapeW, shapeH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeW, shapeH]);

  // On mount: load a handed-off room from the Calculator (?d=…) if present.
  useEffect(() => {
    const enc = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('d') : null;
    if (enc) {
      const s = decodeDesigner(enc);
      if (s) {
        setUnit(s.unit);
        setMode('free');
        setConfig(s.config);
        setPoints(s.points);
        setClosed(true);
        setScaleRatio('fit');
        fitView(s.points);
        return;
      }
    }
    fitView(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Coordinate helpers -------------------------------------------------
  const toScreen = useCallback(
    (p: Point) => ({ x: view.ox + p.x * view.scale, y: view.oy + p.y * view.scale }),
    [view]
  );
  const toFeet = useCallback(
    (sx: number, sy: number): Point => ({
      x: snap((sx - view.ox) / view.scale),
      y: snap((sy - view.oy) / view.scale),
    }),
    [view]
  );

  // ---- Derived lighting results ------------------------------------------
  const areaSqFt = useMemo(() => (closed ? polygonArea(points) : 0), [points, closed]);
  const perimeterFt = useMemo(() => (closed ? polygonPerimeter(points) : 0), [points, closed]);

  // Build the SAME CalculationResult the calculator produces, from the drawn
  // polygon's area — so the designer can render the full LightingResults stack.
  const designed = useMemo(() => {
    if (!closed || areaSqFt <= 0) return null;
    const ceilingFt =
      config.sloped && config.ceilingPeakFt > 0
        ? (config.ceilingFt + config.ceilingPeakFt) / 2
        : config.ceilingFt;
    const customLps = resolveCustomLumensPerSqFt(config);
    let placement: FixturePlacement = { points: [], spacingFt: 0 };
    const result = buildLightingResult({
      areaInSqFt: areaSqFt,
      areaDisplay: unit === 'metric' ? areaSqFt * SQFT_TO_SQM : areaSqFt,
      unitSystem: unit as UnitSystem,
      roomType: config.roomType,
      customLumensPerSqFt: customLps,
      ceilingHeightFt: ceilingFt || 8,
      naturalLight: config.naturalLight !== 'none' ? config.naturalLight : undefined,
      fixtureSize: config.fixtureSize || undefined,
      customFixtureLumens: config.customFixtureLumens ? parseFloat(config.customFixtureLumens) : undefined,
      makeSpacing: (count) => {
        placement = placeFixturesInPolygon(points, count, { minWallMarginFt: 1.5 });
        return polygonSpacing(points, placement.spacingFt, unit);
      },
    });
    return { result, fixtures: placement.points, spacingFt: placement.spacingFt };
  }, [closed, areaSqFt, config, points, unit]);

  const result = designed; // canvas drawing reads fixtures/spacing from here

  // Build a CalculationInput from the drawn room's bounding box + shared config.
  const buildInputFromDesign = (): CalculationInput => {
    const bb = boundingBox(points);
    const toLen = (ft: number) => (unit === 'metric' ? ft * FT_TO_M : ft);
    return {
      length: toLen(bb.maxY - bb.minY),
      width: toLen(bb.maxX - bb.minX),
      unitSystem: unit as UnitSystem,
      roomType: config.roomType,
      isExpert: !!(config.customLumensPerSqFt || config.customFixtureLumens),
      ceilingHeight: toLen(config.ceilingFt),
      slopedCeiling: config.sloped || undefined,
      ceilingPeakHeight: config.sloped && config.ceilingPeakFt ? toLen(config.ceilingPeakFt) : undefined,
      naturalLight: config.naturalLight !== 'none' ? config.naturalLight : undefined,
      fixtureSize: config.fixtureSize || undefined,
      customFixtureLumens: config.customFixtureLumens ? parseFloat(config.customFixtureLumens) : undefined,
      customLumensPerSqFt: resolveCustomLumensPerSqFt(config),
    };
  };

  // Save the drawn room to the shared library so it can be added to a Project.
  const handleSave = () => {
    if (!designed) return;
    const roomName =
      config.roomType === 'other' && config.customRoomName
        ? config.customRoomName
        : ROOM_TYPES[config.roomType]?.name || 'Room';
    saveCalculation({
      id: generateCalculationId(),
      name: `${roomName} (drawn) · ${designed.result.area.toFixed(0)} ${designed.result.areaUnit}`,
      timestamp: Date.now(),
      type: 'full',
      input: buildInputFromDesign(),
      result: designed.result,
      // Persist the actual drawn shape so it reopens exactly.
      designer: { unit, config, points },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Reopen a saved item: a drawn room restores its true polygon; a rectangular
  // calculation opens as an editable rectangle.
  const applyDesignerState = (st: DesignerState) => {
    setUnit(st.unit);
    setMode('free');
    setConfig(st.config);
    setPoints(st.points);
    setClosed(true);
    setScaleRatio('fit');
    setSelectedEdge(null);
    fitView(st.points);
  };

  const handleLoadSaved = (calc: SavedCalculation) => {
    if (calc.designer) {
      applyDesignerState(calc.designer);
      return;
    }
    if (calc.type !== 'full') return;
    const input = calc.input as CalculationInput;
    const toFt = (v?: number) => (v ? dimToFeet(v, input.unitSystem) : 0);
    applyDesignerState({
      unit: input.unitSystem,
      config: defaultRoomConfig({
        roomType: input.roomType,
        ceilingFt: input.ceilingHeight ? dimToFeet(input.ceilingHeight, input.unitSystem) : 8,
        sloped: input.slopedCeiling ?? false,
        ceilingPeakFt: input.ceilingPeakHeight ? dimToFeet(input.ceilingPeakHeight, input.unitSystem) : 0,
        naturalLight: input.naturalLight ?? 'none',
        fixtureSize: input.fixtureSize || '',
        customFixtureLumens: input.customFixtureLumens?.toString() || '',
        customLumensPerSqFt:
          input.roomType !== 'other' && input.customLumensPerSqFt ? String(input.customLumensPerSqFt) : '',
        customRoomLumens:
          input.roomType === 'other' && input.customLumensPerSqFt ? String(input.customLumensPerSqFt) : '',
      }),
      points: rectangleShape(toFt(input.width), toFt(input.length)),
    });
  };

  // Hand off to the Complete Calculator using the drawn room's bounding box.
  const sendToCalculator = () => {
    if (!designed) return;
    router.push(buildShareUrl(buildInputFromDesign()));
  };

  // ---- Rendering ----------------------------------------------------------
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
    const basalt = `hsl(${styles.getPropertyValue('--brand-basalt').trim()})`;
    const sage = `hsl(${styles.getPropertyValue('--brand-sage').trim()})`;
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(245,242,237,0.08)' : 'rgba(44,51,46,0.08)';
    const gridColorMajor = isDark ? 'rgba(245,242,237,0.16)' : 'rgba(44,51,46,0.16)';

    // Grid (1 ft minor, 5 ft major)
    const step = view.scale;
    if (step > 4) {
      const startFtX = Math.floor((-view.ox) / view.scale);
      const endFtX = Math.ceil((CANVAS_W - view.ox) / view.scale);
      const startFtY = Math.floor((-view.oy) / view.scale);
      const endFtY = Math.ceil((CANVAS_H - view.oy) / view.scale);
      for (let fx = startFtX; fx <= endFtX; fx++) {
        const x = view.ox + fx * view.scale;
        ctx.beginPath();
        ctx.strokeStyle = fx % 5 === 0 ? gridColorMajor : gridColor;
        ctx.lineWidth = 1;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_H);
        ctx.stroke();
      }
      for (let fy = startFtY; fy <= endFtY; fy++) {
        const y = view.oy + fy * view.scale;
        ctx.beginPath();
        ctx.strokeStyle = fy % 5 === 0 ? gridColorMajor : gridColor;
        ctx.lineWidth = 1;
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
        ctx.stroke();
      }
    }

    if (points.length === 0) {
      ctx.fillStyle = isDark ? 'rgba(245,242,237,0.4)' : 'rgba(44,51,46,0.4)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click to place corners. Click the first point to close the shape.', CANVAS_W / 2, CANVAS_H / 2);
      return;
    }

    const screenPts = points.map(toScreen);

    // Polygon path
    ctx.beginPath();
    ctx.moveTo(screenPts[0].x, screenPts[0].y);
    for (let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y);
    if (closed) ctx.closePath();
    else if (cursor) {
      const c = toScreen(cursor);
      ctx.lineTo(c.x, c.y);
    }

    ctx.fillStyle = isDark ? 'rgba(138,150,130,0.12)' : 'rgba(138,150,130,0.18)';
    if (closed) ctx.fill();
    ctx.strokeStyle = bronze;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Highlight the selected wall
    if (closed && selectedEdge !== null && screenPts[selectedEdge]) {
      const A = screenPts[selectedEdge];
      const B = screenPts[(selectedEdge + 1) % screenPts.length];
      ctx.beginPath();
      ctx.strokeStyle = sage;
      ctx.lineWidth = 4;
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }

    // Fixtures + heatmap
    if (result && result.fixtures.length) {
      if (showHeatmap) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const radius = Math.max(result.spacingFt * 0.85, 2) * view.scale;
        for (const f of result.fixtures) {
          const s = toScreen(f);
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, radius);
          grad.addColorStop(0, 'rgba(166,137,102,0.45)');
          grad.addColorStop(1, 'rgba(166,137,102,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      for (const f of result.fixtures) {
        const s = toScreen(f);
        ctx.beginPath();
        ctx.fillStyle = bronze;
        ctx.strokeStyle = isDark ? basalt : '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Vertices
    for (let i = 0; i < screenPts.length; i++) {
      const s = screenPts[i];
      ctx.beginPath();
      ctx.fillStyle = i === 0 && !closed ? sage : basalt;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Labels on top (so the heatmap can't wash them out), each on a contrast pill.
    const labelBg = isDark ? 'rgba(18,22,19,0.9)' : 'rgba(245,242,237,0.95)';
    const labelFg = isDark ? '#F5F2ED' : '#2C332E';
    const cornerBg = `hsl(${styles.getPropertyValue('--brand-bronze').trim()})`;

    const pill = (text: string, x: number, y: number, fg: string, bg: string) => {
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const w = ctx.measureText(text).width + 10;
      const h = 16;
      const rx = x - w / 2;
      const ry = y - h / 2;
      const r = 5;
      ctx.beginPath();
      ctx.moveTo(rx + r, ry);
      ctx.arcTo(rx + w, ry, rx + w, ry + h, r);
      ctx.arcTo(rx + w, ry + h, rx, ry + h, r);
      ctx.arcTo(rx, ry + h, rx, ry, r);
      ctx.arcTo(rx, ry, rx + w, ry, r);
      ctx.closePath();
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.fillText(text, x, y);
    };

    // Edge length labels
    if (points.length >= 2) {
      const segs = closed ? points.length : points.length - 1;
      for (let i = 0; i < segs; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        const lenFt = Math.hypot(b.x - a.x, b.y - a.y);
        if (lenFt < 0.1) continue;
        const mid = toScreen({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        pill(`${toDisplayLen(lenFt).toFixed(1)} ${unitLabel}`, mid.x, mid.y, labelFg, labelBg);
      }
    }

    // Corner numbers, nudged outward from the shape's centre.
    if (points.length >= 1) {
      const cx = screenPts.reduce((s, p) => s + p.x, 0) / screenPts.length;
      const cy = screenPts.reduce((s, p) => s + p.y, 0) / screenPts.length;
      for (let i = 0; i < screenPts.length; i++) {
        const s = screenPts[i];
        const dx = s.x - cx;
        const dy = s.y - cy;
        const d = Math.hypot(dx, dy) || 1;
        pill(String(i + 1), s.x + (dx / d) * 16, s.y + (dy / d) * 16, '#ffffff', cornerBg);
      }
    }

    ctx.textBaseline = 'alphabetic';
  }, [points, closed, cursor, view, toScreen, result, showHeatmap, toDisplayLen, unitLabel, selectedEdge]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ---- Pointer interaction ------------------------------------------------
  const getLocal = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return { sx: (e.clientX - rect.left) * scaleX, sy: (e.clientY - rect.top) * scaleY };
  };

  const hitVertex = (sx: number, sy: number): number | null => {
    for (let i = 0; i < points.length; i++) {
      const s = toScreen(points[i]);
      if (Math.hypot(s.x - sx, s.y - sy) <= 9) return i;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const { sx, sy } = getLocal(e);
    if (!closed && mode === 'free') {
      // Close if clicking near the first point
      if (points.length >= 3) {
        const first = toScreen(points[0]);
        if (Math.hypot(first.x - sx, first.y - sy) <= 10) {
          setClosed(true);
          setCursor(null);
          fitView(points);
          return;
        }
      }
      const raw = toFeet(sx, sy);
      const last = points[points.length - 1];
      const np = ortho && last ? orthoSnap(last, raw) : raw;
      setPoints((prev) => [...prev, np]);
      return;
    }
    const hit = hitVertex(sx, sy);
    if (hit !== null) {
      dragIndex.current = hit;
      setSelectedEdge(null);
      canvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    // Otherwise, try to select a wall (edge) to edit its length.
    if (closed && points.length >= 2) {
      const n = points.length;
      let bestE = -1;
      let bestD = Infinity;
      for (let i = 0; i < n; i++) {
        const A = toScreen(points[i]);
        const B = toScreen(points[(i + 1) % n]);
        const d = segDistPx({ x: sx, y: sy }, A, B);
        if (d < bestD) {
          bestD = d;
          bestE = i;
        }
      }
      if (bestE >= 0 && bestD <= 8) {
        const A = points[bestE];
        const B = points[(bestE + 1) % n];
        const len = Math.hypot(B.x - A.x, B.y - A.y);
        setSelectedEdge(bestE);
        setEdgeLen(toDisplayLen(len).toFixed(2));
      } else {
        setSelectedEdge(null);
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const { sx, sy } = getLocal(e);
    if (dragIndex.current !== null) {
      const v = toFeet(sx, sy);
      const i = dragIndex.current;
      const n = points.length;
      if (ortho && closed && n >= 3) {
        // Keep adjacent walls axis-aligned: drag the vertex freely and slide each
        // neighbour along the shared axis so its wall stays horizontal/vertical.
        const prevIdx = (i - 1 + n) % n;
        const nextIdx = (i + 1) % n;
        const prevOri = orientation(points[prevIdx], points[i]);
        const nextOri = orientation(points[i], points[nextIdx]);
        setPoints((prev) =>
          prev.map((pt, idx) => {
            if (idx === i) return v;
            if (idx === prevIdx) return prevOri === 'h' ? { ...pt, y: v.y } : { ...pt, x: v.x };
            if (idx === nextIdx) return nextOri === 'h' ? { ...pt, y: v.y } : { ...pt, x: v.x };
            return pt;
          })
        );
      } else {
        setPoints((prev) => prev.map((pt, idx) => (idx === i ? v : pt)));
      }
    } else if (!closed && mode === 'free' && points.length > 0) {
      const raw = toFeet(sx, sy);
      const last = points[points.length - 1];
      setCursor(ortho ? orthoSnap(last, raw) : raw);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragIndex.current !== null) {
      dragIndex.current = null;
      canvasRef.current?.releasePointerCapture(e.pointerId);
    }
  };

  const fromDimLen = (v: number) => (unit === 'metric' ? v / FT_TO_M : v);
  const setCoord = (i: number, axis: 'x' | 'y', displayValue: number) => {
    const ft = fromDimLen(displayValue);
    setPoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, [axis]: ft } : p)));
  };

  // Resize the selected wall to a new length, keeping its direction. The change
  // resolves by moving the start corner, the end corner, or both evenly.
  const applyEdgeLength = (mode: 'start' | 'end' | 'spread') => {
    if (selectedEdge === null) return;
    const n = points.length;
    const i = selectedEdge;
    const bIdx = (i + 1) % n;
    const A = points[i];
    const B = points[bIdx];
    const curLen = Math.hypot(B.x - A.x, B.y - A.y);
    if (curLen === 0) return;
    const dx = (B.x - A.x) / curLen;
    const dy = (B.y - A.y) / curLen;
    const newLen = fromDimLen(parseFloat(edgeLen) || 0);
    if (newLen <= 0) return;

    // In ortho mode, force the wall onto its dominant axis so the length change
    // stays purely horizontal/vertical.
    let ux = dx;
    let uy = dy;
    if (ortho) {
      if (orientation(A, B) === 'h') {
        ux = Math.sign(dx) || 1;
        uy = 0;
      } else {
        ux = 0;
        uy = Math.sign(dy) || 1;
      }
    }

    let A2 = A;
    let B2 = B;
    if (mode === 'end') {
      B2 = { x: A.x + ux * newLen, y: A.y + uy * newLen };
    } else if (mode === 'start') {
      A2 = { x: B.x - ux * newLen, y: B.y - uy * newLen };
    } else {
      const mx = (A.x + B.x) / 2;
      const my = (A.y + B.y) / 2;
      A2 = { x: mx - (ux * newLen) / 2, y: my - (uy * newLen) / 2 };
      B2 = { x: mx + (ux * newLen) / 2, y: my + (uy * newLen) / 2 };
    }

    // Pull the perpendicular neighbour walls along so corners stay square.
    const zIdx = (i - 1 + n) % n;
    const cIdx = (bIdx + 1) % n;
    const movedA = A2 !== A;
    const movedB = B2 !== B;
    const orthoNeighbours = ortho && n >= 4;
    const zOri = orientation(points[zIdx], A);
    const cOri = orientation(B, points[cIdx]);

    setPoints((prev) =>
      prev.map((p, idx) => {
        if (idx === i) return A2;
        if (idx === bIdx) return B2;
        if (orthoNeighbours && idx === zIdx && movedA && zIdx !== bIdx) {
          return zOri === 'h' ? { ...p, y: A2.y } : { ...p, x: A2.x };
        }
        if (orthoNeighbours && idx === cIdx && movedB && cIdx !== i) {
          return cOri === 'h' ? { ...p, y: B2.y } : { ...p, x: B2.x };
        }
        return p;
      })
    );
    setSelectedEdge(null);
  };

  // Snap a near-rectilinear shape so every wall becomes exactly horizontal or
  // vertical (all corners 90°). Walks the loop, aligning each wall's end corner
  // to its start, then tidies the closing wall and snaps to the grid.
  const squareUp = () => {
    const n = points.length;
    if (n < 3) return;
    const pts = points.map((p) => ({ ...p }));
    for (let i = 0; i < n - 1; i++) {
      if (orientation(pts[i], pts[i + 1]) === 'h') pts[i + 1].y = pts[i].y;
      else pts[i + 1].x = pts[i].x;
    }
    const lastOri = orientation(pts[n - 2], pts[n - 1]);
    const closeOri = orientation(pts[n - 1], pts[0]);
    if (closeOri !== lastOri) {
      if (closeOri === 'h') pts[n - 1].y = pts[0].y;
      else pts[n - 1].x = pts[0].x;
    }
    for (const p of pts) {
      p.x = snap(p.x);
      p.y = snap(p.y);
    }
    setPoints(pts);
    setSelectedEdge(null);
  };

  const undoPoint = () => {
    if (mode === 'free' && !closed) setPoints((prev) => prev.slice(0, -1));
  };
  const clearShape = () => {
    setPoints([]);
    setClosed(false);
    setSelectedEdge(null);
  };
  const finishShape = () => {
    if (mode === 'free' && points.length >= 3) {
      setClosed(true);
      setCursor(null);
      fitView(points);
    }
  };

  // Screen-space midpoint of the selected wall, for positioning the editor popup.
  const edgeMid =
    selectedEdge !== null && points[selectedEdge]
      ? (() => {
          const A = toScreen(points[selectedEdge]);
          const B = toScreen(points[(selectedEdge + 1) % points.length]);
          return { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
        })()
      : null;

  const dimLabel = unit === 'metric' ? '(m)' : '(ft)';
  const toDim = (ft: number) => (unit === 'metric' ? (ft * FT_TO_M).toFixed(1) : String(ft));
  const fromDim = (v: number) => (unit === 'metric' ? v / FT_TO_M : v);

  return (
    <div className="space-y-6">
    <div className="flex justify-end">
      <SavedCalculations onLoad={handleLoadSaved} />
    </div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Canvas */}
      <Card className="overflow-hidden">
        <CardHeader className="space-y-3 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Pentagon className="h-5 w-5 text-brand-bronze" />
              Room Designer
            </CardTitle>
            <CardDescription>Draw any shape to scale — grid squares are 1 {unitLabel}.</CardDescription>
          </div>
          <div className="flex w-full flex-wrap items-stretch gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHeatmap((v) => !v)}
              className="flex-1 gap-1.5 border border-border"
            >
              <Flame className={`h-4 w-4 ${showHeatmap ? 'text-brand-bronze' : ''}`} />
              Heatmap
            </Button>
            <Button
              variant={ortho ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setOrtho((v) => !v)}
              className={`flex-1 ${ortho ? '' : 'border border-border'}`}
              title="Constrain corners to right angles"
            >
              90°
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={squareUp}
              disabled={!closed || points.length < 3}
              className="flex-1 gap-1.5 border border-border"
              title="Snap all corners to exact right angles"
            >
              <Grid2x2 className="h-4 w-4" /> Square up
            </Button>
            <Select value={scaleRatio} onValueChange={(v) => applyScale(v as typeof scaleRatio)}>
              <SelectTrigger className="h-9 flex-1 min-w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fit">Auto-fit</SelectItem>
                <SelectItem value="20">Scale 1:20</SelectItem>
                <SelectItem value="50">Scale 1:50</SelectItem>
                <SelectItem value="100">Scale 1:100</SelectItem>
              </SelectContent>
            </Select>
            <span className="flex items-center justify-center rounded-md border border-border px-2 text-xs tabular-nums text-muted-foreground">
              1:{currentRatio}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyScale('fit')}
              className="flex-1 gap-1.5 border border-border"
              title="Reset zoom so the whole plan fits the canvas"
            >
              <Maximize2 className="h-4 w-4" /> Fit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Shape mode buttons */}
          <div className="flex flex-wrap gap-2">
            {([
              ['rect', 'Rectangle'],
              ['l', 'L-Shape'],
              ['t', 'T-Shape'],
              ['free', 'Freeform'],
            ] as [ShapeMode, string][]).map(([m, label]) => (
              <Button
                key={m}
                variant={mode === m ? 'default' : 'outline'}
                size="sm"
                onClick={() => selectMode(m)}
              >
                {m === 'free' ? <Pentagon className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {label}
              </Button>
            ))}
          </div>

          <div
            ref={wrapRef}
            className="relative rounded-lg border border-border bg-muted/20"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
          >
            <canvas
              ref={canvasRef}
              role="img"
              aria-label="Room floor-plan canvas — draw and edit the room shape and fixture layout"
              className="absolute inset-0 h-full w-full touch-none rounded-lg"
              style={{ cursor: mode === 'free' && !closed ? 'crosshair' : 'pointer' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onDoubleClick={finishShape}
            />

            {/* Wall-length editor popup */}
            {edgeMid && (
              <div
                className="absolute z-20 w-44 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover p-2.5 shadow-lg"
                style={{ left: `${(edgeMid.x / CANVAS_W) * 100}%`, top: `${(edgeMid.y / CANVAS_H) * 100}%` }}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium">Wall length ({unitLabel})</span>
                  <button
                    onClick={() => setSelectedEdge(null)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input
                  autoFocus
                  type="number"
                  step="0.5"
                  className="h-8"
                  value={edgeLen}
                  onChange={(e) => setEdgeLen(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyEdgeLength('spread');
                    if (e.key === 'Escape') setSelectedEdge(null);
                  }}
                />
                <p className="mt-2 mb-1 text-[0.7rem] text-muted-foreground">Resolve by moving…</p>
                <div className="flex gap-1.5">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    title="Move the start corner"
                    onClick={() => applyEdgeLength('start')}
                  >
                    <ArrowLeftToLine className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    title="Spread evenly from the centre"
                    onClick={() => applyEdgeLength('spread')}
                  >
                    <MoveHorizontal className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    title="Move the end corner"
                    onClick={() => applyEdgeLength('end')}
                  >
                    <ArrowRightToLine className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Freeform controls */}
          {mode === 'free' && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={undoPoint} disabled={closed || points.length === 0} className="gap-1.5">
                <Undo2 className="h-4 w-4" /> Undo point
              </Button>
              <Button variant="outline" size="sm" onClick={finishShape} disabled={closed || points.length < 3}>
                Finish shape
              </Button>
              <Button variant="outline" size="sm" onClick={clearShape} className="gap-1.5">
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {mode === 'free' && !closed
              ? 'Click to drop corners; click the first corner (or double-click) to close.'
              : 'Drag a corner to move it, or click a wall to set its exact length.'}
          </p>

          {/* Editable dimensions */}
          {points.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDims((v) => !v)}
                className="gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                {showDims ? 'Hide coordinates' : 'Edit corner coordinates'}
              </Button>
              {showDims && (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Ruler className="h-3.5 w-3.5" />
                    Exact corner coordinates in {unitLabel} — corners are numbered on the plan. X is
                    horizontal, Y is vertical; edge lengths update live.
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {points.map((p, i) => (
                      <div key={i} className="rounded-md border border-border/60 p-2">
                        <p className="mb-1 text-xs font-medium">Corner {i + 1}</p>
                        <div className="flex gap-1.5">
                          <Input
                            aria-label={`Corner ${i + 1} X (${unitLabel})`}
                            type="number"
                            step="0.5"
                            className="h-8"
                            value={Number(toDisplayLen(p.x).toFixed(2))}
                            onChange={(e) => setCoord(i, 'x', parseFloat(e.target.value) || 0)}
                          />
                          <Input
                            aria-label={`Corner ${i + 1} Y (${unitLabel})`}
                            type="number"
                            step="0.5"
                            className="h-8"
                            value={Number(toDisplayLen(p.y).toFixed(2))}
                            onChange={(e) => setCoord(i, 'y', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls + Results */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Units</Label>
              <RadioGroup
                value={unit}
                onValueChange={(v) => setUnit(v as 'imperial' | 'metric')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="imperial" id="d-imp" />
                  <Label htmlFor="d-imp" className="font-normal cursor-pointer">Imperial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="metric" id="d-met" />
                  <Label htmlFor="d-met" className="font-normal cursor-pointer">Metric</Label>
                </div>
              </RadioGroup>
            </div>

            {mode !== 'free' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sw">Width {dimLabel}</Label>
                  <Input
                    id="sw"
                    type="number"
                    value={toDim(shapeW)}
                    onChange={(e) => setShapeW(Math.max(1, Math.round(fromDim(parseFloat(e.target.value) || 0))))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sh">Length {dimLabel}</Label>
                  <Input
                    id="sh"
                    type="number"
                    value={toDim(shapeH)}
                    onChange={(e) => setShapeH(Math.max(1, Math.round(fromDim(parseFloat(e.target.value) || 0))))}
                  />
                </div>
              </div>
            )}

            <RoomConfigFields
              value={config}
              onChange={updateConfig}
              unitSystem={unit as UnitSystem}
              showAdvanced
              idPrefix="d"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-5 w-5 text-brand-bronze" />
              Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {designed ? (
              <>
                <Metric label="Floor area">
                  {(unit === 'metric' ? areaSqFt * SQFT_TO_SQM : areaSqFt).toFixed(1)} {areaUnit}
                </Metric>
                <Metric label="Perimeter">
                  {toDisplayLen(perimeterFt).toFixed(1)} {unitLabel}
                </Metric>
                <Metric label="Total lumens">
                  {designed.result.totalLumensNeeded.toLocaleString()}
                </Metric>
                <Metric label="Fixtures placed">
                  {designed.fixtures.length}
                  {designed.fixtures.length !== designed.result.numberOfFixtures && (
                    <span className="text-xs text-muted-foreground">
                      {' '}
                      (target {designed.result.numberOfFixtures})
                    </span>
                  )}
                </Metric>
                <Metric label="Avg. spacing">
                  {toDisplayLen(designed.spacingFt).toFixed(1)} {unitLabel}
                </Metric>
                {designed.result.ceilingFactor !== 1 && (
                  <Metric label="Ceiling adjustment">
                    <span className="text-brand-bronze">
                      {designed.result.ceilingFactor > 1 ? '+' : ''}
                      {Math.round((designed.result.ceilingFactor - 1) * 100)}%
                    </span>
                  </Metric>
                )}
                <p className="pt-1 text-xs text-muted-foreground">
                  {designed.fixtures.length}× {designed.result.fixtureSize} fixtures at ~
                  {designed.result.lumensPerFixture} lumens each, across your floor plan.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Close a shape to see lumens, fixture count and layout.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

      {/* Full shared analysis — identical to the Complete Calculator */}
      {designed && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Same lumen, zone, cost and product analysis as the Complete Calculator — from your drawn plan.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={sendToCalculator} variant="outline" className="gap-2">
                <Calculator className="h-4 w-4" />
                Send to Calculator
              </Button>
              <PDFExport
                result={designed.result}
                roomType={config.roomType}
                customRoomName={config.roomType === 'other' ? config.customRoomName : undefined}
                polygon={points}
                fixtures={designed.fixtures}
              />
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                {saved ? 'Saved to library' : 'Save to library'}
              </Button>
            </div>
          </div>
          <LightingResults
            result={designed.result}
            roomType={config.roomType}
            customRoomName={config.roomType === 'other' ? config.customRoomName : undefined}
            source="designer"
          />
        </>
      )}
    </div>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}

function snap(v: number): number {
  return Math.round(v / SNAP_FT) * SNAP_FT;
}

// Approximate a CalculationResult spacing object from a polygon placement, so the
// drawn-room result is shape-compatible with the rectangular calculator's.
function polygonSpacing(
  points: Point[],
  spacingFt: number,
  unit: 'imperial' | 'metric'
): CalculationResult['spacing'] {
  const bb = boundingBox(points);
  const s = spacingFt || 1;
  const cols = Math.max(1, Math.round((bb.maxX - bb.minX) / s));
  const rows = Math.max(1, Math.round((bb.maxY - bb.minY) / s));
  const toUnit = (ft: number) => (unit === 'metric' ? Math.round(ft * 304.8) : Math.round(ft * 12));
  return {
    betweenFixtures: toUnit(s),
    fromWall: toUnit(1.5),
    unit: unit === 'metric' ? 'mm' : 'inches',
    layout: { rows, columns: cols, rowSpacing: toUnit(s), columnSpacing: toUnit(s) },
  };
}

// Edge orientation: 'h' (horizontal) when it runs more left-right than up-down.
function orientation(a: Point, b: Point): 'h' | 'v' {
  return Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? 'h' : 'v';
}

// Snap a point so the segment from `prev` is purely horizontal or vertical.
function orthoSnap(prev: Point, raw: Point): Point {
  return Math.abs(raw.x - prev.x) >= Math.abs(raw.y - prev.y)
    ? { x: raw.x, y: prev.y }
    : { x: prev.x, y: raw.y };
}

// Distance from point P to segment A–B, in the same (screen) coordinate space.
function segDistPx(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

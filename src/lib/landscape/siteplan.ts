import { Point, polygonArea } from '@/lib/geometry';
import { LandscapeFeature, LandscapeTechnique } from '@/types/landscape';
import { TECHNIQUES } from './techniques';
import type { LandscapeResult } from './engine';

const FT_TO_M = 0.3048;
const LV_VOLTS = 12; // low-voltage system nominal voltage

// A fixture position with its electrical load, for cable + voltage-drop math.
export type Anchor = Point & { watts: number };

// Copper conductor resistance, ohms per 1000 ft, by AWG gauge.
export const CABLE_GAUGES = [
  { awg: 14, ohmPer1000ft: 2.525 },
  { awg: 12, ohmPer1000ft: 1.588 },
  { awg: 10, ohmPer1000ft: 0.999 },
  { awg: 8, ohmPer1000ft: 0.628 },
] as const;

export type CableGauge = (typeof CABLE_GAUGES)[number]['awg'];

// A feature drawn on the site plan. `points` are in feet:
//   point techniques  -> 1 point
//   length techniques -> a polyline (2+ points)
//   area techniques   -> a closed polygon (3+ points)
export type PlacedFeature = {
  id: string;
  technique: LandscapeTechnique;
  points: Point[];
  count?: number; // for count techniques (e.g. steps per flight); defaults to 1
  heightFt?: number;
  label?: string;
};

export function drawKind(technique: LandscapeTechnique): 'point' | 'line' | 'area' {
  const m = TECHNIQUES[technique].measure;
  return m === 'count' ? 'point' : m === 'length' ? 'line' : 'area';
}

export function polylineLengthFt(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

function centroid(points: Point[]): Point {
  const n = points.length || 1;
  return {
    x: points.reduce((s, p) => s + p.x, 0) / n,
    y: points.reduce((s, p) => s + p.y, 0) / n,
  };
}

// Translate drawn features into engine features (deriving count/length/area).
export function placedToFeatures(placed: PlacedFeature[]): LandscapeFeature[] {
  return placed.map((p) => {
    const kind = drawKind(p.technique);
    const f: LandscapeFeature = { id: p.id, technique: p.technique, label: p.label, heightFt: p.heightFt };
    if (kind === 'point') f.count = p.count ?? 1;
    else if (kind === 'line') f.lengthFt = polylineLengthFt(p.points);
    else f.areaSqFt = polygonArea(p.points);
    return f;
  });
}

// Approximate fixture positions for a feature, given how many fixtures the engine
// assigned to it: point -> the point; line -> evenly along the polyline; area ->
// the centroid (a single feed point).
export function anchorsForFeature(p: PlacedFeature, quantity: number): Point[] {
  const kind = drawKind(p.technique);
  if (kind === 'point' || p.points.length === 1) return p.points.slice(0, 1);
  if (kind === 'area') return [centroid(p.points)];

  // line: distribute `quantity` points by arc length
  const total = polylineLengthFt(p.points);
  if (total === 0 || quantity <= 1) return [p.points[0]];
  const out: Point[] = [];
  for (let i = 0; i < quantity; i++) {
    const target = (total * (i + 0.5)) / quantity;
    out.push(pointAtArcLength(p.points, target));
  }
  return out;
}

function pointAtArcLength(points: Point[], target: number): Point {
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const seg = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (acc + seg >= target) {
      const t = seg === 0 ? 0 : (target - acc) / seg;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
      };
    }
    acc += seg;
  }
  return points[points.length - 1];
}

// All fixture anchors for a design, tagged with each fixture's wattage, by
// matching the engine's per-feature quantities back to the drawn geometry.
export function planAnchors(placed: PlacedFeature[], result: LandscapeResult): Anchor[] {
  const out: Anchor[] = [];
  for (const line of result.lines) {
    const pf = placed.find((p) => p.id === line.featureId);
    if (!pf) continue;
    for (const pt of anchorsForFeature(pf, line.quantity)) {
      out.push({ ...pt, watts: line.wattsEach });
    }
  }
  return out;
}

// Greedy nearest-neighbour visiting order from the transformer through every
// anchor. The transformer is the first node (watts 0). Practical, not optimal.
export function cableChain(transformer: Point, anchors: Anchor[]): Anchor[] {
  const chain: Anchor[] = [{ ...transformer, watts: 0 }];
  const remaining = anchors.slice();
  let current: Point = transformer;
  while (remaining.length) {
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = Math.hypot(remaining[i].x - current.x, remaining[i].y - current.y);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    chain.push(next);
    current = next;
  }
  return chain;
}

// Total cable length of a chain, in metres.
export function cableMetersFromChain(chain: Anchor[]): number {
  let ft = 0;
  for (let i = 1; i < chain.length; i++) {
    ft += Math.hypot(chain[i].x - chain[i - 1].x, chain[i].y - chain[i - 1].y);
  }
  return ft * FT_TO_M;
}

// Convenience kept for callers that only need the length from raw anchors.
export function cableRunMeters(transformer: Point, anchors: Anchor[]): number {
  return cableMetersFromChain(cableChain(transformer, anchors));
}

export type VoltageDropResult = {
  gauge: CableGauge;
  minVoltage: number; // volts at the farthest fixture
  worstDropPct: number; // (12 - minVoltage) / 12
  ok: boolean; // within the 10% guideline
};

// Voltage drop along the daisy-chain: each segment carries the cumulative
// downstream load, so the farthest fixture sees the largest accumulated drop.
// Vdrop_segment = 2 × I × R, with R from the segment length and gauge.
export function voltageDrop(chain: Anchor[], gauge: CableGauge): VoltageDropResult {
  const r1000 = CABLE_GAUGES.find((g) => g.awg === gauge)?.ohmPer1000ft ?? 1.588;
  let cumulativeDrop = 0;
  let minVoltage = LV_VOLTS;
  for (let i = 1; i < chain.length; i++) {
    const segFt = Math.hypot(chain[i].x - chain[i - 1].x, chain[i].y - chain[i - 1].y);
    // Current through this segment = load of every node from here to the end.
    let downstreamWatts = 0;
    for (let j = i; j < chain.length; j++) downstreamWatts += chain[j].watts;
    const amps = downstreamWatts / LV_VOLTS;
    const ohms = (segFt / 1000) * r1000;
    cumulativeDrop += 2 * amps * ohms;
    minVoltage = Math.min(minVoltage, LV_VOLTS - cumulativeDrop);
  }
  const worstDropPct = ((LV_VOLTS - minVoltage) / LV_VOLTS) * 100;
  return {
    gauge,
    minVoltage: Math.round(minVoltage * 10) / 10,
    worstDropPct: Math.round(worstDropPct * 10) / 10,
    ok: worstDropPct <= 10,
  };
}

export { FT_TO_M };

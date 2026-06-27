import { Point, polygonArea } from '@/lib/geometry';
import { LandscapeFeature, LandscapeTechnique } from '@/types/landscape';
import { TECHNIQUES } from './techniques';

const FT_TO_M = 0.3048;

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

// Greedy nearest-neighbour cable run from the transformer through every fixture
// anchor, returned in metres. A practical planning estimate, not an optimal route.
export function cableRunMeters(transformer: Point, anchors: Point[]): number {
  if (!anchors.length) return 0;
  const remaining = anchors.slice();
  let current = transformer;
  let totalFt = 0;
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
    totalFt += bestD;
    current = remaining.splice(bestIdx, 1)[0];
  }
  return totalFt * FT_TO_M;
}

export { FT_TO_M };

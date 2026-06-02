// 2D geometry helpers for the room designer.
// All coordinates are in feet (the calculator's internal standard unit).

export type Point = { x: number; y: number };

// Shoelace formula — absolute polygon area for a simple (non-self-intersecting)
// polygon given in feet. Returns square feet.
export function polygonArea(points: Point[]): number {
  const n = points.length;
  if (n < 3) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

// Total edge length (perimeter) in feet.
export function polygonPerimeter(points: Point[]): number {
  const n = points.length;
  if (n < 2) return 0;
  let p = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    p += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return p;
}

// Ray-casting point-in-polygon test.
export function pointInPolygon(pt: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export type BBox = { minX: number; minY: number; maxX: number; maxY: number };

export function boundingBox(points: Point[]): BBox {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

// Distance from a point to the nearest polygon edge (feet). Used to keep
// fixtures off the walls.
export function distanceToPolygonEdge(pt: Point, polygon: Point[]): number {
  let min = Infinity;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    min = Math.min(min, distanceToSegment(pt, a, b));
  }
  return min;
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

export type FixturePlacement = {
  points: Point[];
  spacingFt: number; // grid spacing actually used
};

// Lay fixtures on a uniform grid clipped to the polygon. Searches grid spacing
// so the number of placed fixtures lands as close as possible to `targetCount`,
// while keeping a minimum margin from the walls. Works for any simple polygon
// (rectangle, L-shape, T-shape, freeform).
export function placeFixturesInPolygon(
  polygon: Point[],
  targetCount: number,
  options?: { minWallMarginFt?: number }
): FixturePlacement {
  if (polygon.length < 3 || targetCount < 1) {
    return { points: [], spacingFt: 0 };
  }

  const area = polygonArea(polygon);
  const margin = options?.minWallMarginFt ?? 1.5;
  const baseSpacing = Math.sqrt(area / targetCount) || 1;

  let best: Point[] = [];
  let bestSpacing = baseSpacing;
  let bestDiff = Infinity;

  // Try a range of spacing multipliers to best match the target count.
  for (let m = 0.6; m <= 1.6; m += 0.05) {
    const spacing = baseSpacing * m;
    const pts = gridFill(polygon, spacing, margin);
    const diff = Math.abs(pts.length - targetCount);
    if (diff < bestDiff || (diff === bestDiff && pts.length >= targetCount)) {
      bestDiff = diff;
      best = pts;
      bestSpacing = spacing;
    }
    if (diff === 0) break;
  }

  return { points: best, spacingFt: bestSpacing };
}

function gridFill(polygon: Point[], spacing: number, margin: number): Point[] {
  if (spacing <= 0) return [];
  const bb = boundingBox(polygon);
  const width = bb.maxX - bb.minX;
  const height = bb.maxY - bb.minY;

  const cols = Math.max(1, Math.round(width / spacing));
  const rows = Math.max(1, Math.round(height / spacing));

  const stepX = width / cols;
  const stepY = height / rows;

  const points: Point[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pt = {
        x: bb.minX + stepX * (c + 0.5),
        y: bb.minY + stepY * (r + 0.5),
      };
      if (pointInPolygon(pt, polygon) && distanceToPolygonEdge(pt, polygon) >= margin) {
        points.push(pt);
      }
    }
  }

  // Fallback: if margin filtering removed everything (very small/narrow room),
  // accept interior points without the margin constraint.
  if (points.length === 0) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pt = {
          x: bb.minX + stepX * (c + 0.5),
          y: bb.minY + stepY * (r + 0.5),
        };
        if (pointInPolygon(pt, polygon)) points.push(pt);
      }
    }
  }
  return points;
}

// Named starter shapes for the designer, expressed in feet.
export function rectangleShape(widthFt: number, heightFt: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: widthFt, y: 0 },
    { x: widthFt, y: heightFt },
    { x: 0, y: heightFt },
  ];
}

export function lShape(widthFt: number, heightFt: number): Point[] {
  const w = widthFt;
  const h = heightFt;
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h * 0.5 },
    { x: w * 0.5, y: h * 0.5 },
    { x: w * 0.5, y: h },
    { x: 0, y: h },
  ];
}

export function tShape(widthFt: number, heightFt: number): Point[] {
  const w = widthFt;
  const h = heightFt;
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h * 0.4 },
    { x: w * 0.7, y: h * 0.4 },
    { x: w * 0.7, y: h },
    { x: w * 0.3, y: h },
    { x: w * 0.3, y: h * 0.4 },
    { x: 0, y: h * 0.4 },
  ];
}

import { CalculationResult } from '@/types';
import { Market } from '@/config/markets';
import { fixtureRange, roomCostRange } from '@/lib/pricing';
import { getLightingLayers } from '@/lib/lightingZones';
import { getSpecGuidance, getPenlabsProducts } from '@/lib/productRecommendations';
import { estimateCost, costInputsFromMarket } from '@/lib/costEstimator';
import { resolveFixtureOrGhost, fixturePrice } from '@/lib/fixtureCatalog';
import { Project } from '@/types/project';
import type { LightingReportData } from './lightingReport';
import type { ProjectReportData, ProjectReportLine } from './projectReport';

// Assemble everything the branded PDF needs from a result + room + market.
// Shared by the PDF export button and the quote-request email so they match.
export function gatherLightingReportData(args: {
  result: CalculationResult;
  roomType: string;
  roomName: string;
  market: Market;
  polygon?: { x: number; y: number }[];
  fixtures?: { x: number; y: number }[];
  beamRadiusFt?: number;
  logoSrc?: string;
}): LightingReportData {
  const ceilingFt = args.result.ceilingHeightFt ?? 8;
  return {
    roomName: args.roomName,
    date: new Date().toLocaleDateString(),
    logoSrc: args.logoSrc,
    result: args.result,
    market: args.market,
    layers: getLightingLayers(args.roomType, args.result.totalLumensNeeded),
    spec: getSpecGuidance(args.roomType, ceilingFt),
    products: getPenlabsProducts(args.roomType, ceilingFt),
    cost: estimateCost(args.result, costInputsFromMarket(args.market), args.market.code),
    fixtureRange: fixtureRange(
      args.result.fixtureItems ?? args.result.numberOfFixtures,
      args.market.code,
      args.market
    ),
    polygon: args.polygon,
    fixtures: args.fixtures,
    beamRadiusFt: args.beamRadiusFt,
  };
}

// Assemble the full project PDF data from a project + market. Costs are computed
// live in the active currency (not the stored amounts), fixtures are resolved
// from the live catalogue, and a combined bill of materials is aggregated.
export function gatherProjectReportData(args: {
  project: Project;
  market: Market;
  logoSrc?: string;
}): ProjectReportData {
  const { project, market } = args;
  const code = market.code;

  const priceLine = (id: string, qty: number): ProjectReportLine => {
    const f = resolveFixtureOrGhost(id);
    const unit = fixturePrice(f, code);
    return { name: f.name, qty, unitPrice: unit, subtotal: unit * qty };
  };

  let costLow = 0;
  let costHigh = 0;
  let totalFixtures = 0;
  let totalLumens = 0;
  const bomQty = new Map<string, number>();

  const rooms = project.rooms.map((r) => {
    const range = roomCostRange(r.fixtureItems, r.numberOfFixtures, code, market);
    costLow += range.low;
    costHigh += range.high;
    totalFixtures += r.numberOfFixtures;
    totalLumens += r.totalLumens;
    for (const it of r.fixtureItems ?? []) {
      bomQty.set(it.id, (bomQty.get(it.id) ?? 0) + it.quantity);
    }
    return {
      name: r.name,
      areaDisplay: r.areaDisplay,
      areaUnit: r.areaUnit,
      totalLumens: r.totalLumens,
      numberOfFixtures: r.numberOfFixtures,
      fixtureSize: r.fixtureSize,
      density: r.areaDisplay > 0 ? Math.round(r.totalLumens / r.areaDisplay) : 0,
      costLow: range.low,
      costHigh: range.high,
      items: (r.fixtureItems ?? []).map((it) => priceLine(it.id, it.quantity)),
    };
  });

  const bom = Array.from(bomQty, ([id, qty]) => priceLine(id, qty)).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const labour = totalFixtures * market.installCostPerFixture;

  return {
    projectName: project.name,
    client: project.client,
    date: new Date().toLocaleDateString(),
    market,
    rooms,
    totals: {
      roomCount: project.rooms.length,
      totalFixtures,
      totalLumens,
      costLow,
      costHigh,
    },
    installedLow: costLow + labour,
    installedHigh: costHigh + labour,
    bom,
    logoSrc: args.logoSrc,
  };
}

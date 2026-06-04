import { CalculationResult } from '@/types';
import { Market, fixtureCostRange } from '@/config/markets';
import { getLightingLayers } from '@/lib/lightingZones';
import { getSpecGuidance, getPenlabsProducts } from '@/lib/productRecommendations';
import { estimateCost, costInputsFromMarket } from '@/lib/costEstimator';
import type { LightingReportData } from './lightingReport';

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
}): LightingReportData {
  const ceilingFt = args.result.ceilingHeightFt ?? 8;
  return {
    roomName: args.roomName,
    date: new Date().toLocaleDateString(),
    result: args.result,
    market: args.market,
    layers: getLightingLayers(args.roomType, args.result.totalLumensNeeded),
    spec: getSpecGuidance(args.roomType, ceilingFt),
    products: getPenlabsProducts(args.roomType, ceilingFt),
    cost: estimateCost(args.result, costInputsFromMarket(args.market)),
    fixtureRange: fixtureCostRange(args.result.numberOfFixtures, args.market),
    polygon: args.polygon,
    fixtures: args.fixtures,
    beamRadiusFt: args.beamRadiusFt,
  };
}

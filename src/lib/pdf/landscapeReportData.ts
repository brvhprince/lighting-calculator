import { Market } from '@/config/markets';
import { Point } from '@/lib/geometry';
import { LandscapeResult } from '@/lib/landscape/engine';
import {
  PlacedFeature,
  CableGauge,
  drawKind,
  planAnchors,
  cableChain,
  voltageDrop,
} from '@/lib/landscape/siteplan';
import type { LandscapeReportData, LandscapePlanData } from './landscapeReport';

const SYSTEM_LABELS: Record<LandscapeResult['system'], string> = {
  lowvoltage: 'Low-voltage 12V',
  linevoltage: 'Line-voltage (mains)',
  solar: 'Solar',
};

// Bundle the computed landscape result with brand/market context for the PDF.
// When `plan` geometry is supplied (from the site-plan designer), precompute the
// drawable shapes, cable chain and voltage drop so the PDF stays presentational.
export function gatherLandscapeReportData(args: {
  result: LandscapeResult;
  market: Market;
  logoSrc?: string;
  plan?: {
    widthFt: number;
    depthFt: number;
    placed: PlacedFeature[];
    transformer?: Point | null;
    gauge?: CableGauge;
  };
}): LandscapeReportData {
  let plan: LandscapePlanData | undefined;
  if (args.plan && args.plan.placed.length) {
    const { widthFt, depthFt, placed, transformer, gauge } = args.plan;
    const shapes = placed.map((p) => ({ kind: drawKind(p.technique), points: p.points }));
    const anchors = planAnchors(placed, args.result);
    const chain =
      args.result.system === 'lowvoltage' && transformer ? cableChain(transformer, anchors) : [];
    const vd = chain.length > 1 ? voltageDrop(chain, gauge ?? 12) : null;
    plan = {
      widthFt,
      depthFt,
      shapes,
      transformer: transformer ?? null,
      anchors: anchors.map((a) => ({ x: a.x, y: a.y })),
      cable: chain.map((c) => ({ x: c.x, y: c.y })),
      vd: vd ? { gauge: vd.gauge, worstDropPct: vd.worstDropPct, minVoltage: vd.minVoltage, ok: vd.ok } : null,
    };
  }

  return {
    date: new Date().toLocaleDateString(),
    market: args.market,
    systemLabel: SYSTEM_LABELS[args.result.system],
    result: args.result,
    logoSrc: args.logoSrc,
    plan,
  };
}

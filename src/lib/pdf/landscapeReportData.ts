import { Market } from '@/config/markets';
import { LandscapeResult } from '@/lib/landscape/engine';
import type { LandscapeReportData } from './landscapeReport';

const SYSTEM_LABELS: Record<LandscapeResult['system'], string> = {
  lowvoltage: 'Low-voltage 12V',
  linevoltage: 'Line-voltage (mains)',
  solar: 'Solar',
};

// Bundle the computed landscape result with brand/market context for the PDF.
export function gatherLandscapeReportData(args: {
  result: LandscapeResult;
  market: Market;
  logoSrc?: string;
}): LandscapeReportData {
  return {
    date: new Date().toLocaleDateString(),
    market: args.market,
    systemLabel: SYSTEM_LABELS[args.result.system],
    result: args.result,
    logoSrc: args.logoSrc,
  };
}

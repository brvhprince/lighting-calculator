// Lumen-method verification (IESNA). Back-calculates the maintained illuminance
// a layout actually delivers to the work plane, accounting for the coefficient
// of utilisation (CU) and light-loss factor (LLF). CU here is ESTIMATED from the
// room cavity ratio — real CU comes from a fixture's photometric file.

const SQFT_TO_SQM = 0.092903;
const LUX_PER_FC = 10.7639;
const WORK_PLANE_FT = 2.5; // typical desk/counter height
const LLF = 0.8; // light-loss factor (dirt, lumen depreciation) — typical maintained

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export type IlluminanceResult = {
  installedLumens: number;
  cu: number;
  llf: number;
  rcr: number;
  deliveredLux: number;
  deliveredFc: number;
  targetLux: number;
  targetFc: number;
  ratio: number; // delivered / target
  verdict: 'on-target' | 'below' | 'above';
  suggestedFixtures: number; // to meet the target by the lumen method
};

export function verifyIlluminance(args: {
  numberOfFixtures: number;
  lumensPerFixture: number;
  areaSqFt: number;
  ceilingHeightFt: number;
  targetLux: number;
  perimeterFt?: number; // optional; estimated from area (square) when absent
}): IlluminanceResult {
  const installedLumens = args.numberOfFixtures * args.lumensPerFixture;
  const areaSqM = args.areaSqFt * SQFT_TO_SQM;

  // Room cavity ratio: RCR = 2.5 · h_rc · perimeter / area  (h_rc = ceiling cavity
  // above the work plane). Perimeter falls back to a square assumption.
  const hrcFt = Math.max(0.5, args.ceilingHeightFt - WORK_PLANE_FT);
  const perimeterFt = args.perimeterFt && args.perimeterFt > 0 ? args.perimeterFt : 4 * Math.sqrt(args.areaSqFt);
  const rcr = clamp((2.5 * hrcFt * perimeterFt) / Math.max(1, args.areaSqFt), 0, 12);

  // Estimated CU: high in big, low-cavity rooms; lower as RCR grows.
  const cu = clamp(0.82 - 0.05 * rcr, 0.35, 0.82);

  const deliveredLux = areaSqM > 0 ? (installedLumens * cu * LLF) / areaSqM : 0;
  const deliveredFc = deliveredLux / LUX_PER_FC;
  const targetLux = args.targetLux;
  const targetFc = targetLux / LUX_PER_FC;
  const ratio = targetLux > 0 ? deliveredLux / targetLux : 0;

  const verdict: IlluminanceResult['verdict'] =
    ratio >= 0.9 && ratio <= 1.25 ? 'on-target' : ratio < 0.9 ? 'below' : 'above';

  const suggestedFixtures =
    args.lumensPerFixture > 0
      ? Math.ceil((targetLux * areaSqM) / (args.lumensPerFixture * cu * LLF))
      : args.numberOfFixtures;

  return {
    installedLumens,
    cu: Math.round(cu * 100) / 100,
    llf: LLF,
    rcr: Math.round(rcr * 10) / 10,
    deliveredLux: Math.round(deliveredLux),
    deliveredFc: Math.round(deliveredFc * 10) / 10,
    targetLux: Math.round(targetLux),
    targetFc: Math.round(targetFc * 10) / 10,
    ratio: Math.round(ratio * 100) / 100,
    verdict,
    suggestedFixtures,
  };
}

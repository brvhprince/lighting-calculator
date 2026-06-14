import { CalculationInput, RoomConfigValue, SharedInputs } from '@/types';

// 1 lux = 1 lumen/m²; 1 m² = 10.7639 ft². So lumens/ft² = lux / 10.7639.
export const LUX_PER_LUMEN_PER_SQFT = 10.7639;

const FT_TO_M = 0.3048;

// Build the engine's CalculationInput from the shared room inputs. Ceiling/peak
// are stored in feet; the engine expects the active unit (m for metric).
export function buildCalculationInput(s: SharedInputs): CalculationInput {
  const ftToUnit = (ft: number) => (s.unitSystem === 'metric' ? ft * FT_TO_M : ft);
  const c = s.config;
  return {
    length: parseFloat(s.length),
    width: parseFloat(s.width),
    unitSystem: s.unitSystem,
    roomType: c.roomType,
    isExpert: s.isExpert,
    ceilingHeight: c.ceilingFt ? ftToUnit(c.ceilingFt) : undefined,
    slopedCeiling: c.sloped || undefined,
    ceilingPeakHeight: c.sloped && c.ceilingPeakFt ? ftToUnit(c.ceilingPeakFt) : undefined,
    naturalLight: c.naturalLight !== 'none' ? c.naturalLight : undefined,
    customLumensPerSqFt: resolveCustomLumensPerSqFt(c),
    fixtureSize: c.fixtureSize || undefined,
    customFixtureLumens: c.customFixtureLumens ? parseFloat(c.customFixtureLumens) : undefined,
  };
}

export function luxToLumensPerSqFt(lux: number): number {
  return lux / LUX_PER_LUMEN_PER_SQFT;
}

// Resolve the effective lumens/ft² override from a config, honouring precedence:
// target lux → custom room lumens (for "other") → custom lumens/ft² → none (preset).
export function resolveCustomLumensPerSqFt(c: RoomConfigValue): number | undefined {
  if (c.targetLux) {
    const n = parseFloat(c.targetLux);
    if (n > 0) return luxToLumensPerSqFt(n);
  }
  if (c.roomType === 'other' && c.customRoomLumens) {
    const n = parseFloat(c.customRoomLumens);
    if (n > 0) return n;
  }
  if (c.customLumensPerSqFt) {
    const n = parseFloat(c.customLumensPerSqFt);
    if (n > 0) return n;
  }
  return undefined;
}

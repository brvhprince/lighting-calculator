import { RoomConfigValue } from '@/types';

// 1 lux = 1 lumen/m²; 1 m² = 10.7639 ft². So lumens/ft² = lux / 10.7639.
export const LUX_PER_LUMEN_PER_SQFT = 10.7639;

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

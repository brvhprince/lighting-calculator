import { LayerKey } from '@/types';
import { RoomProfile, getRoomProfile } from './roomProfiles';

// Colour-quality class for any room (the 6 profiled rooms override via
// ROOM_PROFILES). Sources: lighting-spec-guidance-residential.md.
const CRITICAL_ROOMS = new Set(['office']);
const UTILITY_ROOMS = new Set([
  'garage',
  'laundry',
  'basement',
  'closet',
  'hallway',
  'stairway',
  'mudRoom',
  'outdoor',
]);

export function resolveColorQuality(roomType: string): RoomProfile['colorQuality'] {
  const profile = getRoomProfile(roomType);
  if (profile) return profile.colorQuality;
  if (CRITICAL_ROOMS.has(roomType)) return 'critical';
  if (UTILITY_ROOMS.has(roomType)) return 'utility';
  return 'warm';
}

// Default per-layer CCT (Kelvin) by colour quality — task runs cooler, ambient
// and accent warmer (§4b/§4d). Profiled rooms override with tuned values.
const CCT_DEFAULTS: Record<RoomProfile['colorQuality'], Record<LayerKey, number>> = {
  warm: { ambient: 2700, task: 3500, accent: 2700 },
  critical: { ambient: 4000, task: 4500, accent: 3000 },
  utility: { ambient: 4000, task: 4000, accent: 4000 },
};

export function resolveLayerCct(roomType: string, layer: LayerKey): number {
  return getRoomProfile(roomType)?.cct[layer] ?? CCT_DEFAULTS[resolveColorQuality(roomType)][layer];
}

// CRI / R9 guidance per layer (brief §4c), sourced from color-temperature-cct-cri.md
// (R9 ≥ 50 minimum, ≥ 90 premium; Ra ≥ 90) and lighting-spec-guidance-residential.md.
export function layerCriNote(layer: LayerKey, quality: RoomProfile['colorQuality']): string {
  if (quality === 'critical') {
    return 'CRI Ra ≥ 90 (prioritise fidelity / high Rf) — colour judgement matters here.';
  }
  if (quality === 'utility') {
    return layer === 'task'
      ? 'CRI Ra ≥ 80 is fine for utility task work.'
      : 'CRI Ra ≥ 80 is adequate for a utility space.';
  }
  // warm residential rooms — skin, timber, warm textiles
  return 'CRI Ra ≥ 90, R9 ≥ 50. Standard white LEDs are weak in deep red (R9), which makes warm materials look muddy — so R9 matters for residential layers.';
}

// The "why do the layers differ in colour?" rationale — the Kruithof relationship
// (brief §4d), flagged as suggestive, not law, per the knowledge base.
export const KRUITHOF_NOTE =
  'Why the layers differ in warmth: at low light levels people tend to prefer warm light; at higher levels cooler light feels more natural (the Kruithof relationship — suggestive, not law). So accent and ambient run warmer and dimmable, while task runs brighter and cooler.';

// Plain-language description of each layer (layman-first, brief §1).
export const LAYER_INFO: Record<
  LayerKey,
  { laymanLabel: string; technical: string; help: string }
> = {
  ambient: {
    laymanLabel: 'Ceiling / general lights',
    technical: 'Ambient',
    help: 'The baseline glow that lets you move around the whole room safely. Carries the largest share of the light budget.',
  },
  task: {
    laymanLabel: 'Work / task lights',
    technical: 'Task',
    help: 'Extra brightness aimed only at work surfaces (a counter, desk or workbench) — not the whole floor, which is why it needs far fewer lumens.',
  },
  accent: {
    laymanLabel: 'Mood / accent lights',
    technical: 'Accent',
    help: 'A small amount of light for atmosphere — wall washes, uplights, LED strips. Roughly 10–30% of the ambient level.',
  },
};

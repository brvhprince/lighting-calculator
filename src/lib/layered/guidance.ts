import { LayerKey } from '@/types';
import { RoomProfile } from './roomProfiles';

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

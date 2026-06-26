import { FixtureCategory, LayerKey } from '@/types';
import { ROOM_TYPES } from '@/lib/roomTypes';

// ROOM_PROFILES, the heart of the layered feature (brief §3).
//
// Sources, kept deliberately traceable per §7:
//  • ambientLux        → ROOM_TYPES[key].targetLux (single source of truth,
//                        already used by the Simple-mode illuminance check).
//  • taskLux           → EN 12464-1 (indoor work places) / IES Lighting Handbook
//                        maintained-illuminance ranges, cited per value. Where a
//                        standard pins a range, the midpoint is used and flagged.
//  • cct / cri / r9    → knowledge base: lighting-spec-guidance-residential.md
//                        (per-zone CCT table) and color-temperature-cct-cri.md
//                        (R9 ≥ 50 min, Ra ≥ 90). task runs cooler, ambient/accent
//                        warmer (§4b/§4d).

export type TaskZone = {
  label: string; // e.g. "Workbench", "Countertop"
  // The task layer lights this zone only, NOT the whole floor (§2). Define it as
  // a fixed work-surface area or a share of the floor, whichever is sensible.
  fixedAreaSqFt?: number;
  areaShareOfFloor?: number; // 0–1, used when no fixed area is given
};

export type LayerProfile = {
  fixtures: FixtureCategory[]; // candidate fixture types, best-first (auto picks [0])
  optional?: boolean;
  taskZone?: TaskZone; // task layer only
  accentAreaShareOfFloor?: number; // accent layer only, small wash area
};

export type RoomProfile = {
  ambientLux: number; // baseline general illuminance over the whole floor
  taskLux: number; // local target on the task zone (absolute, on the work plane)
  accentFractionOfAmbient: number; // accent level as a fraction of ambient (§2: ~0.1–0.3)
  // Recommended correlated colour temperature per layer, in Kelvin (§4b).
  cct: Record<LayerKey, number>;
  // Colour-rendering requirement for this room (§4c). "warm" rooms (skin/timber)
  // need strong deep-red rendering; "critical" rooms prioritise fidelity.
  colorQuality: 'warm' | 'critical' | 'utility';
  layers: Record<LayerKey, LayerProfile>;
};

export const ROOM_PROFILES: Record<string, RoomProfile> = {
  kitchen: {
    ambientLux: ROOM_TYPES.kitchen.targetLux ?? 300, // 300 lx general (IES residential kitchen)
    taskLux: 500, // EN 12464-1 / IES, food prep at the counter
    accentFractionOfAmbient: 0.2,
    cct: { ambient: 3000, task: 4000, accent: 2700 }, // kitchen/task 3000–4000 K (spec note)
    colorQuality: 'warm',
    layers: {
      ambient: { fixtures: ['recessed', 'linear'] },
      task: { fixtures: ['linear', 'track'], taskZone: { label: 'Countertops', areaShareOfFloor: 0.25 } },
      accent: { fixtures: ['strip'], optional: true, accentAreaShareOfFloor: 0.1 },
    },
  },
  bedroom: {
    ambientLux: ROOM_TYPES.bedroom.targetLux ?? 100, // 100 lx general (IES bedroom)
    taskLux: 300, // EN 12464-1, reading/dressing zone
    accentFractionOfAmbient: 0.15,
    cct: { ambient: 2700, task: 3000, accent: 2700 }, // living/bedroom 2700 K (spec note)
    colorQuality: 'warm',
    layers: {
      ambient: { fixtures: ['recessed', 'pendant'] },
      task: { fixtures: ['sconce', 'track'], taskZone: { label: 'Bedside / dressing', fixedAreaSqFt: 20 } },
      accent: { fixtures: ['strip'], optional: true, accentAreaShareOfFloor: 0.08 },
    },
  },
  livingRoom: {
    ambientLux: ROOM_TYPES.livingRoom.targetLux ?? 100, // 100 lx general (IES living room)
    taskLux: 300, // EN 12464-1, reading nook
    accentFractionOfAmbient: 0.25,
    cct: { ambient: 2700, task: 3000, accent: 2700 }, // living/dining 2700 K (spec note)
    colorQuality: 'warm',
    layers: {
      ambient: { fixtures: ['recessed', 'pendant'] },
      task: { fixtures: ['track', 'sconce'], taskZone: { label: 'Reading nook', fixedAreaSqFt: 24 } },
      accent: { fixtures: ['strip', 'sconce'], optional: true, accentAreaShareOfFloor: 0.12 },
    },
  },
  bathroom: {
    ambientLux: ROOM_TYPES.bathroom.targetLux ?? 300, // 300 lx general (IES bathroom)
    taskLux: 500, // EN 12464-1, mirror/grooming (the spec note: "mirrors are skin-rendering machines")
    accentFractionOfAmbient: 0.15,
    cct: { ambient: 3000, task: 3000, accent: 2700 }, // bathroom 2700–3000 K, high R9 (spec note)
    colorQuality: 'warm',
    layers: {
      ambient: { fixtures: ['recessed'] },
      task: { fixtures: ['sconce', 'linear'], taskZone: { label: 'Mirror / vanity', fixedAreaSqFt: 16 } },
      accent: { fixtures: ['strip'], optional: true, accentAreaShareOfFloor: 0.06 },
    },
  },
  office: {
    ambientLux: ROOM_TYPES.office.targetLux ?? 400, // 400 lx general (IES home office)
    taskLux: 500, // EN 12464-1, desk / writing & reading (raise to 750 for fine detail)
    accentFractionOfAmbient: 0.15,
    cct: { ambient: 4000, task: 4500, accent: 3000 }, // office/colour-critical 4000–5000 K (spec note)
    colorQuality: 'critical',
    layers: {
      ambient: { fixtures: ['recessed', 'linear'] },
      task: { fixtures: ['linear', 'track'], taskZone: { label: 'Desk', fixedAreaSqFt: 24 } },
      accent: { fixtures: ['strip'], optional: true, accentAreaShareOfFloor: 0.08 },
    },
  },
  garage: {
    ambientLux: ROOM_TYPES.garage.targetLux ?? 200, // 200 lx general (IES garage/workshop ambient)
    taskLux: 500, // EN 12464-1, workbench (raise toward 750 for fine bench work)
    accentFractionOfAmbient: 0.1,
    cct: { ambient: 4000, task: 4000, accent: 4000 }, // workshop neutral/cool fine (spec note)
    colorQuality: 'utility',
    layers: {
      ambient: { fixtures: ['linear', 'recessed'] },
      task: { fixtures: ['linear', 'track'], taskZone: { label: 'Workbench', fixedAreaSqFt: 24 } },
      accent: { fixtures: ['strip'], optional: true, accentAreaShareOfFloor: 0.05 },
    },
  },
};

export const getRoomProfile = (key: string): RoomProfile | undefined => ROOM_PROFILES[key];

export const hasRoomProfile = (key: string): boolean => key in ROOM_PROFILES;

import { FixtureCategory, LayerKey, UnitSystem } from '@/types';
import { FIXTURE_SIZES } from '@/lib/fixtureTypes';
import { requiredLumensForLux, WORK_PLANE_FT } from '@/lib/illuminance';
import { RoomProfile } from './roomProfiles';
import { layerCriNote } from './guidance';

const SQ_FT_TO_SQ_M = 0.092903;

// Task fixtures sit just above the work surface, so almost no light is lost to
// the ceiling cavity — they are far more lumen-efficient than ambient (§4a,
// inverse-square law). We model this by computing task utilisation at a short
// mounting height above the work plane rather than at the ceiling.
const TASK_FIXTURE_MOUNTING_FT = WORK_PLANE_FT + 1.5;

// One representative fixture per category, drawn from the existing FIXTURE_SIZES
// catalogue (no new fixture data invented — §7). Used for per-fixture lumens and
// the quantity = layer lumens / per-fixture lumens calculation.
const REPRESENTATIVE_FIXTURE: Record<FixtureCategory, string> = {
  recessed: '6inch', // common residential downlight (900 lm)
  linear: 'linear4ft',
  pendant: 'pendantLarge',
  track: 'trackHead',
  sconce: 'sconce',
  strip: 'strip5m',
};

function fixtureForCategory(category: FixtureCategory) {
  const fixture = FIXTURE_SIZES[REPRESENTATIVE_FIXTURE[category]];
  return { category, name: fixture.name, lumens: fixture.typicalLumens.recommended };
}

export type LayerResult = {
  layer: LayerKey;
  fixtureCategory: FixtureCategory;
  fixtureName: string;
  quantity: number;
  lumensPerFixture: number;
  layerLumens: number; // total lumens this layer installs
  targetLux: number; // the illuminance this layer is sized for
  areaSqFt: number; // the area this layer lights (full floor for ambient, zone for task/accent)
  zoneLabel?: string;
  cct: number;
  criNote: string;
};

export type LayeredResult = {
  roomLayers: LayerResult[];
  totalLumens: number; // sum across layers
  areaSqFt: number;
  // Open-plan caution (§4b): if task and ambient differ by more than this, the
  // zones may read as jarring side by side.
  cctSpreadWarning?: string;
};

export type LayerSelection = {
  layers: LayerKey[]; // which layers the user included
  fixtureOverride?: Partial<Record<LayerKey, FixtureCategory>>; // optional per-layer fixture choice
};

// Distribute the room's light budget across the selected layers (§2). Each layer
// is sized for its OWN share of the room's illuminance over its OWN area, so the
// result is correctly lit rather than 3× over-lit.
export function distributeLayers(args: {
  profile: RoomProfile;
  areaSqFt: number;
  ceilingHeightFt: number;
  selection: LayerSelection;
}): LayeredResult {
  const { profile, areaSqFt, ceilingHeightFt, selection } = args;
  const roomLayers: LayerResult[] = [];

  const pickFixture = (layer: LayerKey): FixtureCategory =>
    selection.fixtureOverride?.[layer] ?? profile.layers[layer].fixtures[0];

  // ---- Ambient: baseline general illumination over the FULL floor area. ----
  if (selection.layers.includes('ambient')) {
    const category = pickFixture('ambient');
    const fixture = fixtureForCategory(category);
    const lumens = requiredLumensForLux({
      targetLux: profile.ambientLux,
      areaSqFt,
      ceilingHeightFt, // full mounting height → high ceilings need more (§4a)
    });
    const quantity = Math.max(1, Math.ceil(lumens / fixture.lumens));
    roomLayers.push({
      layer: 'ambient',
      fixtureCategory: category,
      fixtureName: fixture.name,
      quantity,
      lumensPerFixture: fixture.lumens,
      layerLumens: quantity * fixture.lumens,
      targetLux: profile.ambientLux,
      areaSqFt,
      cct: profile.cct.ambient,
      criNote: layerCriNote('ambient', profile.colorQuality),
    });
  }

  // ---- Task: only the ADDITIONAL boost over the task zone, not the room. ----
  // Ambient already provides the baseline everywhere, so task supplies the delta
  // (taskLux − ambientLux) over the task zone area (§2). If task is selected
  // without ambient, it carries the full taskLux itself.
  if (selection.layers.includes('task')) {
    const zone = profile.layers.task.taskZone;
    const zoneArea = zone?.fixedAreaSqFt ?? (zone?.areaShareOfFloor ?? 0.25) * areaSqFt;
    const hasAmbient = selection.layers.includes('ambient');
    const taskTargetLux = hasAmbient
      ? Math.max(0, profile.taskLux - profile.ambientLux)
      : profile.taskLux;
    const category = pickFixture('task');
    const fixture = fixtureForCategory(category);
    const lumens = requiredLumensForLux({
      targetLux: taskTargetLux,
      areaSqFt: zoneArea,
      ceilingHeightFt: TASK_FIXTURE_MOUNTING_FT, // close-mounted → efficient (§4a)
    });
    const quantity = Math.max(1, Math.ceil(lumens / fixture.lumens));
    roomLayers.push({
      layer: 'task',
      fixtureCategory: category,
      fixtureName: fixture.name,
      quantity,
      lumensPerFixture: fixture.lumens,
      layerLumens: quantity * fixture.lumens,
      targetLux: profile.taskLux,
      areaSqFt: zoneArea,
      zoneLabel: zone?.label,
      cct: profile.cct.task,
      criNote: layerCriNote('task', profile.colorQuality),
    });
  }

  // ---- Accent: a small fraction of ambient over a small wash area. ----
  if (selection.layers.includes('accent')) {
    const accentArea = (profile.layers.accent.accentAreaShareOfFloor ?? 0.1) * areaSqFt;
    const accentLux = profile.ambientLux * profile.accentFractionOfAmbient;
    const category = pickFixture('accent');
    const fixture = fixtureForCategory(category);
    const lumens = requiredLumensForLux({
      targetLux: accentLux,
      areaSqFt: accentArea,
      ceilingHeightFt,
    });
    const quantity = Math.max(1, Math.ceil(lumens / fixture.lumens));
    roomLayers.push({
      layer: 'accent',
      fixtureCategory: category,
      fixtureName: fixture.name,
      quantity,
      lumensPerFixture: fixture.lumens,
      layerLumens: quantity * fixture.lumens,
      targetLux: Math.round(accentLux),
      areaSqFt: accentArea,
      cct: profile.cct.accent,
      criNote: layerCriNote('accent', profile.colorQuality),
    });
  }

  // Open-plan rule (§4b): warn if connected layers jump more than ~1000 K.
  const ambient = roomLayers.find((l) => l.layer === 'ambient');
  const task = roomLayers.find((l) => l.layer === 'task');
  let cctSpreadWarning: string | undefined;
  if (ambient && task && Math.abs(task.cct - ambient.cct) > 1000) {
    cctSpreadWarning = `Task (${task.cct}K) and ambient (${ambient.cct}K) differ by more than 1000K. In an open-plan or visually connected space, consider narrowing the gap so the zones don't read as jarring.`;
  }

  return {
    roomLayers,
    totalLumens: roomLayers.reduce((sum, l) => sum + l.layerLumens, 0),
    areaSqFt,
    cctSpreadWarning,
  };
}

// Convert an area in ft² to the display unit for labels.
export function areaInUnit(areaSqFt: number, unit: UnitSystem): { value: number; label: string } {
  return unit === 'metric'
    ? { value: areaSqFt * SQ_FT_TO_SQ_M, label: 'm²' }
    : { value: areaSqFt, label: 'ft²' };
}

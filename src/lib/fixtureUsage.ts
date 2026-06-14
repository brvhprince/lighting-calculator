import { SavedCalculation } from '@/types/saved-calculations';
import { Project } from '@/types/project';
import { CalculationInput } from '@/types';

// Scan THIS browser's localStorage for references to a fixture id, so the admin
// can be warned before archiving/deleting one that's in use. (Saved calcs and
// projects are client-side, so this is per-browser — the save-time snapshot in
// milestone 5 is the real cross-device safety net.)

const SAVED_KEY = 'pen-lighting-saved-calculations';
const PROJECTS_KEY = 'pen-lighting-projects';

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function savedReferencesFixture(calc: SavedCalculation, id: string): boolean {
  const input = calc.input as CalculationInput;
  if (input?.fixtureSize === id) return true;
  if (calc.advanced) {
    for (const layer of Object.values(calc.advanced.fixtureCounts || {})) {
      if (layer && (layer[id] ?? 0) > 0) return true;
    }
  }
  const result = calc.result as { fixtureItems?: { id: string }[] };
  if (result?.fixtureItems?.some((f) => f.id === id)) return true;
  return false;
}

export type FixtureUsage = { savedCalculations: number; projectRooms: number; total: number };

export function getFixtureUsage(id: string): FixtureUsage {
  const saved = readJson<SavedCalculation[]>(SAVED_KEY) ?? [];
  const projects = readJson<Project[]>(PROJECTS_KEY) ?? [];

  const savedCalculations = saved.filter((c) => savedReferencesFixture(c, id)).length;
  const projectRooms = projects.reduce(
    (n, p) => n + p.rooms.filter((r) => r.fixtureItems?.some((f) => f.id === id)).length,
    0
  );

  return { savedCalculations, projectRooms, total: savedCalculations + projectRooms };
}

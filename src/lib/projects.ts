import { Project, ProjectRoom, ProjectTotals } from '@/types/project';
import { CalculationResult } from '@/types';
import { SavedCalculation } from '@/types/saved-calculations';

const STORAGE_KEY = 'pen-lighting-projects';

export function getProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch (e) {
    console.error('Error loading projects:', e);
    return [];
  }
}

function persist(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Error saving projects:', e);
  }
}

export function createProject(name: string, client?: string): Project {
  const project: Project = {
    id: genId('proj'),
    name: name.trim() || 'Untitled Project',
    client: client?.trim() || undefined,
    createdAt: Date.now(),
    rooms: [],
  };
  persist([project, ...getProjects()]);
  return project;
}

export function updateProject(updated: Project): void {
  persist(getProjects().map((p) => (p.id === updated.id ? updated : p)));
}

export function deleteProject(id: string): void {
  persist(getProjects().filter((p) => p.id !== id));
}

export function addRoomToProject(projectId: string, room: ProjectRoom): void {
  persist(
    getProjects().map((p) =>
      p.id === projectId ? { ...p, rooms: [...p.rooms, room] } : p
    )
  );
}

export function removeRoomFromProject(projectId: string, roomId: string): void {
  persist(
    getProjects().map((p) =>
      p.id === projectId ? { ...p, rooms: p.rooms.filter((r) => r.id !== roomId) } : p
    )
  );
}

export function importProject(project: Project): Project {
  // Re-key on import to avoid collisions.
  const fresh: Project = { ...project, id: genId('proj') };
  persist([fresh, ...getProjects()]);
  return fresh;
}

// Cost range mirrors the Shopping List estimate ($20–50/fixture + $40–100 hardware).
export function roomFromCalculation(calc: SavedCalculation): ProjectRoom | null {
  if (calc.type !== 'full') return null;
  const result = calc.result as CalculationResult;
  const fixtures = result.numberOfFixtures;
  return {
    id: genId('room'),
    name: calc.description?.trim() || calc.name,
    areaDisplay: Number(result.area.toFixed(1)),
    areaUnit: result.areaUnit,
    totalLumens: result.totalLumensNeeded,
    numberOfFixtures: fixtures,
    fixtureSize: result.fixtureSize,
    estCostLow: fixtures * 20 + 40,
    estCostHigh: fixtures * 50 + 100,
    addedAt: Date.now(),
  };
}

export function projectTotals(project: Project): ProjectTotals {
  return project.rooms.reduce<ProjectTotals>(
    (acc, r) => ({
      roomCount: acc.roomCount + 1,
      totalLumens: acc.totalLumens + r.totalLumens,
      totalFixtures: acc.totalFixtures + r.numberOfFixtures,
      costLow: acc.costLow + r.estCostLow,
      costHigh: acc.costHigh + r.estCostHigh,
    }),
    { roomCount: 0, totalLumens: 0, totalFixtures: 0, costLow: 0, costHigh: 0 }
  );
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Layered lighting design: split a room's total light budget into ambient, task
// and accent layers. Good lighting design is layered, not a single bright source.

export type LightLayer = {
  key: 'ambient' | 'task' | 'accent';
  name: string;
  percent: number; // share of total lumens
  lumens: number;
  examples: string;
  control: string;
};

type Mix = { ambient: number; task: number; accent: number };

const MIXES: Record<string, Mix> = {
  kitchen: { ambient: 50, task: 40, accent: 10 },
  bathroom: { ambient: 60, task: 35, accent: 5 },
  office: { ambient: 55, task: 40, accent: 5 },
  livingRoom: { ambient: 60, task: 15, accent: 25 },
  greatRoom: { ambient: 60, task: 15, accent: 25 },
  diningRoom: { ambient: 55, task: 20, accent: 25 },
  bedroom: { ambient: 65, task: 20, accent: 15 },
  garage: { ambient: 70, task: 30, accent: 0 },
  laundry: { ambient: 65, task: 35, accent: 0 },
};

const DEFAULT_MIX: Mix = { ambient: 70, task: 20, accent: 10 };

const EXAMPLES: Record<string, Record<LightLayer['key'], string>> = {
  kitchen: {
    ambient: 'Recessed downlights across the ceiling',
    task: 'Under-cabinet strips and pendants over the island',
    accent: 'In-cabinet or toe-kick lighting',
  },
  bathroom: {
    ambient: 'Central recessed or flush ceiling light',
    task: 'Vertical sconces either side of the mirror',
    accent: 'Niche or cove lighting',
  },
  office: {
    ambient: 'Even recessed grid',
    task: 'Desk lamp / focused downlight over the work surface',
    accent: 'Shelf or art lighting',
  },
  livingRoom: {
    ambient: 'Recessed downlights on a dimmer',
    task: 'Reading floor/table lamps',
    accent: 'Wall washers, cove lighting, picture lights',
  },
};

const GENERIC_EXAMPLES: Record<LightLayer['key'], string> = {
  ambient: 'Evenly spaced recessed or surface downlights',
  task: 'Focused light where activities happen',
  accent: 'Highlights for architecture, art or texture',
};

export function getLightingLayers(roomType: string, totalLumens: number): LightLayer[] {
  const mix = MIXES[roomType] ?? DEFAULT_MIX;
  const ex = EXAMPLES[roomType] ?? GENERIC_EXAMPLES;

  const defs: Omit<LightLayer, 'lumens' | 'examples'>[] = [
    {
      key: 'ambient',
      name: 'Ambient (general)',
      percent: mix.ambient,
      control: 'Primary dimmer zone — set the base brightness for the room.',
    },
    {
      key: 'task',
      name: 'Task',
      percent: mix.task,
      control: 'Separate switch/dimmer so it can run bright independently of mood lighting.',
    },
    {
      key: 'accent',
      name: 'Accent',
      percent: mix.accent,
      control: 'Low-level scene zone, often on a smart scene or timer.',
    },
  ];

  return defs
    .filter((d) => d.percent > 0)
    .map((d) => ({
      ...d,
      lumens: Math.round((totalLumens * d.percent) / 100),
      examples: ex[d.key] ?? GENERIC_EXAMPLES[d.key],
    }));
}

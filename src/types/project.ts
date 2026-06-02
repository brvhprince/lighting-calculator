export type ProjectRoom = {
  id: string;
  name: string;
  areaDisplay: number; // area in the room's own unit
  areaUnit: string; // "ft²" | "m²"
  totalLumens: number;
  numberOfFixtures: number;
  fixtureSize: string;
  estCostLow: number;
  estCostHigh: number;
  addedAt: number;
};

export type Project = {
  id: string;
  name: string;
  client?: string;
  createdAt: number;
  rooms: ProjectRoom[];
};

export type ProjectTotals = {
  roomCount: number;
  totalLumens: number;
  totalFixtures: number;
  costLow: number;
  costHigh: number;
};

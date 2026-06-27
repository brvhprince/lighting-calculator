import { FixtureItem } from './index';

export type ProjectRoom = {
  id: string;
  // The saved-calculation id this room came from, so the picker can hide rooms
  // already added. Absent on legacy rooms saved before this was tracked.
  sourceId?: string;
  name: string;
  areaDisplay: number; // area in the room's own unit
  areaUnit: string; // "ft²" | "m²"
  totalLumens: number;
  numberOfFixtures: number;
  fixtureSize: string;
  // Exact fixture mix (by catalogue id) when known, drives per-fixture costing
  // and survives catalogue edits. Absent for legacy rooms (cost falls back to count).
  fixtureItems?: FixtureItem[];
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
  // Set once published to the cloud (read-only share link at /r/<shareCode>).
  shareCode?: string;
  editKey?: string;
};

export type ProjectTotals = {
  roomCount: number;
  totalLumens: number;
  totalFixtures: number;
  costLow: number;
  costHigh: number;
};

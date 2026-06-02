import { UnitSystem } from '@/types';

// Quick-apply templates for common residential spaces. Dimensions are stored in
// imperial feet (the design source) and converted on apply for metric users.
export type RoomPreset = {
  id: string;
  label: string;
  roomType: string; // key into ROOM_TYPES
  lengthFt: number;
  widthFt: number;
  ceilingFt: number;
  blurb: string;
};

export const ROOM_PRESETS: RoomPreset[] = [
  {
    id: 'kitchen-standard',
    label: 'Standard Kitchen',
    roomType: 'kitchen',
    lengthFt: 12,
    widthFt: 12,
    ceilingFt: 9,
    blurb: '12 × 12 ft · 9 ft ceiling',
  },
  {
    id: 'master-bedroom',
    label: 'Master Bedroom',
    roomType: 'bedroom',
    lengthFt: 14,
    widthFt: 16,
    ceilingFt: 9,
    blurb: '14 × 16 ft · 9 ft ceiling',
  },
  {
    id: 'living-room',
    label: 'Living Room',
    roomType: 'livingRoom',
    lengthFt: 16,
    widthFt: 20,
    ceilingFt: 10,
    blurb: '16 × 20 ft · 10 ft ceiling',
  },
  {
    id: 'bathroom-small',
    label: 'Small Bathroom',
    roomType: 'bathroom',
    lengthFt: 5,
    widthFt: 8,
    ceilingFt: 8,
    blurb: '5 × 8 ft · 8 ft ceiling',
  },
  {
    id: 'home-office',
    label: 'Home Office',
    roomType: 'office',
    lengthFt: 10,
    widthFt: 12,
    ceilingFt: 8,
    blurb: '10 × 12 ft · 8 ft ceiling',
  },
  {
    id: 'garage-2car',
    label: '2-Car Garage',
    roomType: 'garage',
    lengthFt: 20,
    widthFt: 20,
    ceilingFt: 9,
    blurb: '20 × 20 ft · 9 ft ceiling',
  },
  {
    id: 'hallway',
    label: 'Hallway',
    roomType: 'hallway',
    lengthFt: 4,
    widthFt: 16,
    ceilingFt: 8,
    blurb: '4 × 16 ft · 8 ft ceiling',
  },
  {
    id: 'dining-room',
    label: 'Dining Room',
    roomType: 'diningRoom',
    lengthFt: 12,
    widthFt: 14,
    ceilingFt: 9,
    blurb: '12 × 14 ft · 9 ft ceiling',
  },
];

const FT_TO_M = 0.3048;

// Returns dimensions as display strings in the requested unit system.
// Metric is rendered in meters to one decimal (matches the calculator's m/mm input handling).
export function presetDimensions(
  preset: RoomPreset,
  unitSystem: UnitSystem
): { length: string; width: string; ceiling: string } {
  if (unitSystem === 'metric') {
    return {
      length: (preset.lengthFt * FT_TO_M).toFixed(1),
      width: (preset.widthFt * FT_TO_M).toFixed(1),
      ceiling: (preset.ceilingFt * FT_TO_M).toFixed(1),
    };
  }
  return {
    length: String(preset.lengthFt),
    width: String(preset.widthFt),
    ceiling: String(preset.ceilingFt),
  };
}

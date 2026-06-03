import { RoomType } from '@/types';

export const ROOM_TYPES: Record<string, RoomType> = {
  kitchen: {
    name: 'Kitchen',
    lumensPerSqFt: { min: 35, max: 40, recommended: 37.5 },
    description: 'High brightness for food preparation and cooking',
    targetLux: 300
  },
  diningRoom: {
    name: 'Dining Room',
    lumensPerSqFt: { min: 30, max: 40, recommended: 35 },
    description: 'Comfortable lighting for meals and gatherings',
    targetLux: 150
  },
  greatRoom: {
    name: 'Great Room',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Versatile lighting for multi-purpose spaces',
    targetLux: 150
  },
  bedroom: {
    name: 'Bedroom',
    lumensPerSqFt: { min: 10, max: 20, recommended: 15 },
    description: 'Soft, relaxing illumination',
    targetLux: 100
  },
  livingRoom: {
    name: 'Living Room',
    lumensPerSqFt: { min: 10, max: 20, recommended: 15 },
    description: 'Ambient lighting for relaxation',
    targetLux: 100
  },
  bathroom: {
    name: 'Bathroom',
    lumensPerSqFt: { min: 70, max: 80, recommended: 75 },
    description: 'Bright lighting for grooming and tasks',
    targetLux: 300
  },
  laundry: {
    name: 'Laundry/Utility Room',
    lumensPerSqFt: { min: 30, max: 40, recommended: 35 },
    description: 'Clear lighting for detailed tasks',
    targetLux: 200
  },
  mudRoom: {
    name: 'Mud Room',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Functional lighting for entry areas',
    targetLux: 100
  },
  hallway: {
    name: 'Hallway/Corridor',
    lumensPerSqFt: { min: 10, max: 20, recommended: 15 },
    description: 'Safe passage lighting',
    targetLux: 100
  },
  closet: {
    name: 'Closet',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Clear visibility for storage areas',
    targetLux: 200
  },
  garage: {
    name: 'Garage',
    lumensPerSqFt: { min: 30, max: 50, recommended: 40 },
    description: 'Bright task lighting for work areas',
    targetLux: 200
  },
  office: {
    name: 'Home Office',
    lumensPerSqFt: { min: 30, max: 50, recommended: 40 },
    description: 'Focused lighting for productivity',
    targetLux: 400
  },
  basement: {
    name: 'Basement',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'General ambient lighting',
    targetLux: 150
  },
  stairway: {
    name: 'Stairway',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Safety lighting for stairs',
    targetLux: 100
  },
  outdoor: {
    name: 'Outdoor/Patio',
    lumensPerSqFt: { min: 5, max: 15, recommended: 10 },
    description: 'Ambient outdoor lighting',
    targetLux: 50
  }
};

export const getRoomType = (key: string): RoomType | undefined => {
  return ROOM_TYPES[key];
};

export const getRoomTypeKeys = (): string[] => {
  return Object.keys(ROOM_TYPES);
};

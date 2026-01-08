import { RoomType } from '@/types';

export const ROOM_TYPES: Record<string, RoomType> = {
  kitchen: {
    name: 'Kitchen',
    lumensPerSqFt: { min: 35, max: 40, recommended: 37.5 },
    description: 'High brightness for food preparation and cooking'
  },
  diningRoom: {
    name: 'Dining Room',
    lumensPerSqFt: { min: 30, max: 40, recommended: 35 },
    description: 'Comfortable lighting for meals and gatherings'
  },
  greatRoom: {
    name: 'Great Room',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Versatile lighting for multi-purpose spaces'
  },
  bedroom: {
    name: 'Bedroom',
    lumensPerSqFt: { min: 10, max: 20, recommended: 15 },
    description: 'Soft, relaxing illumination'
  },
  livingRoom: {
    name: 'Living Room',
    lumensPerSqFt: { min: 10, max: 20, recommended: 15 },
    description: 'Ambient lighting for relaxation'
  },
  bathroom: {
    name: 'Bathroom',
    lumensPerSqFt: { min: 70, max: 80, recommended: 75 },
    description: 'Bright lighting for grooming and tasks'
  },
  laundry: {
    name: 'Laundry/Utility Room',
    lumensPerSqFt: { min: 30, max: 40, recommended: 35 },
    description: 'Clear lighting for detailed tasks'
  },
  mudRoom: {
    name: 'Mud Room',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Functional lighting for entry areas'
  },
  hallway: {
    name: 'Hallway/Corridor',
    lumensPerSqFt: { min: 10, max: 20, recommended: 15 },
    description: 'Safe passage lighting'
  },
  closet: {
    name: 'Closet',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Clear visibility for storage areas'
  },
  garage: {
    name: 'Garage',
    lumensPerSqFt: { min: 30, max: 50, recommended: 40 },
    description: 'Bright task lighting for work areas'
  },
  office: {
    name: 'Home Office',
    lumensPerSqFt: { min: 30, max: 50, recommended: 40 },
    description: 'Focused lighting for productivity'
  },
  basement: {
    name: 'Basement',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'General ambient lighting'
  },
  stairway: {
    name: 'Stairway',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Safety lighting for stairs'
  },
  outdoor: {
    name: 'Outdoor/Patio',
    lumensPerSqFt: { min: 5, max: 15, recommended: 10 },
    description: 'Ambient outdoor lighting'
  }
};

export const getRoomType = (key: string): RoomType | undefined => {
  return ROOM_TYPES[key];
};

export const getRoomTypeKeys = (): string[] => {
  return Object.keys(ROOM_TYPES);
};

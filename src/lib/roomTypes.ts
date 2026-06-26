import { RoomType } from '@/types';

// lumensPerSqFt is the installed light density (lamp lumens per ft²); targetLux is
// the maintained task illuminance (IES residential guidance, lux = lm/m²). The two
// are related but set independently per room. Re-display as lm/m² for metric users
// by multiplying lumensPerSqFt by 10.7639.
export const ROOM_TYPES: Record<string, RoomType> = {
  // ---- Cooking & eating ----
  kitchen: {
    name: 'Kitchen',
    lumensPerSqFt: { min: 35, max: 40, recommended: 37.5 },
    description: 'High brightness for food preparation and cooking',
    targetLux: 300
  },
  pantry: {
    name: 'Kitchen Pantry',
    lumensPerSqFt: { min: 25, max: 35, recommended: 30 },
    description: 'Bright, even light to read labels and find items',
    targetLux: 200
  },
  diningRoom: {
    name: 'Dining Room',
    lumensPerSqFt: { min: 30, max: 40, recommended: 35 },
    description: 'Comfortable lighting for meals and gatherings',
    targetLux: 150
  },
  // ---- Living & social ----
  greatRoom: {
    name: 'Great Room',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Versatile lighting for multi-purpose spaces',
    targetLux: 150
  },
  livingRoom: {
    name: 'Living Room',
    lumensPerSqFt: { min: 10, max: 20, recommended: 15 },
    description: 'Ambient lighting for relaxation',
    targetLux: 100
  },
  flexRoom: {
    name: 'Flex Room',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Adaptable lighting for a multi-purpose space',
    targetLux: 150
  },
  sunroom: {
    name: 'Sunroom',
    lumensPerSqFt: { min: 15, max: 25, recommended: 20 },
    description: 'Ambient lighting to complement abundant daylight',
    targetLux: 150
  },
  // ---- Sleeping ----
  bedroom: {
    name: 'Bedroom',
    lumensPerSqFt: { min: 10, max: 20, recommended: 15 },
    description: 'Soft, relaxing illumination',
    targetLux: 100
  },
  nursery: {
    name: 'Nursery',
    lumensPerSqFt: { min: 15, max: 25, recommended: 20 },
    description: 'Soft, dimmable light with brighter task for changing',
    targetLux: 150
  },
  bathroom: {
    name: 'Bathroom',
    lumensPerSqFt: { min: 70, max: 80, recommended: 75 },
    description: 'Bright lighting for grooming and tasks',
    targetLux: 300
  },
  // ---- Work & study ----
  office: {
    name: 'Home Office',
    lumensPerSqFt: { min: 30, max: 50, recommended: 40 },
    description: 'Focused lighting for productivity',
    targetLux: 400
  },
  study: {
    name: 'Study Room',
    lumensPerSqFt: { min: 30, max: 45, recommended: 37.5 },
    description: 'Even, glare-free light for reading and focus',
    targetLux: 300
  },
  // ---- Recreation ----
  gamesRoom: {
    name: 'Games / Rec Room',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'General lighting for play, with brighter task over tables',
    targetLux: 200
  },
  homeTheater: {
    name: 'Home Theatre / Media Room',
    lumensPerSqFt: { min: 10, max: 20, recommended: 15 },
    description: 'Low, dimmable ambient light for screen viewing',
    targetLux: 50
  },
  gym: {
    name: 'Fitness / Gym Room',
    lumensPerSqFt: { min: 30, max: 50, recommended: 40 },
    description: 'Bright, even light for workouts and free weights',
    targetLux: 300
  },
  playroom: {
    name: 'Playroom',
    lumensPerSqFt: { min: 25, max: 35, recommended: 30 },
    description: "Cheerful, bright light for children's play",
    targetLux: 200
  },
  craftRoom: {
    name: 'Craft / Hobby Room',
    lumensPerSqFt: { min: 40, max: 60, recommended: 50 },
    description: 'High, colour-accurate light for detailed handwork',
    targetLux: 500
  },
  // ---- Utility & circulation ----
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
  foyer: {
    name: 'Entryway / Foyer',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Welcoming light for the entry and stairs',
    targetLux: 150
  },
  hallway: {
    name: 'Hallway/Corridor',
    lumensPerSqFt: { min: 10, max: 20, recommended: 15 },
    description: 'Safe passage lighting',
    targetLux: 100
  },
  stairway: {
    name: 'Stairway',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Safety lighting for stairs',
    targetLux: 100
  },
  closet: {
    name: 'Closet',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Clear visibility for storage areas',
    targetLux: 200
  },
  storage: {
    name: 'Storage Room',
    lumensPerSqFt: { min: 15, max: 25, recommended: 20 },
    description: 'Clear visibility for stored items and shelving',
    targetLux: 150
  },
  garage: {
    name: 'Garage',
    lumensPerSqFt: { min: 30, max: 50, recommended: 40 },
    description: 'Bright task lighting for work areas',
    targetLux: 200
  },
  basement: {
    name: 'Basement',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'General ambient lighting',
    targetLux: 150
  },
  // ---- Outdoor ----
  balcony: {
    name: 'Balcony',
    lumensPerSqFt: { min: 5, max: 15, recommended: 10 },
    description: 'Ambient outdoor light for a balcony or terrace',
    targetLux: 75
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

# Pen Lighting Calculator

A professional lighting calculator built by Pen Homes to help homeowners and professionals calculate the perfect lighting for any room.

![Pen Lighting](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)

## Features

### 🔢 Complete Lighting Calculator
- **Fixture Calculation**: Determine the exact number of lights needed for your room
- **Spacing Calculations**: Get precise measurements for fixture placement and wall spacing
- **Layout Visualization**: See a visual representation of your fixture layout
- **Professional & Homeowner Modes**: Customizable options for different expertise levels
- **Smart Recommendations**: AI-powered suggestions based on room type and dimensions

### 💡 Lumens Calculator
- **Quick Calculations**: Fast lumens-only estimates
- **Room-Specific Recommendations**: Pre-configured values for 15+ room types
- **Custom Values**: Override recommendations with your own requirements

### 📐 Key Capabilities
- **Metric & Imperial Units**: Support for both measurement systems (mm, m, inches, feet)
- **15+ Room Types**: Pre-configured lighting recommendations including:
  - Kitchen (35-40 lumens/ft²)
  - Bathroom (70-80 lumens/ft²)
  - Living Room (10-20 lumens/ft²)
  - Home Office (30-50 lumens/ft²)
  - And many more...
- **Multiple Fixture Sizes**: Support for 2", 3", 4", 5", 6", and 8" recessed lights
- **Industry Standards**: Based on professional lighting design principles

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lighting-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
lighting-calculator/
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── calculator/          # Full calculator page
│   │   ├── lumens-calculator/   # Lumens-only calculator page
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Homepage
│   │   └── globals.css          # Global styles
│   ├── components/              # React components
│   │   ├── ui/                  # UI primitives (Radix UI)
│   │   ├── FullLightingCalculator.tsx
│   │   └── LumensOnlyCalculator.tsx
│   ├── lib/                     # Utilities and core logic
│   │   ├── calculator.ts        # Calculation engine
│   │   ├── roomTypes.ts         # Room type definitions
│   │   ├── fixtureTypes.ts      # Fixture specifications
│   │   └── utils.ts             # Helper functions
│   └── types/                   # TypeScript type definitions
│       └── index.ts
├── public/                      # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## How It Works

### Calculation Logic

The calculator uses industry-standard formulas to determine lighting requirements:

1. **Area Calculation**: Converts room dimensions to square feet (internal standard)
2. **Lumens per Square Foot**: Uses room-specific recommendations or custom values
3. **Total Lumens**: Calculates total lumens needed (area × lumens/ft²)
4. **Fixture Selection**: Auto-selects or uses specified fixture size
5. **Fixture Count**: Determines number of fixtures (total lumens ÷ lumens per fixture)
6. **Spacing Calculation**: Applies the 2:1 rule (spacing between fixtures is twice the wall spacing)
7. **Layout Generation**: Creates optimal grid layout based on room aspect ratio

### Spacing Guidelines

The calculator follows professional lighting design principles:
- **Wall Spacing**: 1.5-3 feet from walls (default: 2 feet)
- **Fixture Spacing**: Twice the wall spacing
- **Grid Layout**: Optimized based on room dimensions and fixture count

### Room Type Recommendations

| Room Type | Lumens/ft² | Use Case |
|-----------|------------|----------|
| Kitchen | 35-40 | Food preparation, detailed tasks |
| Bathroom | 70-80 | Grooming, high-detail tasks |
| Living Room | 10-20 | Ambient, relaxation |
| Home Office | 30-50 | Productivity, reading |
| Bedroom | 10-20 | Soft, relaxing |
| Garage | 30-50 | Work areas, tasks |

## Usage Examples

### Example 1: Laundry Room (Your Example)
- **Dimensions**: 2439mm × 3658mm (metric)
- **Room Type**: Laundry/Utility Room
- **Mode**: Homeowner (automatic)
- **Result**:
  - Area: 8.92 m²
  - Total Lumens: 3,370
  - Number of Fixtures: 6 (4-inch recessed lights)
  - Spacing: Grid layout with precise measurements

### Example 2: Living Room (Lumens Only)
- **Dimensions**: 150" × 100" (imperial)
- **Room Type**: Living Room
- **Result**: 1,563 total lumens needed

## Customization

### Adding New Room Types

Edit `src/lib/roomTypes.ts`:

```typescript
export const ROOM_TYPES: Record<string, RoomType> = {
  customRoom: {
    name: 'Custom Room',
    lumensPerSqFt: { min: 20, max: 30, recommended: 25 },
    description: 'Your custom description'
  },
  // ...
};
```

### Adding New Fixture Sizes

Edit `src/lib/fixtureTypes.ts`:

```typescript
export const FIXTURE_SIZES: Record<string, FixtureSize> = {
  '10inch': {
    name: '10 inch',
    diameter: 10,
    diameterMm: 254,
    typicalLumens: { min: 1500, max: 3000, recommended: 2000 }
  },
  // ...
};
```

## Future Enhancements

- [ ] Support for angled/sloped ceilings
- [ ] Support for corner/L-shaped rooms
- [ ] Height-based calculations for optimal beam angles
- [ ] PDF report generation
- [ ] Save and share calculations
- [ ] Dark mode support
- [ ] Multiple lighting zones
- [ ] Cost estimation based on fixture selection

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

© 2026 Pen Homes. All rights reserved.

## Support

For questions or support, please contact Pen Homes.

---

**Built with ❤️ by Pen Homes**

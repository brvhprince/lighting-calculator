# Penlabs Lighting Calculator

> _The Architecture of Intelligence._

A professional lighting design suite by **Pen Homes** (Penlabs hardware arm). Engineer light from
the first sketch — exact lumens, fixture counts, spacing, layered zones, cost and energy — to the
Pen Homes standard.

![Version](https://img.shields.io/badge/Version-2.0.0-2C332E.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-A68966.svg)

## Tools

| Route | Tool | What it does |
|-------|------|--------------|
| `/calculator` | **Complete Calculator** | Fixtures, spacing, layered zones, product specs, cost & energy |
| `/designer` | **Room Designer** | Draw rectangular, L-, T- or freeform rooms **to scale** and auto-place fixtures |
| `/project` | **Projects** | Group rooms into a whole-home project with cost rollup + exportable report |
| `/lumens-calculator` | **Lumens Only** | Fast, room-aware total-lumens estimate |

## Features

### Calculation engine
- **Ceiling-height aware** — output scales ~10% per foot above an 8 ft baseline.
- **Sloped / vaulted ceilings** — designs to the average of wall and peak height.
- **Natural-light factor** — daylight from windows/skylights trims artificial output by up to 20%.
- **Metric & imperial** throughout (mm, m, inches, feet).
- **15+ room presets** plus fully custom room types.

### Room Designer (canvas)
- Draw **irregular floor plans** — rectangle, L-shape, T-shape, or click-to-draw freeform.
- **Manually editable dimensions** — type exact corner coordinates, or drag corners on a 1 ft grid.
- **Architectural scale** — Auto-fit or fixed **1:20 / 1:50 / 1:100** drawing scale with a live ratio readout.
- **Point-in-polygon fixture placement** that respects the true shape and wall margins.
- **Live light-coverage heatmap.**

### Planning & output
- **Layered lighting plan** — ambient / task / accent split with dimmer-zone guidance.
- **Product recommendations** — colour temperature, CRI, beam angle, smart (Matter) compatibility, and curated Penlabs fixtures.
- **Cost & energy estimator** — up-front cost, annual running cost, LED-vs-incandescent savings, CO₂ and payback.
- **Shopping list** (print-friendly), **PDF/text report**, **shareable URLs**, **save to browser**, and **JSON project export/import**.
- **Dark mode** and a **PWA manifest**.

## Technology

- **Next.js 15** (App Router, standalone output) · **TypeScript**
- **Tailwind CSS** with the Pen Homes design system (Deep Basalt, Warm Bone/Linen, Bronze, Sage)
- **Radix UI** primitives · **Lucide** icons · **Inter** + **Playfair Display** typography
- HTML Canvas for the room designer (no heavy 3D dependency)

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

### Production build

```bash
npm run build
npm start
```

## Docker (Colima / Docker Desktop)

The app persists everything client-side (browser `localStorage`), so **no database is required**.

```bash
docker compose up --build      # builds the standalone image and serves on :3000
```

The `Dockerfile` uses Next.js standalone output for a small runtime image, running as a non-root user.
`docker-compose.yml` ships with a commented-out Postgres service: uncomment it (and the
`DATABASE_URL` line) only if you later add server-side cloud sync / accounts.

## Project structure

```
src/
├── app/
│   ├── calculator/      designer/      project/      lumens-calculator/
│   ├── layout.tsx  page.tsx  manifest.ts  icon.svg  globals.css
├── components/
│   ├── ui/                         # Radix UI primitives
│   ├── RoomDesigner.tsx            # canvas designer
│   ├── ProjectManager.tsx          # multi-room projects
│   ├── FullLightingCalculator.tsx  LumensOnlyCalculator.tsx
│   ├── CostEnergyEstimator.tsx  LightingZones.tsx  ProductRecommendations.tsx
│   └── ShoppingList.tsx  PDFExport.tsx  SavedCalculations.tsx  Theme*.tsx
├── lib/
│   ├── calculator.ts  geometry.ts  costEstimator.ts  lightingZones.ts
│   ├── productRecommendations.ts  projects.ts  shareUrl.ts
│   └── roomTypes.ts  fixtureTypes.ts  roomPresets.ts  savedCalculations.ts
└── types/
```

## How the math works

1. **Area** — rectangles from L × W; arbitrary shapes via the shoelace formula.
2. **Base lumens** = area × room lumens/ft².
3. **Adjustments** — × ceiling-height factor × natural-light factor.
4. **Fixtures** = total lumens ÷ lumens per fixture (auto-selected or chosen).
5. **Layout** — grid for rectangular rooms; clipped grid (point-in-polygon) for drawn shapes, with a
   spacing search that lands near the target count and keeps fixtures off the walls.

## License

© 2026 Pen Homes. All rights reserved.

---

**Built to the Pen Homes standard — intentional, invisible technology.**

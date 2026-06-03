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
| `/admin` | **Configuration** | Edit prices/currencies (JSON) + view incoming quote requests — passcode-gated |
| `/r/[code]` | **Shared report** | Public, read-only client report for a published project |

### Editing prices & currencies

`src/config/markets.ts` holds the built-in defaults (prices, electricity rates, currency list:
USD / GHS). At runtime those defaults are **overridden by values saved in the database**, edited at
**`/admin`** (passcode-gated). Saved edits are live for everyone and survive deploys.

- **`/admin`** → enter passcode → edit JSON → **Validate & Save** (writes to Postgres via Prisma).
- **Download JSON** for a backup / to update the `markets.ts` defaults.
- `markets.ts` defaults still apply wherever the DB has no override (and as a fallback if the DB is
  unreachable).

#### Required environment variables

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Prisma Postgres (Accelerate) connection string |
| `AUTH_SECRET` | Signs the short-lived admin session token |
| `ADMIN_PASSCODE` | Passcode for `/admin` (defaults to `penlabs` if unset) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata/OG/sitemap (defaults to `https://lighting.pen.homes`) |
| `RESEND_API_KEY` | Resend key for quote emails (optional — email is skipped if unset) |
| `LEAD_FROM_EMAIL` | Verified sender (defaults to `Pen Homes <hello@pen.homes>`) |
| `LEAD_REPLY_TO` | Reply-to for customer auto-replies (defaults to `hello@pen.homes`) |
| `LEAD_NOTIFY_EMAIL` | Internal recipient for new-lead notifications (optional) |
| `LEAD_CONSULT_URL` | Booking link (e.g. Cal.com) — adds a "Book a consultation" email CTA when set |
| `NEXT_PUBLIC_PENCASA_URL` | Pencasa store URL — shows a "Shop at Pencasa" CTA (app + email) when set |

> **Resend setup:** verify the **`pen.homes`** domain in Resend (add the SPF/DKIM/DMARC records) so
> emails send from `hello@pen.homes`.
>
> **Click tracking:** `links.pen.homes` (CNAME → `links1.resend-dns.com`) is Resend's tracking domain.
> Enable **click & open tracking** for the sending domain in the Resend dashboard and Resend rewrites
> email links through it automatically. The email CTAs are UTM-tagged so your web analytics also
> attributes the landings.

#### Database setup (one-time)

`prisma.config.ts` loads `.env.local`, so the CLI picks up `DATABASE_URL` automatically:

```bash
npm run db:push   # create / update tables: Setting, Lead, SharedProject
npm run db:seed   # seed market config from src/config/markets.ts (optional)
```

Re-run `npm run db:push` whenever the Prisma schema changes. Tables: **Setting** (pricing
config), **Lead** (quote requests), **SharedProject** (published project reports).

Stack: **Prisma 7** with the `prisma-client` generator (output `src/generated/prisma`, git-ignored,
regenerated on each build) and Prisma Postgres via **Accelerate** — the connection is passed to the
client as `accelerateUrl` (see `src/lib/prisma.ts`). On Vercel, `prisma generate` runs automatically
during the build; set the env vars in Project → Settings → Environment Variables.

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
- **Prisma 7** + **Prisma Postgres** (Accelerate) — persists the saved pricing/market config

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

## Self-hosting with Docker (Colima / Docker Desktop)

Production runs on **Vercel** with **Prisma Postgres**. The Docker setup is for self-hosting (e.g. on
a VPS); the calculators and designer work fully client-side, and only the saved pricing config needs
the database.

```bash
docker compose up --build      # builds the standalone image, serves on :3000
```

Provide the runtime environment variables (compose reads them from your shell or a root `.env`):

| Var | Notes |
|-----|-------|
| `DATABASE_URL` | Prisma Postgres (Accelerate) URL. Omit it to run on the `markets.ts` defaults (admin saves are then disabled). |
| `AUTH_SECRET` | Signs the admin session token. |
| `ADMIN_PASSCODE` | `/admin` passcode (defaults to `penlabs`). |

The `Dockerfile` uses Next.js standalone output for a small image and runs as a non-root user. The app
**degrades gracefully** if the database is unreachable — everything except saving/loading the pricing
config keeps working, with prices falling back to the `markets.ts` defaults.

> The client connects through Accelerate (`accelerateUrl`). To point at a **self-managed** Postgres
> instead of Prisma Postgres, switch `src/lib/prisma.ts` to a driver adapter (`@prisma/adapter-pg`)
> with a direct `postgres://` URL.

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


## research

┌──────────────────────────────┬──────────────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────┐
│              Data              │                                International                                 │                                Ghana                                 │
├────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ Fixture / hardware prices      │ Home Depot, Lowe's, Amazon; Signify/Philips, Cree, Lithonia, Halo spec+price │ Melcom, CompuGhana, Jumia GH, SuperPrice, local electrical importers │
├────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ Electricity tariff (per kWh)   │ US EIA (eia.gov) residential averages                                        │ PURC (purc.com.gh) & ECG published residential tariffs               │
├────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ Lumens / illuminance standards │ IES (Lighting Handbook, ANSI/IES recommended lux per room), Energy Star      │ same (IES is global)                                                 │
├────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ CRI / colour temp / beam angle │ IES + manufacturer spec sheets; Energy Star LED criteria                     │ same                                                                 │
├────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ Smart compatibility            │ CSA-IoT (Matter), Apple Home / Google Home / Alexa docs                      │ same                                                                 │
├────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ CO₂ per kWh                    │ EPA eGRID (US), IEA                                                          │ Ghana Energy Commission grid emission factor                         │
├────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ LED efficacy (lm/W)            │ US DOE / Energy Star LED specs                                               │ same                                                                 │
└────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────┘

Tip: IES tables are in lux (lm/m²). Convert with lumens = lux × area_m² — handy if you want to cross-check the per-ft² values already in roomTypes.ts.

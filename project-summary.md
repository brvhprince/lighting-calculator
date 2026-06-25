# Penlabs Lighting Calculator — Project Summary

A production-grade, full-stack lighting design suite built for **Pen Homes** (a Ghana-based
design-build firm) and its hardware arm **Penlabs**. It turns a room's dimensions into a
correct, costed, layered lighting plan — and into a sales lead.

**Stack:** Next.js 15 (App Router) · React 18 · TypeScript · Tailwind · Radix UI ·
Prisma 7 + Postgres (Accelerate) · @react-pdf/renderer · Resend · self-hosted Umami ·
deployed on Vercel at `lighting.pen.homes`.

---

## 1. For your CV / résumé

**Senior / Full-Stack Engineer — Penlabs Lighting Calculator (Pen Homes)**

- Designed and shipped a full-stack lighting-design web app (Next.js 15, TypeScript,
  Prisma 7/Postgres) that converts room geometry into IES-compliant lighting plans,
  costed bills of materials, and qualified sales leads.
- Built a **lumen-method calculation engine** with a delivered-illuminance check
  (back-calculates actual lux/fc vs. IES targets per room type) so plans are provably
  correct, not just plausible.
- Implemented **layered lighting (Advanced mode)** — ambient / task / accent zones mapped
  to real fixture families (recessed, pendant, track, linear, sconce, strip) — that
  recommends fixture counts and per-fixture lumens from room size, while keeping a
  one-click Simple mode.
- Created an **interactive canvas Room Designer** for arbitrary floor-plan polygons with
  automatic fixture placement and beam-coverage visualisation.
- Engineered a **currency- and market-aware cost engine** (Ghana GHS + International USD)
  driving cost, energy and ROI estimates from a single source of truth, with a
  DB-backed, passcode-protected `/admin` editor (HMAC tokens) for live price/tariff overrides.
- Built a **branded PDF report generator** (@react-pdf/renderer) rendering the real drawn
  polygon via SVG, plus shopping lists and product recommendations with CCT/Kelvin previews.
- Shipped an end-to-end **lead-capture funnel**: quote requests persisted to Postgres,
  transactional auto-reply emails with the PDF attached (Resend), internal notifications,
  rate-limited public APIs, and cloud-published shareable read-only project reports.
- Added a **persistent fixture catalogue** with admin CRUD, snapshotting and
  deletion-integrity (ghost resolver + remap) so historical calculations never break.
- Instrumented the product with **cookieless analytics** (self-hosted Umami) tracking the
  full funnel (calculate → designer → PDF → quote), and built it offline-capable (PWA
  service worker) for site visits on patchy connections.

*Tech: Next.js 15, React 18, TypeScript, Tailwind CSS, Radix UI, Prisma 7, PostgreSQL
(Prisma Accelerate), @react-pdf/renderer, Resend, Umami, Vercel.*

---

## 2. For LinkedIn

> 💡 **From room dimensions to a complete, costed lighting plan — in one tool.**
>
> Over the last few weeks I've been building the **Penlabs Lighting Calculator**, the
> in-house design tool for Pen Homes — and it grew into a genuinely full-stack product.
>
> You type in a room (or *draw* its actual floor plan on a canvas), and it gives you:
>
> 🔦 **Layered lighting** — ambient, task and accent zones mapped to real fixtures
> (recessed, pendants, track, sconces, strip), with exact counts and lumens per fixture.
> 📐 **A provably-correct plan** — it back-calculates the delivered lux against IES targets,
> so it's engineering, not guesswork.
> 💰 **Real costs** — material, install and energy estimates, ROI, and a shopping list,
> currency-aware for both 🇬🇭 Ghana (GHS) and international (USD) markets.
> 📄 **A branded PDF report** rendering your actual drawn layout.
> 📨 **A lead funnel** — request a quote, get an instant auto-reply with your PDF attached.
>
> Under the hood: **Next.js 15 + TypeScript, Prisma 7 / Postgres, @react-pdf/renderer,
> Resend for transactional email, a passcode-gated admin for live pricing, cookieless
> analytics, and offline (PWA) support** for site visits with patchy signal.
>
> The best part? It's now a reusable platform — the canvas designer, cost/currency engine,
> branded PDF and lead capture become the foundation for the next tools we're planning
> (Wi-Fi coverage, backup-power & solar sizing for the Ghanaian market).
>
> Architects think in spaces. Engineers think in systems. This is what happens when you
> build at the intersection. 🏗️⚡
>
> #SoftwareEngineering #NextJS #TypeScript #FullStack #SmartHome #LightingDesign #Ghana
> #BuildInPublic

---

*Generated 2026-06-25. Tailor the LinkedIn hashtags and trim CV bullets to fit your
target role's length.*

---
title: Lighting Spec Guidance for Residential & Pencasa Builds
business: Pencasa
type: research
tags:
  - lighting
  - lighting-spec
  - residential
  - pencasa
  - japandi
  - cct
  - cri
  - r9
  - tunable-white
  - dim-to-warm
  - home-assistant
  - application
status: active
knowledge_set: lighting-application
cites:
  - color-temperature-cct-cri
  - color-basics-hue-tint-tone-shade-saturation
  - lighting-101-watt-lumens-candela-lux-nits
source: Applied synthesis of lighting fundamentals for Pen Homes / Pencasa builds
created: 2026-06-09T21:00:00
---

# Lighting Spec Guidance for Residential & Pencasa Builds

> Applied guidance. The underlying physics (CCT, Duv, CRI, R9, TM-30, SDCM) is
> defined in [[color-temperature-cct-cri]] — this note assumes those definitions
> and focuses on how to *spec* lighting for real builds.

## Summary

For residential work (and Pencasa builds specifically), a light-quality spec
needs four numbers, not one: **CCT + Duv/SDCM + CRI Ra + R9**, or better
**CCT + Rf + Rg**. The established residential sweet spot is **2700 K, Ra ≥ 90,
R9 ≥ 50** for living/dining/bedrooms — which flatters skin, timber and the Warm
Bone + bronze Japandi palette that a poor-R9 4000 K source would render muddy or
green. Beyond static spec, two psychophysical effects (the Kruithof relationship
and circadian/melanopic response) justify **dim-to-warm** and **tunable-white**
fixtures driven from Home Assistant.

## Per-zone spec (residential)

| Zone | CCT | Min quality | Notes |
|------|-----|-------------|-------|
| Living / dining / bedroom | 2700 K | Ra ≥ 90, R9 ≥ 50 | Flatters skin, timber, warm neutrals; matches Japandi palette |
| Kitchen / task zones | 3000–4000 K | Ra ≥ 90, R9 ≥ 50 | Choose by continuity with adjacent living area |
| Bathroom | 2700–3000 K | **R9 high above all** | Mirrors are skin-rendering machines |
| Office / studio / color-critical | 4000–5000 K | Ra ≥ 90 / Rf high | Where color judgement matters |
| Outdoor / security | cooler OK | — | Rendering less critical |

**Open-plan rule:** jumping more than ~1000 K between visually connected zones
reads as jarring. Keep connected zones within ~1000 K of each other.

## Why the Japandi palette is R9-sensitive

The Pen Homes / Pencasa material palette — **Warm Bone (#F5F2ED)** plaster walls,
**Brushed Bronze (#A68966)** fixtures, timber, warm textiles — is dominated by
warm reds/ambers in its reflectance. A light source weak in deep red (low R9,
typical of cheap phosphor LEDs) will render these **muddy, flat, or green-shifted**
even if it advertises "CRI > 90." This is exactly the failure mode the R9 number
exists to catch. *(See R9 problem in [[color-temperature-cct-cri]].)*

## Designing with light over time

**Kruithof relationship** *(treat as suggestive, not law — the 1941 finding is
only partly replicated):* at low illuminance people tend to prefer warm light; at
high illuminance cooler light feels natural. This is why a dim 5000 K room can
feel clinical and a bright 2700 K room can feel stuffy.

- **Dim-to-warm LEDs** slide from ~3000 K down to ~1800 K as they dim, mimicking
  incandescent behaviour — good for living/dining on dimmers.
- **Tunable white** fixtures let you drive a circadian curve from **Home
  Assistant**: e.g. ~4000 K midday → 2200–2700 K evening. Pre-sleep exposure to
  high-CCT light (rich in ~480 nm blue, the melanopic band) suppresses melatonin
  more strongly, so warming the evening is both aesthetic and circadian.

## Procurement cautions (the practical traps)

- **CCT and CRI are independent** — don't assume "warm" means "renders well."
- **Buy from one batch** for cove/layered/wall-wash runs, and insist on **≤3
  SDCM** so adjacent fixtures match. Cheap LED strip fails on R9 and binning
  consistency first — which is why two nominally identical reels rarely match.
- **Verify R9 on the datasheet**, not the "CRI > 90" silkscreen on the reel.
- For wall-washing recessed runs (the detail that makes or breaks a Japandi
  interior), tight binning matters as much as the CRI number.

## Related
- Fundamental: [[color-temperature-cct-cri]]
- [[lighting-fundamentals-index]]
- Pen Homes brand palette (Warm Bone, Brushed Bronze) — see brand creative brief

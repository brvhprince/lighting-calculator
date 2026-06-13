---
title: Color Temperature, CCT & CRI
business: PenLabs
type: research
tags:
  - lighting
  - color-temperature
  - cct
  - cri
  - kelvin
  - tm-30
  - fundamentals
  - lighting-knowledge-base
  - education
  - duv
  - sdcm
  - r9
  - planckian-locus
status: active
knowledge_set: lighting-fundamentals
source: Black-body physics, CIE/ANSI/IES standards, drawpaintacademy, personal synthesis
created: 2026-06-09T20:53:00
---

# Color Temperature, CCT & CRI

## Summary

Colour temperature describes the **appearance** of white light on a warm-to-cool
scale, measured in Kelvin (K), and derives from black-body radiation physics.
**CCT (Correlated Colour Temperature)** extends that idea to sources (like LEDs)
that aren't true black bodies, by finding the nearest point on the Planckian
locus — which discards a second dimension captured by **Duv** (green/pink tint).
**CRI** is a separate axis entirely: it measures how *accurately* a source
renders object colours against a reference, not what the light looks like. CRI has
serious, well-known weaknesses (the R9 problem, averaging, gameability), which
**TM-30** (Rf + Rg) was designed to fix. The one-line memory hook: CCT is the
"shade of white"; CRI/TM-30 is the "quality of colour under that white." They are
independent axes. This note is the universal fundamental; application/spec
guidance lives in downstream notes that cite this one.

## 1. Colour Temperature: The Physics

The concept comes from **black-body radiation**. A black body is an idealised
object that absorbs all radiation and re-emits it purely as a function of its
temperature. As you heat it, it glows — dull red, then orange, yellow, white,
eventually bluish-white. Planck's law describes the exact spectral distribution
at every temperature.

**Colour temperature (K)** is: *the temperature a black body would need to be in
order to emit light of that colour.* A lamp at "2700 K" matches the hue of a black
body heated to 2700 K (~2427 °C).

This produces the inversion that trips everyone up: **lower Kelvin = "warmer"
looking light (amber/orange); higher Kelvin = "cooler" looking light
(blue-white)** — even though the higher-Kelvin source corresponds to a
physically *hotter* body. "Warm" and "cool" are psychological associations
(fire vs. sky), not thermodynamic ones.

Strictly, true colour temperature only applies to incandescent-type sources: a
tungsten filament is a *near*-black-body radiator at ~2700 K, so its colour
temperature is effectively a genuine physical temperature. The sun's surface is
~5778 K, which is why daylight sits in the 5000–6500 K range.

**Reference points worth memorising:** candle flame ≈ 1850 K, incandescent bulb
≈ 2700 K, halogen ≈ 3000 K, fluorescent "cool white" ≈ 4000 K, noon daylight ≈
5000–5500 K, overcast sky ≈ 6500–7000 K, clear blue north sky ≈ 10000 K+.

![[kelvin-scale-reference.png]]

## 2. Correlated Color Temperature (CCT): Why "Correlated"?

LEDs, fluorescents and discharge lamps are **not** black-body radiators — their
spectra are nothing like a Planck curve, so they have no *true* color
temperature. Instead, plot the light's chromaticity on the CIE diagram, find the
curve traced by black bodies of all temperatures (the **Planckian locus**), and
take the *nearest point*. The temperature there is the **correlated** color
temperature — the black-body temperature the source most resembles.

**Critical consequence:** CCT collapses a 2D color position into one number,
discarding a dimension. That discarded dimension is **Duv** — the perpendicular
distance from the Planckian locus.
- Positive Duv → light sits *above* the locus → **greenish tint**.
- Negative Duv → *below* the locus → **pinkish/magenta tint**.

Two lamps can both read exactly 4000 K yet look visibly different side by side —
one at Duv +0.006, the other at −0.003. This is the most common cause of "same
spec, but they don't match" complaints. Quality manufacturers spec Duv near zero
or slightly negative — slightly pink reads as more flattering than slightly green.

### Datasheet concepts that go with CCT
- **ANSI binning** — LED chips are sorted into chromaticity bins around nominal
  CCTs (2700, 3000, 3500, 4000, 5000 K...). A "2700 K" bin actually spans roughly
  2580–2870 K.
- **MacAdam ellipses / SDCM** — a MacAdam ellipse is the region around a color
  point within which differences are imperceptible to the average eye.
  Consistency is quoted in "steps" (SDCM — Standard Deviation of Color Matching).
  **≤3 SDCM** = fixtures match visually; 5 SDCM = visible variation between
  adjacent fixtures.
- Above ~5000 K, the reference standard shifts from black-body radiation to
  **CIE daylight illuminants** (D50, D65...), because daylight's spectrum diverges
  from a pure Planck curve due to atmospheric scattering. **D65** (a defined
  illuminant, ≈6504 K) is the reference white for sRGB and most display
  calibration — note it's a standardised spectrum, not literally black-body
  output at 6504 K.

## 3. CRI: Measuring Color *Rendering*, Not Color *Appearance*

CCT tells you what the light looks like. It tells you **nothing** about what
objects look like under it. Two 3000 K sources can render a red sofa completely
differently. That's what CRI measures.

**Method (CIE Ra):** take a reference illuminant at the same CCT as the test
source (black body if <5000 K, daylight illuminant if above). Illuminate eight
standardised pastel samples (TCS 1–8) under both. Measure each sample's color
shift; score R1–R8 (100 = no shift). **Ra is the arithmetic mean of those eight.**
A true black body (incandescent) scores 100 by definition, as does daylight.

### CRI's well-known weaknesses
- **The R9 problem.** The eight standard samples are all desaturated pastels.
  Saturated colors are in supplementary samples R9–R15, which **don't count
  toward Ra** — and **R9 (saturated red)** is exactly where phosphor-converted
  white LEDs are weakest. A standard white LED is a blue pump chip (~450 nm spike)
  exciting a yellow-green phosphor; the spectrum rolls off badly in deep red. A
  lamp can score Ra 90+ while having R9 of 20–40, making skin look grey, wood
  flat, food lifeless. Since skin, timber, terracotta and warm textiles dominate
  interiors, **R9 is arguably the most important single number on a residential
  spec.** Look for R9 ≥ 50 minimum, ≥ 90 premium.
- **Averaging hides failures.** Ra is a mean — a lamp can score 85 with one
  sample rendering terribly. Identical Ra ≠ identical rendering.
- **It can be gamed.** Samples and maths are public, so phosphor blends can be
  tuned to the eight pastels without genuinely broad spectral coverage.
- **Fidelity only, vs. an arbitrary reference.** "100" means "matches the
  reference," not "renders ideally" — and the 2700 K reference (incandescent)
  itself renders blues poorly. Also, slightly *increased* saturation often looks
  better than perfect fidelity, but CRI penalises it the same as desaturation.
- **Outdated color science.** Ra still uses the 1964 U*V*W* space and an old
  chromatic adaptation transform, both long superseded.

![[spd-incandescent-vs-led-r9-deficit.svg|587]]

## 4. The Modern Successor: TM-30

ANSI/IES TM-30 was built to fix CRI's problems and is now standard in
professional specs. It uses **99 color evaluation samples** (real-world spectra:
skin, foliage, paints, textiles — far harder to game), the modern CAM02-UCS
color space, and reports **two** complementary numbers:

- **Rf (fidelity index, 0–100)** — like CRI but statistically robust.
- **Rg (gamut index, ~60–140)** — whether the source *compresses* saturation
  (Rg < 100, dull) or *expands* it (Rg > 100, vivid) vs. the reference.

TM-30 also produces a **color vector graphic** — a circular plot showing which
hues shift in which direction — telling you in one glance what a single Ra never
could. A source at Rf 85 / Rg 105 with red slightly enhanced is often *preferred*
over a "perfect" Rf 95 / Rg 100 one. IES publishes preference-oriented specs
(e.g. Annex E "P1": Rf ≥ 78, Rg 95–110 with a mild red boost).

Other metrics you may meet: **CQS** (NIST interim, 15 saturated samples),
**TLCI** (broadcast/camera rendering), **GAI** (older gamut-area saturation
metric).

## 5. The Core Mental Model

- **CCT and CRI are independent axes.** A 2700 K lamp can have terrible CRI; a
  6500 K lamp can have CRI 98. "Warm" ≠ "renders well"; "high CRI" tells you
  nothing about tint (Duv) or whether two fixtures will match (SDCM).
- A complete light-quality spec needs **four numbers, not one:**
  **CCT + Duv (or SDCM binning) + CRI Ra + R9** — or, better,
  **CCT + Rf + Rg.**
- Memory hook: **CCT is the "shade of white"; CRI/TM-30 is the "quality of color
  under that white."** First choose the look of the light, then check how well it
  renders.

> Note on perception: in real life our brains chromatically adapt to the ambient
> hue we're in (chromatic adaptation), which is partly why a single CCT can feel
> "neutral" after a few minutes even when measurement says otherwise.

## Relationship to the other fundamentals
- Builds on [[color-basics-hue-tint-tone-shade-saturation]]: color temperature is
  essentially the **hue/tint of white light** — warm = white tinted toward
  amber, cool = white tinted toward blue.
- Pairs with [[lighting-101-watt-lumens-candela-lux-nits]]: that note covers the
  *quantity* of light, this one the *color quality*.

## Source / Context
- Black-body radiation / Planck's law; CIE chromaticity & Planckian locus
- ANSI C78.377 (binning), IES TM-30, CIE Ra method
- https://drawpaintacademy.com/what-is-color-temperature/

## Related
- [[lighting-fundamentals-index]]
- Downstream application: [[lighting-spec-guidance-residential]]

---
title: "Lighting 101: Watt, Lumens, Candela, Lux and Nits"
business: PenLabs
type: research
tags:
  - lumens
  - lux
  - watt
  - lighting
  - nits
  - candela
  - fundamentals
  - photometry
  - lighting-knowledge-base
  - education
status: active
source: YouTube + InnoAIoT + Rocktech research; personal notes
created: 2026-06-08T19:39:00
knowledge_set: lighting-fundamentals
---

# Lighting 101: Watt, Lumens, Candela, Lux and Nits

## Summary

The core photometric chain describes light from the moment it is produced to the
moment your eye perceives it: **Wattage** (power drawn) produces **Luminous Flux
/ Lumens** (total light emitted in all directions), a directed slice of which is
**Luminous Intensity / Candela** (how concentrated a beam is), which when it lands
on a surface becomes **Illuminance / Lux** (light hitting a surface), and what
finally reflects or emits toward the eye is **Luminance / Nits** (perceived
brightness of a surface). This note establishes those five quantities, the
relationships between them, and the common misconceptions, and serves as the
base reference for all later lighting research.

## Key Points

### Wattage — power, not brightness
- Wattage is how much power a bulb draws from the mains (the socket).
- It measures energy consumption, not light output.
- Within the *same* lighting technology, higher wattage generally means more
  light. But *across* technologies, wattage and brightness decouple: a 9W LED
  can match the brightness of a 60W incandescent bulb. More efficient bulbs
  produce the same brightness using less power.
- Takeaway: don't judge brightness by watts. Judge it by lumens.
### Luminous Flux (Lumens) — total light output
- When a bulb converts electrical energy into light energy, it produces
  **luminous flux**, measured in **lumens (lm)**.
- "Flux" describes the flow of photons; the total amount of visible radiation
  the source emits, in all directions at once.
- Higher lumens = more total light produced.
- This is the right measure for a bulb meant to fill a room.
### Luminous Intensity (Candela) — light in one direction
- If you take a section of that total light and measure how much is travelling in
  one specific direction, you get **luminous intensity**, measured in
  **candela (cd)**.
- Intensity describes how *concentrated* a beam is in a single direction,
  the "strength" of a beam.
- Putting a reflector behind a bulb to make a spotlight increases its luminous
  intensity in that one direction without adding total lumens.
- Most relevant in **commercial / architectural lighting** — floodlights, stage
  lights, spotlights — where you care about *where* the light is thrown and how
  far a beam will reach.
### Illuminance (Lux) — light arriving on a surface
- **Illuminance** is the amount of luminous flux that actually lands on a
  surface, how illuminated that surface becomes. Measured in **lux**.
- **1 lux = 1 lumen per square metre (lm/m²).**
- Lux changes with distance: the further the surface is from the source, the
  lower the lux. This is why product spec sheets quote a distance with the value,
  e.g. **1400 lux @ 0.5m**.
- **The inverse-square law:** illuminance falls off with the *square* of the
  distance from the source. Double the distance → one quarter the lux. This is
  the single most important practical rule in lighting design, and it is the
  core formula behind any lux/lighting calculator. *(Cross-reference: PenLabs
  lighting calculator tool.)* **inverse square law** states that a specified physical quantity or intensity is inversely proportional to the square of the distance from the source.
### Luminance (Nits) — perceived brightness of a surface
- When light hits a surface and reflects off it (or when a surface emits its own
  light), it produces **luminance**, what our eyes and cameras actually perceive
  as "brightness."
- Measured in **nits**, where **1 nit = 1 candela per square metre (cd/m²)**.
- Luminance is essentially **luminous intensity divided by area**, the density
  of candelas spread across a surface.
- Illuminance (lux) ≠ Luminance (nits): lux is light *arriving* at a surface;
  nits is light *leaving* a surface toward the eye.
### "Brightness" is subjective
- Everyday "brightness" is a perception, not a measurable quantity, it has no
  fixed unit, so it isn't used for precise measurement. Use the photometric
  quantities above instead.

## The Relationship Hierarchy

Think of the "flow" of light measurement as a chain:

1. **Luminous Flux (Lumens)** — total energy leaving the source, all directions.
2. **Luminous Intensity (Candela)** — that energy in one specific direction (the beam).
3. **Illuminance (Lux)** — the flux that actually hits a given surface.
4. **Luminance (Nits)** — beam energy spread over a surface area = what the eye sees.

Rule of thumb on *which* to use:
- **Commercial / architectural lighting → Intensity (candela)**: you care where
  the light goes and how far it throws.
- **Displays / screens → Luminance (nits)**: you care how a fixed-area surface
  looks when stared at directly.
- **Room fill / general bulbs → Flux (lumens)**: you care about total output.
- **Task surfaces (desk, worktop) → Illuminance (lux)**: you care how much light reaches the work.

## Worked Questions (Q&A)

### Q1. If an iPhone has 800 nits of brightness, does it bounce 800 nits off the screen?

Not exactly, the 800 nits is light the iPhone **emits** from within, not light
that bounces off its surface.

- **Emitted (active) light:** the screen is an emissive display (OLED/LCD) that
  creates its own light. "800 nits" measures the light intensity *leaving* the
  pixels toward your eyes.
- **Reflected (passive) light:** "bouncing off" is reflectance , ambient light
  (e.g. the sun) hitting the glass and reflecting back.
- **Why the number is high:** the emitted light needs to overpower reflected
  glare. In the dark a phone may only need ~2–5 nits; in sunlight, if the sun
  reflects ~500 nits of glare off the glass, an 800-nit display stays readable
  because its emitted light is stronger than the reflected glare.
- **Distinction:** nits and luminance are the same unit (1 nit = 1 cd/m²), but
  context differs, a screen's 800 nits is *emissive* luminance (light it makes);
  a sheet of paper's luminance is purely *reflective* (light it bounces).


### Q2. Why isn't screen brightness treated as luminous flux (lumens), since the LEDs emit visible radiation?

Because a screen's effectiveness depends on how concentrated the light is *toward
your eyes*, not the total raw output in every direction.

- **Lumens (flux)** = total light in all directions, ideal for a bulb meant to
  fill a room.
- **Nits (luminance)** = light intensity per square metre in a specific direction, and you view a phone from a specific angle, so only the light heading toward
  your retina matters.
- **The area problem:** a 100-inch TV and a 6-inch phone emitting the *same*
  lumens would look wildly different, the phone blindingly bright, the TV dim.
  Lumens ignore surface area. Nits (cd/m²) normalise for area, so you can fairly
  compare a watch screen to a stadium billboard.

### Q3. Isn't directional screen light really luminous intensity (candela)?

You're right that luminous intensity (candela) is light power in a specific
direction , a "section" of the total lumens. But we don't stop there for screens,
because intensity ignores the **physical size** of the source.

- **Luminous intensity (candela):** the "strength" of a beam in one direction;
  huge in commercial lighting (floodlights, stage lights) because it tells you
  how far a beam throws.
- **Luminance (nits = cd/m²):** intensity *divided by area*. If a tiny LED and a
  large 80-inch panel both have 100 cd of intensity, the tiny LED looks like a
  laser (dangerous to view) while the big panel looks like a soft glow.
- **Why screens use nits:** a screen has a fixed area, so we need the *density*
  of candelas across its surface, that's what tells your brain how bright the
  surface itself looks.

So: commercial lighting reports **intensity** (where is the light going?);
displays report **luminance** (how does the surface look head-on?).

In the commercial lighting space, you see Luminous Intensity because you're often concerned with where the light is going (throwing light across a warehouse). In the display space, we use Luminance because we're concerned with how the surface looks when you stare directly at it.

## Source / Context
https://www.youtube.com/watch?v=mW6QLkR9ibQ
https://www.youtube.com/watch?v=GZ9fQPiEdhA
https://www.innoaiot.com/what-is-nits-brightness/
https://www.rocktech.com.hk/rocktech-blog/what-are-nits-brightness/
## Related
- [[lighting-fundamentals-index]]
- Upcoming: Hue, Tint, Shade, Tone
- Upcoming: Color Temperature (Kelvin)
- PenLabs lighting calculator (applies the inverse-square law)

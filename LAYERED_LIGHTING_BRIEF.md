# Layered Lighting — Build Brief for Claude Code (Lighting Calculator)

**Read this fully before coding.** This adds a *layered lighting* mode to the
existing lighting calculator. It does NOT replace the current single-fixture
flow. No LLM is required — this is rule-based lookup + the existing lumen math.

---

## 0. What exists / what we're adding

The calculator currently: pick a room, pick **one** fixture type (recessed,
pendant, LED, track...), and it calculates lumens from room size using existing
logic. Keep this exactly as-is — it becomes **Simple mode**.

We're adding **Advanced mode** (a toggle — "Advanced" / "Layered lighting"):
instead of one fixture, the user designs a room with **layers** of lighting, and
the system recommends fixture types + quantities per layer and calculates a lumen
target for each, distributing the room's total light budget across the layers.

Simple mode must remain the default and stay untouched. Advanced mode is opt-in.

---

## 1. The core model: three layers

Present each layer in **layman + technical** terms (show layman first):

| Layman label | Technical layer | Typical fixtures |
|--------------|-----------------|------------------|
| Ceiling / general lights | **Ambient** | recessed, surface mount, pendant |
| Work / task lights | **Task** | under-cabinet, track, desk/floor lamp |
| Mood / accent lights | **Accent** | wall sconce, uplight, LED strip |

Advanced-mode flow:
1. Pick **room type** (garage, bedroom, kitchen, living, bathroom, office...).
2. Pick **which layers** to include — any combination, or "All three".
   - Also allow picking specific fixture types within a layer (e.g. "I want
     pendants for ambient"), OR let the system auto-recommend fixtures.
3. System outputs, per selected layer: **recommended fixture type(s) + quantity
   + lumen target per fixture + recommended CCT** (see §3, §4).

---

## 2. The lux-budget distribution (THE key principle)

Do **not** calculate each layer as if it must light the whole room. Each layer
covers a *share* of the room's target illuminance. This is what makes layered
results correct rather than 3× over-lit.

Approach:
- Start from the room's **target lux** (already in the existing logic, or add a
  standard table — see §3).
- **Ambient** carries the baseline general illumination — the largest share.
- **Task** adds *local* boosts only on work zones (not the whole floor area), so
  its lumens are computed against the task area, not the room area.
- **Accent** is a small percentage of ambient (atmosphere, not function).

Suggested default split (make these constants, easy to tune):
- Ambient: provides ~100% of the room's *baseline* target lux over full floor area.
- Task: provides an *additional* local target over the defined task area only.
- Accent: ~10–30% of the ambient level, applied to a small area.

Total lumens for a layer = target_lux × area_for_that_layer ÷ (utilisation × maintenance factors already in the existing logic). Then quantity = layer lumens ÷ per-fixture lumen output.

---

## 3. Data the feature needs (define this table deliberately)

The heart of the feature is a **room → layers → default fixtures + quantities +
target lux** table. This must be populated from a lighting-standards reference,
NOT guessed. Use recognised illuminance recommendations (e.g. IES / EN 12464-1
ranges) for target lux per room. Structure it as data, e.g.:

```
ROOM_PROFILES = {
  garage: {
    target_lux_ambient: 150,        // general
    task_lux: 500,                  // workbench zone
    layers: {
      ambient: { fixtures: ["recessed","surface"], default_qty_hint: "by area" },
      task:    { fixtures: ["track","under-cabinet"], zones: ["workbench"] },
      accent:  { optional: true }
    }
  },
  bedroom: { target_lux_ambient: 100, task_lux: 300, ... },
  kitchen: { target_lux_ambient: 300, task_lux: 500, ... },
  ...
}
```

Quantity recommendation: derive from area ÷ per-fixture coverage, then round to
sensible whole numbers (e.g. recessed lights spaced on a grid). Don't hardcode "2
recessed" — compute it from room area and fixture spacing, then present as
"2× recessed downlights".

**Open item for the developer:** confirm the standards source for target lux and
fixture spacing before populating. If unavailable, use IES Lighting Handbook
ranges and flag the assumption in code comments.

---

## 4. Borrow from the existing lighting research (authoritative values)

The project owner has a lighting knowledge base. These notes are the spec for the
"quality" outputs that make this a *lighting spec generator*, not just a lumen
counter. Pull these specifics:

### 4a. Inverse-square law / mounting height — from `lighting-101-watt-lumens-candela-lux-nits.md`
- Illuminance falls off with the **square of distance** from the source. This is
  named in that note as "the core formula behind any lighting calculator."
- **Action:** ambient fixture count must factor **ceiling/mounting height** — a
  high ceiling needs more or higher-output ambient fixtures to hit floor lux.
  Task lights sit close to the surface, so they're far more lumen-efficient. If
  the current calculator ignores mounting height, **add it in this feature** — it
  materially changes ambient quantity. Use illuminance ∝ 1/d².

### 4b. Per-room CCT recommendations — from `lighting-spec-guidance-residential.md`
Output a recommended **color temperature** per layer/room:
- Living / dining / bedroom: **2700 K**
- Kitchen / task zones: **3000–4000 K**
- Bathroom: 2700–3000 K, prioritise high R9
- Office / studio / colour-critical: **4000–5000 K**
- Garage/workshop task: cooler (4000 K) fine; ambient can stay neutral
- **Open-plan rule:** keep visually connected zones within ~1000 K of each other.
- Pattern: **task layers run cooler, ambient/accent run warmer.**

### 4c. CRI / R9 quality note — from `color-temperature-cct-cri.md` + spec note
- In the output, recommend **CRI Ra ≥ 90, R9 ≥ 50** for residential/warm rooms
  (skin, timber, warm textiles need good deep-red rendering).
- One-line rationale tooltip: standard white LEDs are weak in deep red (R9), which
  makes warm materials look muddy — so R9 matters for residential layers.

### 4d. Kruithof rationale — from `color-temperature-cct-cri.md`
- Justification tooltip for *why* layers differ: at low light levels people prefer
  warm light; at high levels cooler feels natural. Hence accent/ambient = warm &
  dimmable, task = brighter & cooler. (Flag as "suggestive, not law.")

---

## 5. UI / UX

- A clear **Simple / Advanced** toggle. Default = Simple.
- Advanced mode reveals: room picker → layer checkboxes (with layman labels and a
  small "?" explaining ambient/task/accent) → optional fixture-type choice per
  layer → "Calculate".
- Output: a per-layer breakdown card — fixture type, **quantity**, lumens per
  fixture, total lumens, recommended **CCT**, and a **CRI/R9** note. Plus a room
  total.
- Keep the existing visual style. Do not introduce new heavy dependencies.
- All advanced logic must work **offline / client-side** like the current tool —
  no API calls, no LLM.

---

## 6. Build order

1. Simple/Advanced toggle; Advanced shell that reuses existing lumen math.
2. The three-layer model + the lux-budget distribution logic (§2). Constants tunable.
3. The `ROOM_PROFILES` data table (§3) — start with garage, bedroom, kitchen,
   living, bathroom, office.
4. Fixture quantity from area + spacing + mounting height (§4a). Add mounting
   height input if absent.
5. Per-layer output cards.
6. Layer in the CCT recommendations (§4b), then CRI/R9 + tooltips (§4c/§4d).

Ship steps 1–5 as the working feature; 6 is the "spec generator" enhancement.

---

## 7. Constraints

- **No LLM. No network calls.** Pure rule-based + existing math. Offline-capable.
- Simple mode stays default and unchanged.
- Don't over-engineer the UI — preserve the current simplicity; advanced is opt-in.
- Make all distribution ratios and lux targets named constants, not magic numbers.
- Target-lux and spacing values must trace to a standards source; comment them.

---


# Analytics events — cheat sheet

Self-hosted **Umami** (cookieless, no consent banner). Enable by setting both env vars:

```
NEXT_PUBLIC_UMAMI_SRC=https://analytics.pen.homes/script.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID=<website id>
```

Until both are set, tracking is a no-op. Pageviews (incl. SPA route changes) and UTM
parameters are captured automatically — the events below are the custom funnel signals.

## Events fired by the app

| Event | When | Properties | Source file |
|-------|------|------------|-------------|
| `calculate` | A full calculation is run | `room`, `unit` | `FullLightingCalculator.tsx` |
| `open_in_designer` | "Open in Designer" handoff from the calculator | `room` | `FullLightingCalculator.tsx` |
| `pdf_export` | A branded PDF is downloaded | `source` (`calculator` \| `designer`), `room` | `PDFExport.tsx` |
| `quote_submitted` ⭐ | Quote request submitted successfully | `source`, `room` | `QuoteRequestDialog.tsx` |
| `project_published` ⭐ | Project published to a share link | `rooms` (count) | `ProjectManager.tsx` |
| `currency_change` | Currency switched (USD/GHS) | `currency` | `CurrencySelector.tsx` |
| `brand_cta_click` ⭐ | A Pen Homes / Pencasa / Penlabs CTA clicked | `brand`, `from` (`narrative` \| `ecosystem`) | `TrackedLink.tsx` |

⭐ = recommended **conversion goal**.

## The funnel to watch

```
pageview → calculate → (pdf_export | quote_submitted)
                         └── quote_submitted = primary lead conversion
brand visibility:  pageview → brand_cta_click   (tool → business handoff)
```

- **Primary conversion:** `quote_submitted` — the lead. Track its rate vs `calculate`.
- **Secondary conversions:** `project_published` (pro/contractor intent) and `brand_cta_click`
  (interest in Pen Homes / Pencasa / Penlabs).
- **Engagement:** `pdf_export`, `open_in_designer` — people taking the output somewhere.

## Setting up in Umami

1. Events appear automatically under **Events** once they start firing (no dashboard config needed to collect them).
2. Use **filters / properties** to segment, e.g. `pdf_export` by `source`, `brand_cta_click` by `brand`,
   or any event by **country** (Ghana vs international) and **UTM** (campaign attribution).
3. To formalise a conversion, create a **Goal/Report** in Umami for `quote_submitted` (and optionally
   `project_published`, `brand_cta_click`).
4. Campaign attribution: links in the quote emails are UTM-tagged (`utm_source=pen-homes`,
   `utm_medium=email`) and Resend rewrites them through `links.pen.homes` for click tracking — so
   email-driven visits attribute correctly here too.

## Adding a new event

```ts
import { track } from '@/lib/analytics';

track('event_name', { key: 'value' }); // safe no-op if analytics is off
```

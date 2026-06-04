'use client';

import Script from 'next/script';

// Loads the self-hosted Umami tracking script when configured. Cookieless, so
// no consent banner is required. Set both env vars to enable:
//   NEXT_PUBLIC_UMAMI_SRC          e.g. https://analytics.pen.homes/script.js
//   NEXT_PUBLIC_UMAMI_WEBSITE_ID   the website id from your Umami dashboard
export function Analytics() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!src || !websiteId) return null;
  return <Script src={src} data-website-id={websiteId} strategy="afterInteractive" />;
}

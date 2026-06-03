// Canonical site URL for metadata, OG tags, sitemap and robots.
// Override per environment with NEXT_PUBLIC_SITE_URL (no trailing slash).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://lighting.pen.homes'
).replace(/\/$/, '');

// Lightweight, provider-agnostic event tracking. Currently targets Umami
// (window.umami.track), but no-ops safely when analytics isn't configured.
declare global {
  interface Window {
    umami?: { track?: (event: string, data?: Record<string, unknown>) => void };
  }
}

export function track(event: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    window.umami?.track?.(event, data);
  } catch {
    /* never let analytics break the app */
  }
}

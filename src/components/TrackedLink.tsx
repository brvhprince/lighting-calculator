'use client';

import { track } from '@/lib/analytics';

// External link that fires an analytics event on click. Lets server components
// (e.g. the home page) attach tracking to brand CTAs.
export function TrackedLink({
  href,
  event,
  data,
  className,
  children,
}: {
  href: string;
  event: string;
  data?: Record<string, unknown>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={() => track(event, data)}
    >
      {children}
    </a>
  );
}

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { FixtureDef } from '@/types';
import { BUILTIN_FIXTURES } from '@/lib/fixtureTypes';
import {
  FixtureStore,
  getFixtureCatalog,
  setFixtureCatalog,
  resetFixtureCatalog,
} from '@/lib/fixtureCatalog';

type FixturesContextType = {
  // Effective catalogue (built-ins merged with admin overrides), including archived.
  catalog: FixtureDef[];
  // The admin's stored override items (what gets persisted), or undefined for defaults.
  overrideItems: FixtureDef[] | undefined;
  // Apply + persist locally (server persistence is done by the admin editor POST).
  setOverrideItems: (items: FixtureDef[]) => void;
  resetOverrides: () => void;
};

const FixturesContext = createContext<FixturesContextType | undefined>(undefined);

const CACHE_KEY = 'pen-lighting-fixtures';

// Hydrate the module registry and return the effective catalogue snapshot.
function hydrate(items: FixtureDef[] | undefined): FixtureDef[] {
  if (items && items.length) setFixtureCatalog(items);
  else resetFixtureCatalog();
  return getFixtureCatalog();
}

export function FixturesProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<FixtureDef[]>(BUILTIN_FIXTURES);
  const [overrideItems, setOverrideItemsState] = useState<FixtureDef[] | undefined>(undefined);

  useEffect(() => {
    // 1) Instant paint from the local cache.
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const items = JSON.parse(cached) as FixtureDef[];
        if (Array.isArray(items) && items.length) {
          setOverrideItemsState(items);
          setCatalog(hydrate(items));
        }
      } catch {
        /* ignore corrupt cache */
      }
    }

    // 2) Reconcile with the server-persisted catalogue (source of truth).
    fetch('/api/admin/fixtures')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const store = data?.fixtures as FixtureStore | undefined;
        const items = store && Array.isArray(store.items) && store.items.length ? store.items : undefined;
        setOverrideItemsState(items);
        setCatalog(hydrate(items));
        try {
          if (items) localStorage.setItem(CACHE_KEY, JSON.stringify(items));
          else localStorage.removeItem(CACHE_KEY);
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* offline / no DB — keep cached/default values */
      });
  }, []);

  const setOverrideItems = useCallback((items: FixtureDef[]) => {
    setOverrideItemsState(items);
    setCatalog(hydrate(items));
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, []);

  const resetOverrides = useCallback(() => {
    setOverrideItemsState(undefined);
    setCatalog(hydrate(undefined));
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <FixturesContext.Provider value={{ catalog, overrideItems, setOverrideItems, resetOverrides }}>
      {children}
    </FixturesContext.Provider>
  );
}

export function useFixtures(): FixturesContextType {
  const ctx = useContext(FixturesContext);
  if (!ctx) throw new Error('useFixtures must be used within FixturesProvider');
  return ctx;
}

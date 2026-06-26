'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { FixtureDef } from '@/types';
import { BUILTIN_FIXTURES } from '@/lib/fixtureTypes';
import {
  FixtureStore,
  getFixtureCatalog,
  setFixtureCatalog,
  resetFixtureCatalog,
  setPersonalFixtures,
  registerFixtures,
} from '@/lib/fixtureCatalog';

type FixturesContextType = {
  // Effective catalogue (built-ins merged with admin overrides), including archived.
  catalog: FixtureDef[];
  // The admin's stored override items (what gets persisted), or undefined for defaults.
  overrideItems: FixtureDef[] | undefined;
  // Apply + persist locally (server persistence is done by the admin editor POST).
  setOverrideItems: (items: FixtureDef[]) => void;
  resetOverrides: () => void;
  // Personal catalogue: a non-admin user's reusable custom fixtures (localStorage).
  personalFixtures: FixtureDef[];
  addPersonalFixture: (fixture: FixtureDef) => void;
  updatePersonalFixture: (id: string, patch: Partial<FixtureDef>) => void;
  removePersonalFixture: (id: string) => void;
  // Register transient design fixtures (custom + derived overrides) so they
  // resolve by id everywhere (cost, shopping, PDF) while a design is open.
  registerDesignFixtures: (items: FixtureDef[]) => void;
};

const FixturesContext = createContext<FixturesContextType | undefined>(undefined);

const CACHE_KEY = 'pen-lighting-fixtures';
const MY_FIXTURES_KEY = 'pen-lighting-my-fixtures';

// Hydrate the module registry and return the effective catalogue snapshot.
function hydrate(items: FixtureDef[] | undefined): FixtureDef[] {
  if (items && items.length) setFixtureCatalog(items);
  else resetFixtureCatalog();
  return getFixtureCatalog();
}

export function FixturesProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<FixtureDef[]>(BUILTIN_FIXTURES);
  const [overrideItems, setOverrideItemsState] = useState<FixtureDef[] | undefined>(undefined);
  const [personalFixtures, setPersonalFixturesState] = useState<FixtureDef[]>([]);

  useEffect(() => {
    // 0) Load the personal catalogue first so every rebuild below includes it.
    try {
      const rawPersonal = localStorage.getItem(MY_FIXTURES_KEY);
      if (rawPersonal) {
        const items = JSON.parse(rawPersonal) as FixtureDef[];
        if (Array.isArray(items) && items.length) {
          setPersonalFixturesState(items);
          setPersonalFixtures(items);
          setCatalog(getFixtureCatalog());
        }
      }
    } catch {
      /* ignore corrupt personal cache */
    }

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
        /* offline / no DB, keep cached/default values */
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

  // Persist the personal catalogue, re-merge it into the registry, and refresh
  // the catalogue snapshot so pickers re-render.
  const applyPersonal = useCallback((next: FixtureDef[]) => {
    setPersonalFixturesState(next);
    setPersonalFixtures(next);
    setCatalog(getFixtureCatalog());
    try {
      if (next.length) localStorage.setItem(MY_FIXTURES_KEY, JSON.stringify(next));
      else localStorage.removeItem(MY_FIXTURES_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const addPersonalFixture = useCallback(
    (fixture: FixtureDef) => applyPersonal([...personalFixtures, fixture]),
    [personalFixtures, applyPersonal]
  );

  const updatePersonalFixture = useCallback(
    (id: string, patch: Partial<FixtureDef>) =>
      applyPersonal(personalFixtures.map((f) => (f.id === id ? { ...f, ...patch, id } : f))),
    [personalFixtures, applyPersonal]
  );

  const removePersonalFixture = useCallback(
    (id: string) => applyPersonal(personalFixtures.filter((f) => f.id !== id)),
    [personalFixtures, applyPersonal]
  );

  const registerDesignFixtures = useCallback((items: FixtureDef[]) => {
    if (!items.length) return;
    registerFixtures(items);
    setCatalog(getFixtureCatalog());
  }, []);

  return (
    <FixturesContext.Provider
      value={{
        catalog,
        overrideItems,
        setOverrideItems,
        resetOverrides,
        personalFixtures,
        addPersonalFixture,
        updatePersonalFixture,
        removePersonalFixture,
        registerDesignFixtures,
      }}
    >
      {children}
    </FixturesContext.Provider>
  );
}

export function useFixtures(): FixturesContextType {
  const ctx = useContext(FixturesContext);
  if (!ctx) throw new Error('useFixtures must be used within FixturesProvider');
  return ctx;
}

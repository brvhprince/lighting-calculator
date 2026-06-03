'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  CurrencyCode,
  DEFAULT_CURRENCY,
  Market,
  MARKETS,
  MarketOverrides,
  mergeMarkets,
  formatMoney,
} from '@/config/markets';

type CurrencyContextType = {
  currency: CurrencyCode;
  market: Market;
  markets: Record<CurrencyCode, Market>;
  setCurrency: (c: CurrencyCode) => void;
  format: (value: number) => string;
  // Admin overrides
  overrides: MarketOverrides | undefined;
  setOverrides: (next: MarketOverrides) => void;
  resetOverrides: () => void;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_KEY = 'pen-lighting-currency';
const OVERRIDES_KEY = 'pen-lighting-market-overrides';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [overrides, setOverridesState] = useState<MarketOverrides | undefined>(undefined);

  useEffect(() => {
    const savedCurrency = localStorage.getItem(CURRENCY_KEY) as CurrencyCode | null;
    if (savedCurrency === 'USD' || savedCurrency === 'GHS') setCurrencyState(savedCurrency);

    const savedOverrides = localStorage.getItem(OVERRIDES_KEY);
    if (savedOverrides) {
      try {
        setOverridesState(JSON.parse(savedOverrides));
      } catch {
        /* ignore corrupt overrides */
      }
    }
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const setOverrides = useCallback((next: MarketOverrides) => {
    setOverridesState(next);
    try {
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const resetOverrides = useCallback(() => {
    setOverridesState(undefined);
    try {
      localStorage.removeItem(OVERRIDES_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const markets = useMemo(() => mergeMarkets(MARKETS, overrides), [overrides]);
  const market = markets[currency];
  const format = useCallback((value: number) => formatMoney(value, market), [market]);

  return (
    <CurrencyContext.Provider
      value={{ currency, market, markets, setCurrency, format, overrides, setOverrides, resetOverrides }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

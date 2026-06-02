'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  CurrencyCode,
  DEFAULT_CURRENCY,
  Market,
  getMarket,
  formatMoney,
} from '@/config/markets';

type CurrencyContextType = {
  currency: CurrencyCode;
  market: Market;
  setCurrency: (c: CurrencyCode) => void;
  format: (value: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'pen-lighting-currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (saved && (saved === 'USD' || saved === 'GHS')) setCurrencyState(saved);
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const market = getMarket(currency);
  const format = useCallback((value: number) => formatMoney(value, market), [market]);

  return (
    <CurrencyContext.Provider value={{ currency, market, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

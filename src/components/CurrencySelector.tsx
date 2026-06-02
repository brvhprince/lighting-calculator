'use client';

import { useCurrency } from '@/context/CurrencyProvider';
import { CurrencyCode, MARKETS } from '@/config/markets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  return (
    <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
      <SelectTrigger className="h-9 w-[88px]" aria-label="Currency">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(MARKETS).map((m) => (
          <SelectItem key={m.code} value={m.code}>
            {m.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

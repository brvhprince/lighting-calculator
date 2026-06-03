import type { Metadata } from 'next';
import AdminConfigEditor from '@/components/AdminConfigEditor';
import { AdminGate } from '@/components/AdminGate';

export const metadata: Metadata = {
  title: 'Admin · Configuration — Penlabs Lighting Calculator',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-bronze">Internal</p>
        <h1 className="font-display text-3xl mb-2 mt-1">Configuration</h1>
        <p className="text-muted-foreground">
          Update prices, electricity rates and currency values without touching code.
        </p>
      </div>
      <AdminGate>
        <AdminConfigEditor />
      </AdminGate>
    </div>
  );
}

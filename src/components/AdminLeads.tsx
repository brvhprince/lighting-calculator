'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, RefreshCw, Download } from 'lucide-react';

type Lead = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  roomName?: string | null;
  source?: string | null;
  data?: Record<string, unknown> | null;
};

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('pen-admin-token');
      const res = await fetch('/api/leads', { headers: { Authorization: `Bearer ${token ?? ''}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch {
      setError('Could not load leads.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const weekAgo = Date.now() - 7 * 86_400_000;
  const last7 = leads.filter((l) => new Date(l.createdAt).getTime() >= weekAgo).length;

  const exportCsv = () => {
    const cols = ['createdAt', 'name', 'email', 'phone', 'roomName', 'source', 'message', 'fixtures', 'totalLumens', 'currency'];
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = leads.map((l) =>
      [
        l.createdAt,
        l.name,
        l.email,
        l.phone ?? '',
        l.roomName ?? '',
        l.source ?? '',
        l.message ?? '',
        l.data?.fixtures ?? '',
        l.data?.totalLumens ?? '',
        l.data?.currency ?? '',
      ]
        .map(esc)
        .join(',')
    );
    const csv = [cols.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pen-homes-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-brand-bronze" />
              Quote requests ({leads.length})
            </CardTitle>
            <CardDescription>
              Enquiries from the calculator and designer · {last7} in the last 7 days.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              className="gap-1.5"
              disabled={leads.length === 0}
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : leads.length === 0 && !loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No quote requests yet.</p>
        ) : (
          <div className="space-y-3">
            {leads.map((l) => (
              <div key={l.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{l.name}</p>
                    <p className="text-sm text-muted-foreground">
                      <a href={`mailto:${l.email}`} className="hover:text-brand-bronze">
                        {l.email}
                      </a>
                      {l.phone ? ` · ${l.phone}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(l.createdAt).toLocaleString()}
                    {l.source ? ` · ${l.source}` : ''}
                  </span>
                </div>
                {l.roomName && (
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Room:</span> {l.roomName}
                    {l.data?.fixtures != null && (
                      <span className="text-muted-foreground">
                        {' '}
                        · {String(l.data.fixtures)} fixtures · {String(l.data.totalLumens ?? '')} lm
                      </span>
                    )}
                  </p>
                )}
                {l.message && <p className="mt-1 text-sm text-muted-foreground">“{l.message}”</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

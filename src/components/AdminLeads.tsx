'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, RefreshCw } from 'lucide-react';

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-brand-bronze" />
              Quote requests ({leads.length})
            </CardTitle>
            <CardDescription>Enquiries submitted from the calculator and designer.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
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

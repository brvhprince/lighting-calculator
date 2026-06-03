'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, LogOut, AlertTriangle } from 'lucide-react';

const SESSION_KEY = 'pen-admin-authed';
const TOKEN_KEY = 'pen-admin-token';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // sessionStorage is cleared when the browser is fully closed.
    setAuthed(sessionStorage.getItem(SESSION_KEY) === 'true');
    setReady(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.token) sessionStorage.setItem(TOKEN_KEY, data.token);
        sessionStorage.setItem(SESSION_KEY, 'true');
        setAuthed(true);
        setCode('');
      } else {
        setError('Incorrect passcode.');
      }
    } catch {
      setError('Could not verify — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const lock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthed(false);
  };

  // Avoid a flash of either state before sessionStorage is read.
  if (!ready) return null;

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm">
        <Card>
          <CardHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-5 w-5 text-brand-bronze" />
            </div>
            <CardTitle>Restricted area</CardTitle>
            <CardDescription>Enter the admin passcode to edit pricing &amp; market configuration.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="passcode">Passcode</Label>
                <Input
                  id="passcode"
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" /> {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading || !code}>
                {loading ? 'Checking…' : 'Unlock'}
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              Your session is kept until you close the browser.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={lock} className="gap-1.5 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Lock
        </Button>
      </div>
      {children}
    </div>
  );
}

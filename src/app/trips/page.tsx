'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createTrip, errMsg, joinTripByCode, listMyTrips } from '@/lib/db';
import { useRequireAuth } from '@/components/AuthProvider';
import Field from '@/components/Field';
import AirportInput from '@/components/AirportInput';
import { fmtRange } from '@/lib/format';
import type { Trip } from '@/lib/types';

export default function TripsPage() {
  const { user, displayName, loading } = useRequireAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState('');

  // create form
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [destCode, setDestCode] = useState('');
  const [origin, setOrigin] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [creating, setCreating] = useState(false);

  // join form
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const uid = user?.uid;

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      setTrips(await listMyTrips(uid));
    } catch (e) {
      setError(errMsg(e));
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    setError('');
    try {
      const id = await createTrip(user, displayName, {
        name: name.trim(),
        origin: origin || null,
        destination: destination.trim(),
        destination_code: destCode || null,
        start_date: start || null,
        end_date: end || null,
      });
      router.push(`/trips/${id}`);
    } catch (err) {
      setError(errMsg(err));
      setCreating(false);
    }
  }

  async function join(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setJoining(true);
    setError('');
    try {
      const id = await joinTripByCode(user, displayName, code);
      router.push(`/trips/${id}`);
    } catch (err) {
      setError(errMsg(err));
      setJoining(false);
    }
  }

  if (loading || !user) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="spread">
        <h1>My trips</h1>
        <button className="btn primary" onClick={() => setShowCreate((s) => !s)}>
          {showCreate ? 'Cancel' : '+ New trip'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showCreate && (
        <form className="card" onSubmit={create}>
          <h2>Start planning</h2>
          <div className="form-grid">
            <Field label="Trip name">
              <input
                className="input"
                placeholder="Tokyo with the crew"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field label="Where to? (city or country)">
              <input
                className="input"
                placeholder="Tokyo, Japan"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </Field>
            <Field label="Flying from (airport code)" hint="e.g. TPE">
              <AirportInput value={origin} onChange={setOrigin} />
            </Field>
            <Field label="Flying to (airport code)" hint="e.g. NRT or HND">
              <AirportInput value={destCode} onChange={setDestCode} placeholder="NRT" />
            </Field>
            <Field label="Leaving on">
              <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Coming back on">
              <input
                className="input"
                type="date"
                min={start || undefined}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create trip'}
            </button>
            <span className="muted small">You&apos;ll get a code to share with friends.</span>
          </div>
        </form>
      )}

      <form className="card flat" onSubmit={join}>
        <div className="spread">
          <div>
            <h3>Got a trip code from a friend?</h3>
            <span className="muted small">Enter it to join their team.</span>
          </div>
          <div className="row">
            <input
              className="input"
              style={{ width: 160, textTransform: 'uppercase', letterSpacing: '0.15em' }}
              placeholder="ABC-123"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button className="btn" disabled={joining}>
              {joining ? 'Joining…' : 'Join trip'}
            </button>
          </div>
        </div>
      </form>

      {trips === null ? (
        <p className="muted">Loading trips…</p>
      ) : trips.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>No trips yet. Create one, or join a friend&apos;s with a code.</p>
        </div>
      ) : (
        trips.map((t) => (
          <Link key={t.id} href={`/trips/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <div className="card-head">
                <div>
                  <h2 style={{ marginBottom: 2 }}>{t.name}</h2>
                  <div className="muted">
                    {t.origin ? `${t.origin} → ` : ''}
                    {t.destination}
                    {t.destination_code ? ` (${t.destination_code})` : ''}
                  </div>
                </div>
                <span className="badge">{fmtRange(t.start_date, t.end_date)}</span>
              </div>
            </div>
          </Link>
        ))
      )}
    </>
  );
}

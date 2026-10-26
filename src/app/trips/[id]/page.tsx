'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { errMsg, getTrip, updateTrip } from '@/lib/db';
import { useRequireAuth } from '@/components/AuthProvider';
import Field from '@/components/Field';
import AirportInput from '@/components/AirportInput';
import FlightsTab from '@/components/trip/FlightsTab';
import HotelsTab from '@/components/trip/HotelsTab';
import PlacesTab from '@/components/trip/PlacesTab';
import ChecklistTab from '@/components/trip/ChecklistTab';
import TeamTab from '@/components/trip/TeamTab';
import { fmtRange, nights } from '@/lib/format';
import type { Trip } from '@/lib/types';

type TabId = 'flights' | 'hotels' | 'places' | 'checklist' | 'team';

const TABS: { id: TabId; label: string }[] = [
  { id: 'flights', label: '✈ Flights' },
  { id: 'hotels', label: '🏨 Hotels' },
  { id: 'places', label: '📍 Places' },
  { id: 'checklist', label: '✅ Checklist' },
  { id: 'team', label: '👥 Team' },
];

export default function TripPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useRequireAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabId>('flights');
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      const t = await getTrip(id);
      if (!t) setError('Trip not found, or you are not a member of it.');
      else setTrip(t);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading || !user) return <p className="muted">Loading…</p>;
  if (error)
    return (
      <div className="card">
        <div className="error">{error}</div>
        <Link href="/trips" className="btn">
          ← My trips
        </Link>
      </div>
    );
  if (!trip) return <p className="muted">Loading trip…</p>;

  const n = nights(trip.start_date, trip.end_date);

  return (
    <>
      <Link href="/trips" className="muted small">
        ← My trips
      </Link>
      <div className="card-head" style={{ marginTop: '0.4rem' }}>
        <div>
          <h1 style={{ marginBottom: 2 }}>{trip.name}</h1>
          <div className="muted">
            {trip.origin ? `${trip.origin} → ` : ''}
            {trip.destination}
            {trip.destination_code ? ` (${trip.destination_code})` : ''} · {fmtRange(trip.start_date, trip.end_date)}
            {n ? ` · ${n} nights` : ''}
          </div>
        </div>
        <button className="btn small" onClick={() => setEditing((e) => !e)}>
          {editing ? 'Close' : 'Edit trip details'}
        </button>
      </div>

      {editing && (
        <EditTrip
          trip={trip}
          onSaved={(t) => {
            setTrip(t);
            setEditing(false);
          }}
        />
      )}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'flights' && <FlightsTab trip={trip} />}
      {tab === 'hotels' && <HotelsTab trip={trip} />}
      {tab === 'places' && <PlacesTab trip={trip} />}
      {tab === 'checklist' && <ChecklistTab trip={trip} />}
      {tab === 'team' && <TeamTab trip={trip} />}
    </>
  );
}

function EditTrip({ trip, onSaved }: { trip: Trip; onSaved: (t: Trip) => void }) {
  const [name, setName] = useState(trip.name);
  const [destination, setDestination] = useState(trip.destination);
  const [destCode, setDestCode] = useState(trip.destination_code ?? '');
  const [origin, setOrigin] = useState(trip.origin ?? '');
  const [start, setStart] = useState(trip.start_date ?? '');
  const [end, setEnd] = useState(trip.end_date ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fields = {
      name: name.trim(),
      destination: destination.trim(),
      destination_code: destCode || null,
      origin: origin || null,
      start_date: start || null,
      end_date: end || null,
    };
    try {
      await updateTrip(trip.id, fields);
      onSaved({ ...trip, ...fields });
    } catch (err) {
      setError(errMsg(err));
    }
    setBusy(false);
  }

  return (
    <form className="card" onSubmit={save}>
      <div className="form-grid">
        <Field label="Trip name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Destination">
          <input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} required />
        </Field>
        <Field label="Flying from">
          <AirportInput value={origin} onChange={setOrigin} />
        </Field>
        <Field label="Flying to">
          <AirportInput value={destCode} onChange={setDestCode} placeholder="NRT" />
        </Field>
        <Field label="Leaving on">
          <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Coming back on">
          <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="form-actions">
        <button className="btn primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

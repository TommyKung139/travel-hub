'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { errMsg, getTrip, updateTrip } from '@/lib/db';
import { useRequireAuth } from '@/components/AuthProvider';
import { useT } from '@/components/LanguageProvider';
import Field from '@/components/Field';
import AirportInput from '@/components/AirportInput';
import FlightsTab from '@/components/trip/FlightsTab';
import HotelsTab from '@/components/trip/HotelsTab';
import PlacesTab from '@/components/trip/PlacesTab';
import ChecklistTab from '@/components/trip/ChecklistTab';
import TeamTab from '@/components/trip/TeamTab';
import { fmtRange, nights } from '@/lib/format';
import type { Key } from '@/lib/i18n';
import type { Trip } from '@/lib/types';

type TabId = 'flights' | 'hotels' | 'places' | 'checklist' | 'team';

const TABS: { id: TabId; label: Key }[] = [
  { id: 'flights', label: 'tab.flights' },
  { id: 'hotels', label: 'tab.hotels' },
  { id: 'places', label: 'tab.places' },
  { id: 'checklist', label: 'tab.checklist' },
  { id: 'team', label: 'tab.team' },
];

export default function TripPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useRequireAuth();
  const { t } = useT();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [errorKey, setErrorKey] = useState<'notFound' | ''>('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabId>('flights');
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      const found = await getTrip(id);
      if (!found) setErrorKey('notFound');
      else setTrip(found);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading || !user) return <p className="muted">{t('common.loading')}</p>;
  if (error || errorKey)
    return (
      <div className="card">
        <div className="error">{errorKey === 'notFound' ? t('trip.notFound') : error}</div>
        <Link href="/trips" className="btn">
          {t('trip.back')}
        </Link>
      </div>
    );
  if (!trip) return <p className="muted">{t('trip.loadingTrip')}</p>;

  const n = nights(trip.start_date, trip.end_date);

  return (
    <>
      <Link href="/trips" className="muted small">
        {t('trip.back')}
      </Link>
      <div className="card-head" style={{ marginTop: '0.4rem' }}>
        <div>
          <h1 style={{ marginBottom: 2 }}>{trip.name}</h1>
          <div className="muted">
            {trip.origin ? `${trip.origin} → ` : ''}
            {trip.destination}
            {trip.destination_code ? ` (${trip.destination_code})` : ''} ·{' '}
            {fmtRange(trip.start_date, trip.end_date, t('date.notSet'))}
            {n ? ` · ${t('common.nights', { n })}` : ''}
          </div>
        </div>
        <button className="btn small" onClick={() => setEditing((e) => !e)}>
          {editing ? t('common.close') : t('trip.edit')}
        </button>
      </div>

      {editing && (
        <EditTrip
          trip={trip}
          onSaved={(updated) => {
            setTrip(updated);
            setEditing(false);
          }}
        />
      )}

      <div className="tabs" role="tablist">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            className={`tab ${tab === tb.id ? 'active' : ''}`}
            onClick={() => setTab(tb.id)}
          >
            {t(tb.label)}
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
  const { t } = useT();
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
        <Field label={t('trips.name')}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label={t('trip.dest')}>
          <input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} required />
        </Field>
        <Field label={t('trip.flyFrom')}>
          <AirportInput value={origin} onChange={setOrigin} />
        </Field>
        <Field label={t('trip.flyTo')}>
          <AirportInput value={destCode} onChange={setDestCode} placeholder="NRT" />
        </Field>
        <Field label={t('trips.leaving')}>
          <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label={t('trips.returning')}>
          <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="form-actions">
        <button className="btn primary" disabled={busy}>
          {busy ? t('common.saving') : t('trip.save')}
        </button>
      </div>
    </form>
  );
}

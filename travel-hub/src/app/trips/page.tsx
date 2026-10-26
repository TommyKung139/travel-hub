'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createTrip, errMsg, joinTripByCode, listMyTrips } from '@/lib/db';
import { useRequireAuth } from '@/components/AuthProvider';
import { useT } from '@/components/LanguageProvider';
import Field from '@/components/Field';
import AirportInput from '@/components/AirportInput';
import { fmtRange } from '@/lib/format';
import type { Trip } from '@/lib/types';

export default function TripsPage() {
  const { user, displayName, loading } = useRequireAuth();
  const { t } = useT();
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

  if (loading || !user) return <p className="muted">{t('common.loading')}</p>;

  return (
    <>
      <div className="spread">
        <h1>{t('trips.title')}</h1>
        <button className="btn primary" onClick={() => setShowCreate((s) => !s)}>
          {showCreate ? t('common.cancel') : t('trips.new')}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showCreate && (
        <form className="card" onSubmit={create}>
          <h2>{t('trips.startPlanning')}</h2>
          <div className="form-grid">
            <Field label={t('trips.name')}>
              <input
                className="input"
                placeholder={t('trips.namePh')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field label={t('trips.where')}>
              <input
                className="input"
                placeholder={t('trips.wherePh')}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </Field>
            <Field label={t('trips.from')} hint={t('trips.fromHint')}>
              <AirportInput value={origin} onChange={setOrigin} />
            </Field>
            <Field label={t('trips.to')} hint={t('trips.toHint')}>
              <AirportInput value={destCode} onChange={setDestCode} placeholder="NRT" />
            </Field>
            <Field label={t('trips.leaving')}>
              <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label={t('trips.returning')}>
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
              {creating ? t('trips.creating') : t('trips.create')}
            </button>
            <span className="muted small">{t('trips.codeNote')}</span>
          </div>
        </form>
      )}

      <form className="card flat" onSubmit={join}>
        <div className="spread">
          <div>
            <h3>{t('trips.joinTitle')}</h3>
            <span className="muted small">{t('trips.joinSub')}</span>
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
              {joining ? t('trips.joining') : t('trips.join')}
            </button>
          </div>
        </div>
      </form>

      {trips === null ? (
        <p className="muted">{t('trips.loading')}</p>
      ) : trips.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>{t('trips.empty')}</p>
        </div>
      ) : (
        trips.map((trip) => (
          <Link key={trip.id} href={`/trips/${trip.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <div className="card-head">
                <div>
                  <h2 style={{ marginBottom: 2 }}>{trip.name}</h2>
                  <div className="muted">
                    {trip.origin ? `${trip.origin} → ` : ''}
                    {trip.destination}
                    {trip.destination_code ? ` (${trip.destination_code})` : ''}
                  </div>
                </div>
                <span className="badge">{fmtRange(trip.start_date, trip.end_date, t('date.notSet'))}</span>
              </div>
            </div>
          </Link>
        ))
      )}
    </>
  );
}

'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { addSub, errMsg, listSub, removeSub } from '@/lib/db';
import { useAuth } from '@/components/AuthProvider';
import { useT } from '@/components/LanguageProvider';
import Field from '@/components/Field';
import AirportInput from '@/components/AirportInput';
import LinkGrid from '@/components/LinkGrid';
import { flightLinks, trackLinks } from '@/lib/links';
import { fmtDate, fmtDateTime, fmtDuration, fmtMoney } from '@/lib/format';
import type { EndPoint, FareOffer, FareSearchResult, Flight, TrackResult, Trip } from '@/lib/types';

type Draft = {
  airline: string;
  flight_number: string;
  flight_date: string;
  origin: string;
  destination: string;
  booking_ref: string;
  ticket_number: string;
  price: string;
  currency: string;
  notes: string;
};

const EMPTY: Draft = {
  airline: '',
  flight_number: '',
  flight_date: '',
  origin: '',
  destination: '',
  booking_ref: '',
  ticket_number: '',
  price: '',
  currency: 'USD',
  notes: '',
};

const CURRENCIES = ['USD', 'TWD', 'EUR', 'JPY', 'KRW', 'GBP', 'HKD', 'SGD', 'AUD', 'CAD'];

export default function FlightsTab({ trip }: { trip: Trip }) {
  const { user, displayName, getToken } = useAuth();
  const { t, lang } = useT();

  // ── search state ──
  const [origin, setOrigin] = useState(trip.origin ?? '');
  const [dest, setDest] = useState(trip.destination_code ?? '');
  const [depart, setDepart] = useState(trip.start_date ?? '');
  const [ret, setRet] = useState(trip.end_date ?? '');
  const [oneWay, setOneWay] = useState(false);
  const [adults, setAdults] = useState(1);
  const [currency, setCurrency] = useState('USD');
  const [searching, setSearching] = useState(false);
  const [fares, setFares] = useState<FareSearchResult | null>(null);

  // ── booked flights ──
  const [flights, setFlights] = useState<Flight[] | null>(null);
  const [draft, setDraft] = useState<Draft>({
    ...EMPTY,
    origin: trip.origin ?? '',
    destination: trip.destination_code ?? '',
    flight_date: trip.start_date ?? '',
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState<Record<string, TrackResult | 'loading'>>({});

  const load = useCallback(async () => {
    try {
      const list = await listSub<Flight>(trip.id, 'flights');
      setFlights(list.sort((a, b) => a.flight_date.localeCompare(b.flight_date)));
    } catch (e) {
      setError(errMsg(e));
    }
  }, [trip.id]);

  useEffect(() => {
    load();
  }, [load]);

  const links = flightLinks({
    origin,
    dest,
    depart,
    ret: oneWay ? undefined : ret || undefined,
    adults,
    lang,
  });

  async function searchFares() {
    const token = await getToken();
    if (!token) return;
    setSearching(true);
    setFares(null);
    const qs = new URLSearchParams({
      origin,
      dest,
      depart,
      adults: String(adults),
      currency,
      lang,
    });
    if (!oneWay && ret) qs.set('return', ret);
    try {
      const res = await fetch(`/api/flights/search?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFares((await res.json()) as FareSearchResult);
    } catch {
      setFares({ configured: true, offers: [], error: t('fl.searchUnreachable') });
    }
    setSearching(false);
  }

  function useOffer(o: FareOffer) {
    const first = o.legs[0];
    const last = o.legs[o.legs.length - 1];
    setDraft({
      ...EMPTY,
      airline: first.airline,
      flight_number: first.flightNumber.replace(/\s+/g, ''),
      flight_date: first.dep.slice(0, 10) || depart,
      origin: first.from,
      destination: last.to,
      price: String(o.price),
      currency: o.currency,
    });
    setShowForm(true);
    setTimeout(() => document.getElementById('add-flight')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await addSub(trip.id, 'flights', user, displayName, {
        airline: draft.airline.trim() || null,
        flight_number: draft.flight_number.replace(/\s+/g, '').toUpperCase(),
        flight_date: draft.flight_date,
        origin: draft.origin || null,
        destination: draft.destination || null,
        booking_ref: draft.booking_ref.trim() || null,
        ticket_number: draft.ticket_number.trim() || null,
        price: draft.price ? Number(draft.price) : null,
        currency: draft.price ? draft.currency : null,
        notes: draft.notes.trim() || null,
      });
      setDraft({ ...EMPTY, origin: trip.origin ?? '', destination: trip.destination_code ?? '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm(t('fl.confirmRemove'))) return;
    try {
      await removeSub(trip.id, 'flights', id);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function track(f: Flight) {
    const token = await getToken();
    if (!token) return;
    setTracking((s) => ({ ...s, [f.id]: 'loading' }));
    try {
      const res = await fetch(
        `/api/flights/track?flight=${encodeURIComponent(f.flight_number)}&date=${f.flight_date}&lang=${lang}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = (await res.json()) as TrackResult;
      setTracking((s) => ({ ...s, [f.id]: json }));
    } catch {
      setTracking((s) => ({
        ...s,
        [f.id]: { configured: true, found: false, error: t('fl.trackUnreachable') },
      }));
    }
  }

  const set = (k: keyof Draft) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const canSearch = origin.length === 3 && dest.length === 3 && !!depart;

  return (
    <>
      {/* ───── Find flights ───── */}
      <div className="card">
        <h2>{t('fl.findTitle')}</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          {t('fl.findSub')}
        </p>
        <div className="form-grid">
          <Field label={t('fl.from')}>
            <AirportInput value={origin} onChange={setOrigin} required />
          </Field>
          <Field label={t('fl.to')}>
            <AirportInput value={dest} onChange={setDest} placeholder="NRT" required />
          </Field>
          <Field label={t('fl.depart')}>
            <input className="input" type="date" value={depart} onChange={(e) => setDepart(e.target.value)} />
          </Field>
          <Field label={t('fl.return')}>
            <input
              className="input"
              type="date"
              value={ret}
              min={depart || undefined}
              disabled={oneWay}
              onChange={(e) => setRet(e.target.value)}
            />
          </Field>
          <Field label={t('fl.travelers')}>
            <input
              className="input"
              type="number"
              min={1}
              max={9}
              value={adults}
              onChange={(e) => setAdults(Math.max(1, Math.min(9, Number(e.target.value) || 1)))}
            />
          </Field>
          <Field label={t('fl.currency')}>
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <label className="check" style={{ marginTop: '0.4rem' }}>
          <input type="checkbox" checked={oneWay} onChange={(e) => setOneWay(e.target.checked)} />
          <span>{t('fl.oneWay')}</span>
        </label>

        <h3 style={{ marginTop: '0.8rem' }}>{t('fl.compareOn')}</h3>
        <LinkGrid links={links} empty={t('fl.linksEmpty')} />

        <div className="form-actions">
          <button className="btn primary" disabled={!canSearch || searching} onClick={searchFares}>
            {searching ? t('fl.searching') : t('fl.showPrices')}
          </button>
          <span className="muted small">{t('fl.quotaNote')}</span>
        </div>

        {fares && <FareResults result={fares} onUse={useOffer} />}
      </div>

      {/* ───── Booked flights ───── */}
      <div className="card" id="add-flight">
        <div className="spread">
          <div>
            <h2>{t('fl.bookedTitle')}</h2>
            <span className="muted small">{t('fl.bookedSub')}</span>
          </div>
          <button className="btn primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? t('common.cancel') : t('fl.addBtn')}
          </button>
        </div>

        {showForm && (
          <form onSubmit={save} style={{ marginTop: '1rem' }}>
            <div className="form-grid">
              <Field label={t('fl.flightNo')} hint={t('fl.flightNoHint')}>
                <input
                  className="input"
                  value={draft.flight_number}
                  onChange={(e) => set('flight_number')(e.target.value.toUpperCase())}
                  placeholder="CI100"
                  required
                />
              </Field>
              <Field label={t('fl.flightDate')}>
                <input
                  className="input"
                  type="date"
                  value={draft.flight_date}
                  onChange={(e) => set('flight_date')(e.target.value)}
                  required
                />
              </Field>
              <Field label={t('fl.airline')}>
                <input
                  className="input"
                  value={draft.airline}
                  onChange={(e) => set('airline')(e.target.value)}
                  placeholder={t('fl.airlinePh')}
                />
              </Field>
              <Field label={t('fl.from')}>
                <AirportInput value={draft.origin} onChange={set('origin')} />
              </Field>
              <Field label={t('fl.to')}>
                <AirportInput value={draft.destination} onChange={set('destination')} placeholder="NRT" />
              </Field>
              <Field label={t('fl.pnr')} hint={t('fl.pnrHint')}>
                <input
                  className="input"
                  value={draft.booking_ref}
                  onChange={(e) => set('booking_ref')(e.target.value.toUpperCase())}
                />
              </Field>
              <Field label={t('fl.ticketNo')} hint={t('fl.ticketNoHint')}>
                <input className="input" value={draft.ticket_number} onChange={(e) => set('ticket_number')(e.target.value)} />
              </Field>
              <Field label={t('fl.pricePaid')}>
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step="any"
                    value={draft.price}
                    onChange={(e) => set('price')(e.target.value)}
                  />
                  <select
                    className="input"
                    style={{ width: 90 }}
                    value={draft.currency}
                    onChange={(e) => set('currency')(e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </Field>
              <div className="span-all">
                <Field label={t('fl.notes')}>
                  <textarea
                    className="input"
                    value={draft.notes}
                    onChange={(e) => set('notes')(e.target.value)}
                    placeholder={t('fl.notesPh')}
                  />
                </Field>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn primary" disabled={saving}>
                {saving ? t('common.saving') : t('fl.save')}
              </button>
            </div>
          </form>
        )}

        {error && <div className="error">{error}</div>}

        <div style={{ marginTop: '1rem' }}>
          {flights === null ? (
            <p className="muted">{t('common.loading')}</p>
          ) : flights.length === 0 ? (
            <p className="muted">{t('fl.none')}</p>
          ) : (
            <ul className="item-list">
              {flights.map((f) => (
                <FlightCard
                  key={f.id}
                  f={f}
                  state={tracking[f.id]}
                  onTrack={() => track(f)}
                  onRemove={() => remove(f.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function FareResults({ result, onUse }: { result: FareSearchResult; onUse: (o: FareOffer) => void }) {
  const { t, tOr } = useT();
  if (!result.configured) return <div className="notice">{result.note}</div>;
  if (result.error) return <div className="error">{result.error}</div>;
  if (!result.offers.length) return <div className="notice">{t('fl.noFares')}</div>;

  const ins = result.insights;
  const cur = result.offers[0]?.currency;
  return (
    <div style={{ marginTop: '1rem' }}>
      <h3>{t('fl.liveTitle')}</h3>
      {ins?.lowest != null && (
        <p className="muted small" style={{ marginTop: 0 }}>
          {t('fl.lowest', { price: fmtMoney(ins.lowest, cur) })}
          {ins.level ? t('fl.level', { level: tOr(`lvl.${ins.level}`, ins.level) }) : ''}
          {ins.typicalLow != null && ins.typicalHigh != null
            ? t('fl.typical', { low: fmtMoney(ins.typicalLow, cur), high: fmtMoney(ins.typicalHigh, cur) })
            : ''}
        </p>
      )}
      {result.note && <p className="muted small">{result.note}</p>}
      {result.offers.map((o, i) => (
        <div className="offer" key={i}>
          <div>
            <strong>{[...new Set(o.legs.map((l) => l.airline))].join(' + ')}</strong>{' '}
            <span className="muted">{o.legs.map((l) => l.flightNumber).join(', ')}</span>
            <div className="small">
              {o.legs[0].from} {o.legs[0].dep.slice(11)} → {o.legs[o.legs.length - 1].to}{' '}
              {o.legs[o.legs.length - 1].arr.slice(11)}
            </div>
            <div className="muted small">
              {fmtDuration(o.totalDuration)} ·{' '}
              {o.stops === 0 ? t('fl.nonstop') : o.stops === 1 ? t('fl.stopOne') : t('fl.stopMany', { n: o.stops })}
            </div>
          </div>
          <div>
            <div className="price">{fmtMoney(o.price, o.currency)}</div>
            <button className="btn small" onClick={() => onUse(o)}>
              {t('fl.useFlight')}
            </button>
          </div>
        </div>
      ))}
      <p className="muted small">{t('fl.bookHint')}</p>
    </div>
  );
}

function FlightCard({
  f,
  state,
  onTrack,
  onRemove,
}: {
  f: Flight;
  state: TrackResult | 'loading' | undefined;
  onTrack: () => void;
  onRemove: () => void;
}) {
  const { t } = useT();
  return (
    <li className="item">
      <div className="spread">
        <div>
          <div className="item-title">
            {f.flight_number}
            {f.airline ? ` · ${f.airline}` : ''}
          </div>
          <div>
            {f.origin ?? '?'} → {f.destination ?? '?'} · {fmtDate(f.flight_date)}
          </div>
          <div className="muted small">
            {f.booking_ref && <>{t('fl.bookingRef', { ref: f.booking_ref })} · </>}
            {f.ticket_number && <>{t('fl.ticket', { no: f.ticket_number })} · </>}
            {f.price != null && <>{fmtMoney(f.price, f.currency)} · </>}
            {t('common.addedBy', { name: f.added_by_name ?? t('common.someone') })}
          </div>
          {f.notes && <div className="small" style={{ marginTop: 4 }}>{f.notes}</div>}
        </div>
        <div className="row">
          <button className="btn small primary" onClick={onTrack} disabled={state === 'loading'}>
            {state === 'loading' ? t('fl.checking') : t('fl.track')}
          </button>
          <button className="btn small danger" onClick={onRemove}>
            {t('common.remove')}
          </button>
        </div>
      </div>
      {state && state !== 'loading' && <TrackPanel r={state} flightNumber={f.flight_number} />}
    </li>
  );
}

function TrackPanel({ r, flightNumber }: { r: TrackResult; flightNumber: string }) {
  const { t, tOr, lang } = useT();
  const f = r.flight;
  const statusClass =
    f && ['cancelled', 'diverted', 'incident'].includes(f.status)
      ? 'bad'
      : f && ['active', 'landed'].includes(f.status)
        ? ''
        : 'warn';
  return (
    <div style={{ marginTop: '0.8rem', borderTop: '1px solid var(--line)', paddingTop: '0.8rem' }}>
      {r.error && <div className="error">{r.error}</div>}
      {r.note && <div className="notice">{r.note}</div>}
      {f && (
        <>
          <div className="row">
            <span className={`badge ${statusClass}`}>{tOr(`st.${f.status}`, f.status)}</span>
            <span className="muted small">
              {f.airline} {f.flightIata} · {f.flightDate}
            </span>
          </div>
          <div className="status-grid">
            <Endpoint title={t('fl.dep')} p={f.departure} />
            <Endpoint title={t('fl.arr')} p={f.arrival} />
          </div>
          {f.live && (
            <p className="small muted">
              {f.live.onGround
                ? t('fl.onGround')
                : t('fl.inAir', { alt: Math.round(f.live.altitude), speed: Math.round(f.live.speed) })}{' '}
              ·{' '}
              <a
                href={`https://www.google.com/maps?q=${f.live.lat},${f.live.lon}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('fl.mapPos')}
              </a>
            </p>
          )}
        </>
      )}
      <p className="small muted" style={{ marginBottom: 4 }}>
        {t('fl.crossCheck')}
      </p>
      <LinkGrid links={trackLinks(flightNumber, lang)} />
    </div>
  );
}

function Endpoint({ title, p }: { title: string; p: EndPoint }) {
  const { t } = useT();
  return (
    <div>
      <div className="item-title">
        {title}: {p.iata || '—'}
      </div>
      <div className="small muted">{p.airport}</div>
      <div className="small">
        {t('fl.scheduled', { t: fmtDateTime(p.scheduled) })}
        {p.estimated && p.estimated !== p.scheduled ? <> · {t('fl.estimated', { t: fmtDateTime(p.estimated) })}</> : null}
        {p.actual ? <> · {t('fl.actual', { t: fmtDateTime(p.actual) })}</> : null}
      </div>
      <div className="small">
        {p.terminal ? t('fl.terminal', { x: p.terminal }) : ''}
        {p.terminal && p.gate ? ' · ' : ''}
        {p.gate ? t('fl.gate', { x: p.gate }) : ''}
        {p.delay ? ` · ${t('fl.delay', { n: p.delay })}` : ''}
      </div>
    </div>
  );
}

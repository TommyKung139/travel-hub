'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { errMsg, listSub, loadItinerary, saveItinerary } from '@/lib/db';
import { useAuth } from '@/components/AuthProvider';
import { useT } from '@/components/LanguageProvider';
import Field from '@/components/Field';
import { directionsLink, mapsLink } from '@/lib/links';
import { fmtDate, fmtDateTime } from '@/lib/format';
import type { Key } from '@/lib/i18n';
import type {
  Flight,
  Hotel,
  ItinDay,
  ItinItem,
  ItinKind,
  ItinSettings,
  Itinerary,
  Place,
  TravelMode,
  Trip,
} from '@/lib/types';

const DEFAULT_SETTINGS: ItinSettings = {
  pace: 'balanced',
  day_start: '09:00',
  day_end: '21:00',
  arrival_time: '',
  departure_time: '',
  wishes: '',
};

const KIND_ICON: Record<ItinKind, string> = {
  place: '📍',
  meal: '🍽',
  transit: '🚆',
  hotel: '🏨',
  flight: '✈',
  free: '☕',
  other: '▫',
};
const KIND_LABEL: Record<ItinKind, Key> = {
  place: 'ik.place',
  meal: 'ik.meal',
  transit: 'ik.transit',
  hotel: 'ik.hotel',
  flight: 'ik.flight',
  free: 'ik.free',
  other: 'ik.other',
};
const KINDS = Object.keys(KIND_ICON) as ItinKind[];
const MODE_ICON: Record<string, string> = { walk: '🚶', transit: '🚇', drive: '🚗' };
const MODE_LABEL: Record<string, Key> = { walk: 'it.modeWalk', transit: 'it.modeTransit', drive: 'it.modeDrive' };

const newId = () => `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function endTime(time: string, dur: number): string {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m || !dur) return '';
  const total = (Number(m[1]) * 60 + Number(m[2]) + dur) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function ItineraryTab({ trip }: { trip: Trip }) {
  const { user, displayName, getToken } = useAuth();
  const { t, lang } = useT();

  const [plan, setPlan] = useState<Itinerary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [settings, setSettings] = useState<ItinSettings>(DEFAULT_SETTINGS);
  const [showGen, setShowGen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // The latest plan lives in a ref too, so the delayed save never uses a stale copy.
  const planRef = useRef<Itinerary | null>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, f, h, pl] = await Promise.all([
        loadItinerary(trip.id),
        listSub<Flight>(trip.id, 'flights'),
        listSub<Hotel>(trip.id, 'hotels'),
        listSub<Place>(trip.id, 'places'),
      ]);
      planRef.current = p;
      dirty.current = false;
      setPlan(p);
      if (p?.settings) setSettings({ ...DEFAULT_SETTINGS, ...p.settings });
      setFlights(f.sort((a, b) => a.flight_date.localeCompare(b.flight_date)));
      setHotels(h.sort((a, b) => (a.check_in ?? '9999').localeCompare(b.check_in ?? '9999')));
      setPlaces(pl);
      setSaveState('idle');
    } catch (e) {
      setError(errMsg(e));
    }
    setLoaded(true);
  }, [trip.id]);

  useEffect(() => {
    load();
  }, [load]);

  const flush = useCallback(async () => {
    if (!dirty.current || !planRef.current || !user) return;
    dirty.current = false;
    setSaveState('saving');
    try {
      await saveItinerary(trip.id, user.uid, planRef.current);
      setSaveState('saved');
    } catch (e) {
      dirty.current = true;
      setSaveState('error');
      setError(errMsg(e));
    }
  }, [trip.id, user]);

  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      flushRef.current(); // don't lose an edit made in the last second
    },
    []
  );

  function edit(fn: (p: Itinerary) => Itinerary) {
    const cur = planRef.current;
    if (!cur) return;
    const next = fn(cur);
    planRef.current = next;
    setPlan(next);
    dirty.current = true;
    setSaveState('idle');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flushRef.current(), 900);
  }

  async function generate() {
    if (plan && !confirm(t('it.confirmRegen'))) return;
    const token = await getToken();
    if (!token || !user) return;
    setGenerating(true);
    setError('');
    setNote('');
    try {
      const res = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lang,
          trip: {
            name: trip.name,
            destination: trip.destination,
            start_date: trip.start_date,
            end_date: trip.end_date,
          },
          flights: flights.map((f) => ({
            flight_number: f.flight_number,
            flight_date: f.flight_date,
            origin: f.origin,
            destination: f.destination,
            airline: f.airline,
          })),
          hotels: hotels.map((h) => ({ name: h.name, address: h.address, check_in: h.check_in, check_out: h.check_out })),
          places: places.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            address: p.address,
            planned_date: p.planned_date,
            notes: p.notes,
            added_by_name: p.added_by_name,
          })),
          settings,
        }),
      });
      const json = (await res.json()) as { configured?: boolean; note?: string; error?: string; itinerary?: Itinerary };
      if (json.error) setError(json.error);
      else if (json.configured === false) setNote(json.note ?? '');
      else if (json.itinerary) {
        const next: Itinerary = { ...json.itinerary, generated_by: displayName };
        planRef.current = next;
        setPlan(next);
        setShowGen(false);
        dirty.current = true;
        await flush();
      }
    } catch {
      setError(t('srv.cantReachAi'));
    }
    setGenerating(false);
  }

  // ── edit helpers ──
  const mapDay = (dayId: string, fn: (d: ItinDay) => ItinDay) =>
    edit((p) => ({ ...p, days: p.days.map((d) => (d.id === dayId ? fn(d) : d)) }));

  const updItem = (dayId: string, itemId: string, patch: Partial<ItinItem>) =>
    mapDay(dayId, (d) => ({ ...d, items: d.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }));

  const delItem = (dayId: string, itemId: string) =>
    mapDay(dayId, (d) => ({ ...d, items: d.items.filter((i) => i.id !== itemId) }));

  const shift = (dayId: string, itemId: string, dir: -1 | 1) =>
    mapDay(dayId, (d) => {
      const items = [...d.items];
      const at = items.findIndex((i) => i.id === itemId);
      const to = at + dir;
      if (at < 0 || to < 0 || to >= items.length) return d;
      [items[at], items[to]] = [items[to], items[at]];
      return { ...d, items };
    });

  const blank = (): ItinItem => ({
    id: newId(),
    time: '',
    title: '',
    kind: 'other',
    place_id: null,
    address: '',
    duration_min: 60,
    travel_min: 0,
    travel_mode: '',
    distance_km: 0,
    notes: '',
  });

  const addStop = (dayId: string): string => {
    const item = blank();
    mapDay(dayId, (d) => ({ ...d, items: [...d.items, item] }));
    return item.id;
  };

  const sortDay = (dayId: string) =>
    mapDay(dayId, (d) => ({
      ...d,
      items: d.items
        .map((i, n) => ({ i, n }))
        .sort((a, b) => (a.i.time || '99:99').localeCompare(b.i.time || '99:99') || a.n - b.n)
        .map((x) => x.i),
    }));

  const moveToDay = (fromDay: string, itemId: string, toDay: string) => {
    if (fromDay === toDay) return;
    edit((p) => {
      const item = p.days.find((d) => d.id === fromDay)?.items.find((i) => i.id === itemId);
      if (!item) return p;
      return {
        ...p,
        days: p.days.map((d) =>
          d.id === fromDay
            ? { ...d, items: d.items.filter((i) => i.id !== itemId) }
            : d.id === toDay
              ? { ...d, items: [...d.items, { ...item, travel_min: 0, distance_km: 0, travel_mode: '' as TravelMode }] }
              : d
        ),
      };
    });
  };

  const scheduleLeftover = (unId: string, dayId: string) =>
    edit((p) => {
      const u = p.unscheduled.find((x) => x.id === unId);
      if (!u) return p;
      const item: ItinItem = { ...blank(), title: u.title, kind: 'place', place_id: u.place_id, address: u.address, duration_min: 90 };
      return {
        ...p,
        unscheduled: p.unscheduled.filter((x) => x.id !== unId),
        days: p.days.map((d) => (d.id === dayId ? { ...d, items: [...d.items, item] } : d)),
      };
    });

  const dismissLeftover = (unId: string) =>
    edit((p) => ({ ...p, unscheduled: p.unscheduled.filter((x) => x.id !== unId) }));

  const hotelFor = (date: string): Hotel | null => {
    if (!hotels.length) return null;
    return (
      hotels.find((h) => h.check_in && h.check_out && h.check_in <= date && date < h.check_out) ??
      [...hotels].reverse().find((h) => h.check_in && h.check_in <= date) ??
      hotels[0]
    );
  };

  // ── render ──
  if (!loaded) return <p className="muted">{t('common.loading')}</p>;

  const hasDates = !!trip.start_date && !!trip.end_date && trip.start_date <= trip.end_date;
  const canGenerate = hasDates && places.length > 0 && !generating;
  const set = <K extends keyof ItinSettings>(k: K) => (v: ItinSettings[K]) => setSettings((s) => ({ ...s, [k]: v }));

  const generator = (
    <div className="card">
      <h2>{plan ? t('it.regenTitle') : t('it.genTitle')}</h2>
      {!plan && (
        <p className="muted small" style={{ marginTop: 0 }}>
          {t('it.genSub')}
        </p>
      )}
      <p className="small">{t('it.using', { f: flights.length, h: hotels.length, p: places.length })}</p>
      {!hasDates && <div className="notice">{t('it.needDates')}</div>}
      {places.length === 0 && <div className="notice">{t('it.needPlaces')}</div>}
      {hotels.length === 0 && <div className="notice">{t('it.noHotel')}</div>}

      <div className="form-grid">
        <Field label={t('it.pace')}>
          <select className="input" value={settings.pace} onChange={(e) => set('pace')(e.target.value as ItinSettings['pace'])}>
            <option value="relaxed">{t('it.paceRelaxed')}</option>
            <option value="balanced">{t('it.paceBalanced')}</option>
            <option value="packed">{t('it.pacePacked')}</option>
          </select>
        </Field>
        <Field label={t('it.dayStart')}>
          <input className="input" type="time" value={settings.day_start} onChange={(e) => set('day_start')(e.target.value)} />
        </Field>
        <Field label={t('it.dayEnd')}>
          <input className="input" type="time" value={settings.day_end} onChange={(e) => set('day_end')(e.target.value)} />
        </Field>
        <Field label={t('it.arrival')} hint={t('it.arrivalHint')}>
          <input className="input" type="time" value={settings.arrival_time} onChange={(e) => set('arrival_time')(e.target.value)} />
        </Field>
        <Field label={t('it.departure')} hint={t('it.departureHint')}>
          <input className="input" type="time" value={settings.departure_time} onChange={(e) => set('departure_time')(e.target.value)} />
        </Field>
        <div className="span-all">
          <Field label={t('it.wishes')}>
            <textarea
              className="input"
              value={settings.wishes}
              onChange={(e) => set('wishes')(e.target.value)}
              placeholder={t('it.wishesPh')}
            />
          </Field>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {note && <div className="notice">{note}</div>}
      <div className="form-actions">
        <button className="btn primary" disabled={!canGenerate} onClick={generate}>
          {generating ? t('it.generating') : plan ? t('it.regenerate') : t('it.generate')}
        </button>
        {plan && (
          <button className="btn" disabled={generating} onClick={() => setShowGen(false)}>
            {t('common.cancel')}
          </button>
        )}
      </div>
    </div>
  );

  if (!plan) return generator;

  return (
    <>
      <div className="card">
        <div className="spread">
          <h2 style={{ marginBottom: 0 }}>{t('it.title')}</h2>
          <div className="row">
            <span className="muted small" aria-live="polite">
              {saveState === 'saving' && t('it.savingNow')}
              {saveState === 'saved' && t('it.saved')}
              {saveState === 'error' && t('it.saveFail')}
            </span>
            <button className="btn small" onClick={load}>
              {t('it.reload')}
            </button>
            <button className="btn small" onClick={() => setShowGen((s) => !s)}>
              {t('it.regenerate')}
            </button>
          </div>
        </div>
        {plan.summary && <p style={{ marginBottom: 6 }}>{plan.summary}</p>}
        <div className="muted small">
          {t('it.byAt', { name: plan.generated_by || '?', when: fmtDateTime(plan.generated_at) })}
        </div>
        {plan.warnings.length > 0 && (
          <ul className="small" style={{ margin: '0.6rem 0 0', paddingLeft: '1.2rem' }}>
            {plan.warnings.map((w, n) => (
              <li key={n}>{w}</li>
            ))}
          </ul>
        )}
        <div className="notice" style={{ marginTop: '0.7rem' }}>
          {t('it.aiNote')}
        </div>
        {error && !showGen && <div className="error">{error}</div>}
      </div>

      {showGen && generator}

      {plan.days.map((day, di) => (
        <DayCard
          key={day.id}
          day={day}
          index={di}
          days={plan.days}
          hotel={hotelFor(day.date)}
          trip={trip}
          onTitle={(v) => mapDay(day.id, (d) => ({ ...d, title: v }))}
          onSort={() => sortDay(day.id)}
          onAdd={() => addStop(day.id)}
          onUpdate={(itemId, patch) => updItem(day.id, itemId, patch)}
          onDelete={(itemId) => delItem(day.id, itemId)}
          onShift={(itemId, dir) => shift(day.id, itemId, dir)}
          onMove={(itemId, toDay) => moveToDay(day.id, itemId, toDay)}
        />
      ))}

      {plan.unscheduled.length > 0 && (
        <div className="card">
          <h2>{t('it.unTitle')}</h2>
          <p className="muted small" style={{ marginTop: 0 }}>
            {t('it.unSub')}
          </p>
          <ul className="item-list">
            {plan.unscheduled.map((u) => (
              <li className="item" key={u.id}>
                <div className="spread">
                  <div>
                    <div className="item-title">{u.title}</div>
                    {u.reason && <div className="small muted">{u.reason}</div>}
                  </div>
                  <div className="row">
                    <select
                      className="input"
                      style={{ width: 'auto' }}
                      value=""
                      onChange={(e) => e.target.value && scheduleLeftover(u.id, e.target.value)}
                    >
                      <option value="">{t('it.addTo')}</option>
                      {plan.days.map((d, n) => (
                        <option key={d.id} value={d.id}>
                          {t('it.day', { n: n + 1 })} · {fmtDate(d.date)}
                        </option>
                      ))}
                    </select>
                    <button className="btn small" onClick={() => dismissLeftover(u.id)}>
                      {t('it.dismiss')}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function DayCard({
  day,
  index,
  days,
  hotel,
  trip,
  onTitle,
  onSort,
  onAdd,
  onUpdate,
  onDelete,
  onShift,
  onMove,
}: {
  day: ItinDay;
  index: number;
  days: ItinDay[];
  hotel: Hotel | null;
  trip: Trip;
  onTitle: (v: string) => void;
  onSort: () => void;
  onAdd: () => string;
  onUpdate: (itemId: string, patch: Partial<ItinItem>) => void;
  onDelete: (itemId: string) => void;
  onShift: (itemId: string, dir: -1 | 1) => void;
  onMove: (itemId: string, toDay: string) => void;
}) {
  const { t, lang } = useT();
  const [open, setOpen] = useState<string | null>(null);

  const hotelPlace = hotel ? (hotel.address ? `${hotel.name} ${hotel.address}` : `${hotel.name} ${trip.destination}`) : '';
  const placeQuery = (i: ItinItem) => `${i.title} ${i.address || trip.destination}`;

  return (
    <div className="card">
      <div className="spread" style={{ marginBottom: '0.6rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="muted small">
            {t('it.day', { n: index + 1 })} · {fmtDate(day.date)}
          </div>
          <input
            className="input"
            style={{ fontWeight: 700, marginTop: 4 }}
            value={day.title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder={t('it.dayTitlePh')}
          />
        </div>
        <div className="row">
          <button className="btn small" onClick={onSort}>
            {t('it.sortTime')}
          </button>
          <button
            className="btn small primary"
            onClick={() => {
              setOpen(onAdd());
            }}
          >
            {t('it.addStop')}
          </button>
        </div>
      </div>

      {hotel && (
        <div className="muted small" style={{ marginBottom: '0.5rem' }}>
          🏨 {hotel.name}
        </div>
      )}

      {day.items.length === 0 ? (
        <p className="muted">{t('it.noStops')}</p>
      ) : (
        <ul className="item-list">
          {day.items.map((it, n) => {
            const from = n === 0 ? hotelPlace : placeQuery(day.items[n - 1]);
            const to = placeQuery(it);
            const expanded = open === it.id;
            const end = endTime(it.time, it.duration_min);
            return (
              <li key={it.id}>
                {it.travel_min > 0 && from && (
                  <div className="muted small" style={{ margin: '0.1rem 0 0.35rem 0.4rem' }}>
                    ↳ {MODE_ICON[it.travel_mode] ?? '🚇'}{' '}
                    {it.travel_mode ? t(MODE_LABEL[it.travel_mode]) : t('it.travel')} ~{it.travel_min} {t('it.min')}
                    {it.distance_km > 0 ? ` · ~${it.distance_km} km` : ''}
                    {n === 0 ? ` · ${t('it.fromHotel')}` : ''} ·{' '}
                    <a href={directionsLink(from, to, it.travel_mode || 'transit', lang)} target="_blank" rel="noopener noreferrer">
                      {t('it.directions')}
                    </a>
                  </div>
                )}
                <div className="item">
                  <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
                    <input
                      className="input"
                      type="time"
                      style={{ width: 118, flex: '0 0 auto' }}
                      value={it.time}
                      onChange={(e) => onUpdate(it.id, { time: e.target.value })}
                      aria-label={t('it.time')}
                    />
                    <span title={t(KIND_LABEL[it.kind])}>{KIND_ICON[it.kind]}</span>
                    <input
                      className="input"
                      style={{ flex: 1, minWidth: 0, fontWeight: 600 }}
                      value={it.title}
                      onChange={(e) => onUpdate(it.id, { title: e.target.value })}
                      placeholder={t('it.stopTitle')}
                      aria-label={t('it.stopTitle')}
                    />
                  </div>
                  <div className="spread" style={{ marginTop: 6 }}>
                    <span className="muted small">
                      {it.duration_min > 0 && `⏱ ${it.duration_min} ${t('it.min')}`}
                      {end ? ` · → ${end}` : ''}
                      {it.address && (
                        <>
                          {' · '}
                          <a href={mapsLink(to, lang)} target="_blank" rel="noopener noreferrer">
                            {t('pl.map')}
                          </a>
                        </>
                      )}
                    </span>
                    <div className="row">
                      <button className="btn small" onClick={() => onShift(it.id, -1)} disabled={n === 0} aria-label={t('it.up')}>
                        ↑
                      </button>
                      <button
                        className="btn small"
                        onClick={() => onShift(it.id, 1)}
                        disabled={n === day.items.length - 1}
                        aria-label={t('it.down')}
                      >
                        ↓
                      </button>
                      <button className="btn small" onClick={() => setOpen(expanded ? null : it.id)}>
                        {expanded ? t('common.close') : t('it.details')}
                      </button>
                      <button className="btn small danger" onClick={() => onDelete(it.id)} aria-label={t('common.remove')}>
                        ✕
                      </button>
                    </div>
                  </div>
                  {!expanded && it.notes && (
                    <div className="small" style={{ marginTop: 6 }}>
                      {it.notes}
                    </div>
                  )}
                  {expanded && (
                    <div style={{ marginTop: '0.7rem' }}>
                      <div className="form-grid">
                        <Field label={t('it.kind')}>
                          <select className="input" value={it.kind} onChange={(e) => onUpdate(it.id, { kind: e.target.value as ItinKind })}>
                            {KINDS.map((k) => (
                              <option key={k} value={k}>
                                {KIND_ICON[k]} {t(KIND_LABEL[k])}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label={t('it.duration')}>
                          <input
                            className="input"
                            type="number"
                            min={0}
                            max={720}
                            value={it.duration_min}
                            onChange={(e) => onUpdate(it.id, { duration_min: Math.max(0, Number(e.target.value) || 0) })}
                          />
                        </Field>
                        <Field label={t('it.travelMin')}>
                          <input
                            className="input"
                            type="number"
                            min={0}
                            max={360}
                            value={it.travel_min}
                            onChange={(e) => onUpdate(it.id, { travel_min: Math.max(0, Number(e.target.value) || 0) })}
                          />
                        </Field>
                        <Field label={t('it.mode')}>
                          <select
                            className="input"
                            value={it.travel_mode}
                            onChange={(e) => onUpdate(it.id, { travel_mode: e.target.value as TravelMode })}
                          >
                            <option value="">-</option>
                            <option value="walk">{t('it.modeWalk')}</option>
                            <option value="transit">{t('it.modeTransit')}</option>
                            <option value="drive">{t('it.modeDrive')}</option>
                          </select>
                        </Field>
                        <Field label={t('it.distance')}>
                          <input
                            className="input"
                            type="number"
                            min={0}
                            step="0.1"
                            value={it.distance_km}
                            onChange={(e) => onUpdate(it.id, { distance_km: Math.max(0, Number(e.target.value) || 0) })}
                          />
                        </Field>
                        <Field label={t('it.moveTo')}>
                          <select className="input" value="" onChange={(e) => e.target.value && onMove(it.id, e.target.value)}>
                            <option value="">-</option>
                            {days.map((d, k) =>
                              d.id === day.id ? null : (
                                <option key={d.id} value={d.id}>
                                  {t('it.day', { n: k + 1 })} · {fmtDate(d.date)}
                                </option>
                              )
                            )}
                          </select>
                        </Field>
                        <div className="span-all">
                          <Field label={t('pl.address')}>
                            <input className="input" value={it.address} onChange={(e) => onUpdate(it.id, { address: e.target.value })} />
                          </Field>
                        </div>
                        <div className="span-all">
                          <Field label={t('pl.notes')}>
                            <textarea className="input" value={it.notes} onChange={(e) => onUpdate(it.id, { notes: e.target.value })} />
                          </Field>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

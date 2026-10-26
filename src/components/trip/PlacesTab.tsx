'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { addSub, errMsg, listSub, removeSub } from '@/lib/db';
import { useAuth } from '@/components/AuthProvider';
import Field from '@/components/Field';
import LinkGrid from '@/components/LinkGrid';
import { mapsLink, placeLinks } from '@/lib/links';
import { fmtDate } from '@/lib/format';
import type { Place, Trip } from '@/lib/types';

const CATEGORIES = ['Sightseeing', 'Food', 'Activity', 'Shopping', 'Nightlife', 'Nature', 'Day trip', 'Other'];
const TOPICS = ['things to do in', 'best restaurants in', 'day trips from', 'hidden gems in'];

type Draft = {
  name: string;
  category: string;
  address: string;
  planned_date: string;
  url: string;
  notes: string;
};

const BLANK: Draft = { name: '', category: 'Sightseeing', address: '', planned_date: '', url: '', notes: '' };

export default function PlacesTab({ trip }: { trip: Trip }) {
  const { user, displayName } = useAuth();
  const [city, setCity] = useState(trip.destination);
  const [topic, setTopic] = useState(TOPICS[0]);

  const [places, setPlaces] = useState<Place[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft>(BLANK);
  const set = (k: keyof Draft) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const load = useCallback(async () => {
    try {
      const list = await listSub<Place>(trip.id, 'places');
      // dated places first (in order), then undated
      setPlaces(list.sort((a, b) => (a.planned_date ?? '9999').localeCompare(b.planned_date ?? '9999')));
    } catch (e) {
      setError(errMsg(e));
    }
  }, [trip.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    const url = draft.url.trim();
    try {
      await addSub(trip.id, 'places', user, displayName, {
        name: draft.name.trim(),
        category: draft.category,
        address: draft.address.trim() || null,
        planned_date: draft.planned_date || null,
        url: url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : null,
        notes: draft.notes.trim() || null,
      });
      setDraft(BLANK);
      setShowForm(false);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Remove this place?')) return;
    try {
      await removeSub(trip.id, 'places', id);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <>
      <div className="card">
        <h2>1. Discover places</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          Browse guides, reviews, and tickets for your destination, then save what you like below.
        </p>
        <div className="form-grid">
          <Field label="City">
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Looking for">
            <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ marginTop: '0.9rem' }}>
          <LinkGrid links={placeLinks({ city, topic })} empty="Enter a city to get links." />
        </div>
      </div>

      <div className="card">
        <div className="spread">
          <div>
            <h2>2. Places we want to go</h2>
            <span className="muted small">Everyone on the trip can add to this list.</span>
          </div>
          <button className="btn primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ Add place'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={save} style={{ marginTop: '1rem' }}>
            <div className="form-grid">
              <Field label="Name">
                <input className="input" value={draft.name} onChange={(e) => set('name')(e.target.value)} required />
              </Field>
              <Field label="Category">
                <select className="input" value={draft.category} onChange={(e) => set('category')(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Planned day (optional)">
                <input className="input" type="date" value={draft.planned_date} onChange={(e) => set('planned_date')(e.target.value)} />
              </Field>
              <Field label="Address">
                <input className="input" value={draft.address} onChange={(e) => set('address')(e.target.value)} />
              </Field>
              <Field label="Link (tickets, website)">
                <input className="input" value={draft.url} onChange={(e) => set('url')(e.target.value)} placeholder="https://…" />
              </Field>
              <div className="span-all">
                <Field label="Notes">
                  <textarea className="input" value={draft.notes} onChange={(e) => set('notes')(e.target.value)} placeholder="Opening hours, ticket price, how to get there…" />
                </Field>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save place'}
              </button>
            </div>
          </form>
        )}

        {error && <div className="error">{error}</div>}

        <div style={{ marginTop: '1rem' }}>
          {places === null ? (
            <p className="muted">Loading…</p>
          ) : places.length === 0 ? (
            <p className="muted">No places added yet.</p>
          ) : (
            <ul className="item-list">
              {places.map((p) => (
                <li className="item" key={p.id}>
                  <div className="spread">
                    <div>
                      <div className="item-title">
                        {p.name} {p.category && <span className="badge">{p.category}</span>}
                      </div>
                      {p.planned_date && <div className="small">Planned for {fmtDate(p.planned_date)}</div>}
                      {p.address && <div className="small">{p.address}</div>}
                      {p.notes && <div className="small">{p.notes}</div>}
                      <div className="muted small">added by {p.added_by_name ?? 'someone'}</div>
                    </div>
                    <div className="row">
                      <a
                        className="btn small"
                        href={mapsLink(`${p.name} ${p.address ?? city}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Map ↗
                      </a>
                      {p.url && (
                        <a className="btn small" href={p.url} target="_blank" rel="noopener noreferrer">
                          Website ↗
                        </a>
                      )}
                      <button className="btn small danger" onClick={() => remove(p.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

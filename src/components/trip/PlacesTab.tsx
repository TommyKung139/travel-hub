'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { addSub, errMsg, listSub, removeSub } from '@/lib/db';
import { useAuth } from '@/components/AuthProvider';
import { useT } from '@/components/LanguageProvider';
import Field from '@/components/Field';
import LinkGrid from '@/components/LinkGrid';
import { mapsLink, placeLinks } from '@/lib/links';
import { fmtDate } from '@/lib/format';
import type { Key } from '@/lib/i18n';
import type { Place, Trip } from '@/lib/types';

// Stored in English so the list reads the same for friends using either language.
const CATEGORIES = ['Sightseeing', 'Food', 'Activity', 'Shopping', 'Nightlife', 'Nature', 'Day trip', 'Other'];

const TOPICS: { id: string; label: Key; en: string; zh: string }[] = [
  { id: 'things', label: 'pl.topicThings', en: 'things to do in {city}', zh: '{city} 景點' },
  { id: 'food', label: 'pl.topicFood', en: 'best restaurants in {city}', zh: '{city} 美食餐廳' },
  { id: 'day', label: 'pl.topicDay', en: 'day trips from {city}', zh: '{city} 近郊一日遊' },
  { id: 'hidden', label: 'pl.topicHidden', en: 'hidden gems in {city}', zh: '{city} 私房景點' },
];

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
  const { t, tOr, lang } = useT();
  const [city, setCity] = useState(trip.destination);
  const [topicId, setTopicId] = useState(TOPICS[0].id);

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
    if (!confirm(t('pl.confirmRemove'))) return;
    try {
      await removeSub(trip.id, 'places', id);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  const topic = TOPICS.find((x) => x.id === topicId) ?? TOPICS[0];
  const cityName = city.trim();
  const query = (lang === 'zh' ? topic.zh : topic.en).replace('{city}', cityName);

  return (
    <>
      <div className="card">
        <h2>{t('pl.discoverTitle')}</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          {t('pl.discoverSub')}
        </p>
        <div className="form-grid">
          <Field label={t('pl.city')}>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label={t('pl.lookingFor')}>
            <select className="input" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              {TOPICS.map((x) => (
                <option key={x.id} value={x.id}>
                  {t(x.label)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ marginTop: '0.9rem' }}>
          <LinkGrid links={placeLinks({ city: cityName, query, lang })} empty={t('pl.linksEmpty')} />
        </div>
      </div>

      <div className="card">
        <div className="spread">
          <div>
            <h2>{t('pl.listTitle')}</h2>
            <span className="muted small">{t('pl.listSub')}</span>
          </div>
          <button className="btn primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? t('common.cancel') : t('pl.add')}
          </button>
        </div>

        {showForm && (
          <form onSubmit={save} style={{ marginTop: '1rem' }}>
            <div className="form-grid">
              <Field label={t('pl.name')}>
                <input className="input" value={draft.name} onChange={(e) => set('name')(e.target.value)} required />
              </Field>
              <Field label={t('pl.category')}>
                <select className="input" value={draft.category} onChange={(e) => set('category')(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {tOr(`cat.${c}`, c)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('pl.plannedDay')}>
                <input className="input" type="date" value={draft.planned_date} onChange={(e) => set('planned_date')(e.target.value)} />
              </Field>
              <Field label={t('pl.address')}>
                <input className="input" value={draft.address} onChange={(e) => set('address')(e.target.value)} />
              </Field>
              <Field label={t('pl.link')}>
                <input
                  className="input"
                  value={draft.url}
                  onChange={(e) => set('url')(e.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <div className="span-all">
                <Field label={t('pl.notes')}>
                  <textarea
                    className="input"
                    value={draft.notes}
                    onChange={(e) => set('notes')(e.target.value)}
                    placeholder={t('pl.notesPh')}
                  />
                </Field>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn primary" disabled={saving}>
                {saving ? t('common.saving') : t('pl.save')}
              </button>
            </div>
          </form>
        )}

        {error && <div className="error">{error}</div>}

        <div style={{ marginTop: '1rem' }}>
          {places === null ? (
            <p className="muted">{t('common.loading')}</p>
          ) : places.length === 0 ? (
            <p className="muted">{t('pl.none')}</p>
          ) : (
            <ul className="item-list">
              {places.map((p) => (
                <li className="item" key={p.id}>
                  <div className="spread">
                    <div>
                      <div className="item-title">
                        {p.name}{' '}
                        {p.category && <span className="badge">{tOr(`cat.${p.category}`, p.category)}</span>}
                      </div>
                      {p.planned_date && <div className="small">{t('pl.plannedFor', { d: fmtDate(p.planned_date) })}</div>}
                      {p.address && <div className="small">{p.address}</div>}
                      {p.notes && <div className="small">{p.notes}</div>}
                      <div className="muted small">
                        {t('common.addedBy', { name: p.added_by_name ?? t('common.someone') })}
                      </div>
                    </div>
                    <div className="row">
                      <a
                        className="btn small"
                        href={mapsLink(`${p.name} ${p.address ?? city}`, lang)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('pl.map')}
                      </a>
                      {p.url && (
                        <a className="btn small" href={p.url} target="_blank" rel="noopener noreferrer">
                          {t('pl.website')}
                        </a>
                      )}
                      <button className="btn small danger" onClick={() => remove(p.id)}>
                        {t('common.remove')}
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

'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { addSub, errMsg, listSub, removeSub } from '@/lib/db';
import { useAuth } from '@/components/AuthProvider';
import { useT } from '@/components/LanguageProvider';
import Field from '@/components/Field';
import LinkGrid from '@/components/LinkGrid';
import Collapse from '@/components/Collapse';
import { hotelLinks, mapsLink } from '@/lib/links';
import { fmtDate, fmtMoney, nights } from '@/lib/format';
import type { Hotel, Trip } from '@/lib/types';

const CURRENCIES = ['USD', 'TWD', 'EUR', 'JPY', 'KRW', 'GBP', 'HKD', 'SGD', 'AUD', 'CAD'];

type Draft = {
  name: string;
  address: string;
  check_in: string;
  check_out: string;
  price: string;
  currency: string;
  booking_url: string;
  confirmation: string;
  notes: string;
};

export default function HotelsTab({ trip }: { trip: Trip }) {
  const { user, displayName } = useAuth();
  const { t, lang } = useT();

  // search
  const [city, setCity] = useState(trip.destination);
  const [checkin, setCheckin] = useState(trip.start_date ?? '');
  const [checkout, setCheckout] = useState(trip.end_date ?? '');
  const [adults, setAdults] = useState(2);

  // saved hotels
  const [hotels, setHotels] = useState<Hotel[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const blank: Draft = {
    name: '',
    address: '',
    check_in: trip.start_date ?? '',
    check_out: trip.end_date ?? '',
    price: '',
    currency: 'USD',
    booking_url: '',
    confirmation: '',
    notes: '',
  };
  const [draft, setDraft] = useState<Draft>(blank);
  const set = (k: keyof Draft) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const load = useCallback(async () => {
    try {
      const list = await listSub<Hotel>(trip.id, 'hotels');
      // undated hotels go last
      setHotels(list.sort((a, b) => (a.check_in ?? '9999').localeCompare(b.check_in ?? '9999')));
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
    const url = draft.booking_url.trim();
    try {
      await addSub(trip.id, 'hotels', user, displayName, {
        name: draft.name.trim(),
        address: draft.address.trim() || null,
        check_in: draft.check_in || null,
        check_out: draft.check_out || null,
        price: draft.price ? Number(draft.price) : null,
        currency: draft.price ? draft.currency : null,
        booking_url: url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : null,
        confirmation: draft.confirmation.trim() || null,
        notes: draft.notes.trim() || null,
      });
      setDraft(blank);
      setShowForm(false);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm(t('ht.confirmRemove'))) return;
    try {
      await removeSub(trip.id, 'hotels', id);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <>
      <div className="card">
        <div className="spread">
          <div>
            <h2>{t('ht.yourTitle')}</h2>
            <span className="muted small">{t('ht.yourSub')}</span>
          </div>
          <button className="btn primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? t('common.cancel') : t('ht.add')}
          </button>
        </div>

        {showForm && (
          <form onSubmit={save} style={{ marginTop: '1rem' }}>
            <div className="form-grid">
              <Field label={t('ht.name')}>
                <input className="input" value={draft.name} onChange={(e) => set('name')(e.target.value)} required />
              </Field>
              <Field label={t('ht.address')} hint={t('ht.addressHint')}>
                <input className="input" value={draft.address} onChange={(e) => set('address')(e.target.value)} />
              </Field>
              <Field label={t('ht.checkin')}>
                <input className="input" type="date" value={draft.check_in} onChange={(e) => set('check_in')(e.target.value)} />
              </Field>
              <Field label={t('ht.checkout')}>
                <input className="input" type="date" value={draft.check_out} onChange={(e) => set('check_out')(e.target.value)} />
              </Field>
              <Field label={t('ht.price')}>
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
              <Field label={t('ht.confirmation')}>
                <input className="input" value={draft.confirmation} onChange={(e) => set('confirmation')(e.target.value)} />
              </Field>
              <Field label={t('ht.bookingLink')}>
                <input
                  className="input"
                  value={draft.booking_url}
                  onChange={(e) => set('booking_url')(e.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <div className="span-all">
                <Field label={t('ht.notes')}>
                  <textarea
                    className="input"
                    value={draft.notes}
                    onChange={(e) => set('notes')(e.target.value)}
                    placeholder={t('ht.notesPh')}
                  />
                </Field>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn primary" disabled={saving}>
                {saving ? t('common.saving') : t('ht.save')}
              </button>
            </div>
          </form>
        )}

        {error && <div className="error">{error}</div>}

        <div style={{ marginTop: '1rem' }}>
          {hotels === null ? (
            <p className="muted">{t('common.loading')}</p>
          ) : hotels.length === 0 ? (
            <p className="muted">{t('ht.none')}</p>
          ) : (
            <ul className="item-list">
              {hotels.map((h) => {
                const n = nights(h.check_in, h.check_out);
                return (
                  <li className="item" key={h.id}>
                    <div className="spread">
                      <div>
                        <div className="item-title">{h.name}</div>
                        {h.address && (
                          <div className="small">
                            {h.address}{' '}
                            <a href={mapsLink(`${h.name} ${h.address}`, lang)} target="_blank" rel="noopener noreferrer">
                              {t('ht.mapLink')}
                            </a>
                          </div>
                        )}
                        <div className="small">
                          {h.check_in ? fmtDate(h.check_in) : t('ht.checkInUnknown')} →{' '}
                          {h.check_out ? fmtDate(h.check_out) : t('ht.checkOutUnknown')}
                          {n ? ` · ${t('common.nights', { n })}` : ''}
                        </div>
                        <div className="muted small">
                          {h.price != null && <>{fmtMoney(h.price, h.currency)} · </>}
                          {h.confirmation && <>{t('ht.confirmationShort', { c: h.confirmation })} · </>}
                          {t('common.addedBy', { name: h.added_by_name ?? t('common.someone') })}
                        </div>
                        {h.notes && <div className="small" style={{ marginTop: 4 }}>{h.notes}</div>}
                      </div>
                      <div className="row">
                        {h.booking_url && (
                          <a className="btn small" href={h.booking_url} target="_blank" rel="noopener noreferrer">
                            {t('ht.bookingBtn')}
                          </a>
                        )}
                        <button className="btn small danger" onClick={() => remove(h.id)}>
                          {t('common.remove')}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Collapse title={t('ht.compareTitle')} sub={t('ht.compareSub')} autoOpen={hotels !== null && hotels.length === 0}>
        <div className="form-grid">
          <Field label={t('ht.city')}>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label={t('ht.checkin')}>
            <input className="input" type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} />
          </Field>
          <Field label={t('ht.checkout')}>
            <input
              className="input"
              type="date"
              min={checkin || undefined}
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
            />
          </Field>
          <Field label={t('ht.guests')}>
            <input
              className="input"
              type="number"
              min={1}
              max={16}
              value={adults}
              onChange={(e) => setAdults(Math.max(1, Math.min(16, Number(e.target.value) || 1)))}
            />
          </Field>
        </div>
        <div style={{ marginTop: '0.9rem' }}>
          <LinkGrid links={hotelLinks({ city, checkin, checkout, adults, lang })} empty={t('ht.linksEmpty')} />
        </div>
        <p className="muted small">{t('ht.tip')}</p>
      </Collapse>
    </>
  );
}

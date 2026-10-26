'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTrip, errMsg, leaveTrip, listMembers } from '@/lib/db';
import { useAuth } from '@/components/AuthProvider';
import { useT } from '@/components/LanguageProvider';
import { formatCode } from '@/lib/format';
import type { Member, Trip } from '@/lib/types';

export default function TeamTab({ trip }: { trip: Trip }) {
  const { user } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const me = user?.uid;
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    try {
      setMembers(await listMembers(trip.id));
    } catch (e) {
      setError(errMsg(e));
    }
  }, [trip.id]);

  useEffect(() => {
    load();
  }, [load]);

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${trip.join_code}` : '';

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      setError(t('tm.copyFail'));
    }
  }

  async function leave() {
    if (!me || !confirm(t('tm.confirmLeave'))) return;
    try {
      await leaveTrip(trip.id, me);
      router.replace('/trips');
    } catch (e) {
      setError(errMsg(e));
    }
  }

  async function removeTrip() {
    if (!me || !confirm(t('tm.confirmDelete', { name: trip.name }))) return;
    try {
      await deleteTrip(trip, me);
      router.replace('/trips');
    } catch (e) {
      setError(errMsg(e));
    }
  }

  return (
    <>
      <div className="card">
        <h2>{t('tm.inviteTitle')}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {t('tm.inviteSub')}
        </p>
        <div className="row">
          <span className="code-box">{formatCode(trip.join_code)}</span>
          <button className="btn" onClick={() => copy(formatCode(trip.join_code), 'code')}>
            {copied === 'code' ? t('common.copied') : t('tm.copyCode')}
          </button>
        </div>
        <p className="muted small" style={{ marginBottom: 4 }}>
          {t('tm.orLink')}
        </p>
        <div className="row">
          <code style={{ wordBreak: 'break-all' }}>{inviteUrl}</code>
          <button className="btn small" onClick={() => copy(inviteUrl, 'link')}>
            {copied === 'link' ? t('common.copied') : t('tm.copyLink')}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>{t('tm.whosGoing', { n: members?.length ?? '…' })}</h2>
        {error && <div className="error">{error}</div>}
        {members === null ? (
          <p className="muted">{t('common.loading')}</p>
        ) : (
          <ul className="item-list">
            {members.map((m) => (
              <li className="item" key={m.uid}>
                <div className="spread">
                  <span className="item-title">
                    {m.display_name}
                    {m.uid === me ? t('tm.you') : ''}
                  </span>
                  {m.role === 'owner' && <span className="badge">{t('tm.organizer')}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="form-actions">
          {trip.created_by !== me && (
            <button className="btn danger" onClick={leave}>
              {t('tm.leave')}
            </button>
          )}
          {trip.created_by === me && (
            <button className="btn danger" onClick={removeTrip}>
              {t('tm.delete')}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

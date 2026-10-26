'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTrip, errMsg, leaveTrip, listMembers } from '@/lib/db';
import { useAuth } from '@/components/AuthProvider';
import { formatCode } from '@/lib/format';
import type { Member, Trip } from '@/lib/types';

export default function TeamTab({ trip }: { trip: Trip }) {
  const { user } = useAuth();
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
      setError('Could not copy. Select the text and copy it manually.');
    }
  }

  async function leave() {
    if (!me || !confirm('Leave this trip?')) return;
    try {
      await leaveTrip(trip.id, me);
      router.replace('/trips');
    } catch (e) {
      setError(errMsg(e));
    }
  }

  async function removeTrip() {
    if (!me || !confirm(`Delete "${trip.name}" for everyone? Flights, hotels and places will be lost.`)) return;
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
        <h2>Invite friends</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Share this code. Your friends sign in, press <strong>Join trip</strong> on their trips page, and enter it.
        </p>
        <div className="row">
          <span className="code-box">{formatCode(trip.join_code)}</span>
          <button className="btn" onClick={() => copy(formatCode(trip.join_code), 'code')}>
            {copied === 'code' ? 'Copied!' : 'Copy code'}
          </button>
        </div>
        <p className="muted small" style={{ marginBottom: 4 }}>
          Or send the one-tap link:
        </p>
        <div className="row">
          <code style={{ wordBreak: 'break-all' }}>{inviteUrl}</code>
          <button className="btn small" onClick={() => copy(inviteUrl, 'link')}>
            {copied === 'link' ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Who&apos;s going ({members?.length ?? '…'})</h2>
        {error && <div className="error">{error}</div>}
        {members === null ? (
          <p className="muted">Loading…</p>
        ) : (
          <ul className="item-list">
            {members.map((m) => (
              <li className="item" key={m.uid}>
                <div className="spread">
                  <span className="item-title">
                    {m.display_name}
                    {m.uid === me ? ' (you)' : ''}
                  </span>
                  {m.role === 'owner' && <span className="badge">Organizer</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="form-actions">
          {trip.created_by !== me && (
            <button className="btn danger" onClick={leave}>
              Leave trip
            </button>
          )}
          {trip.created_by === me && (
            <button className="btn danger" onClick={removeTrip}>
              Delete trip
            </button>
          )}
        </div>
      </div>
    </>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { errMsg, loadChecklist, setChecklistItem } from '@/lib/db';
import { useAuth } from '@/components/AuthProvider';
import { ALL_ITEM_IDS, CHECKLIST } from '@/lib/checklist';
import type { Trip } from '@/lib/types';

// Each person has their own ticks for the trip.
export default function ChecklistTab({ trip }: { trip: Trip }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const [done, setDone] = useState<Set<string> | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setDone(new Set(await loadChecklist(trip.id, userId)));
    } catch (e) {
      setError(errMsg(e));
    }
  }, [trip.id, userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(itemId: string) {
    if (!userId || !done) return;
    const was = done.has(itemId);
    // optimistic
    const next = new Set(done);
    if (was) next.delete(itemId);
    else next.add(itemId);
    setDone(next);

    try {
      await setChecklistItem(trip.id, userId, itemId, !was);
    } catch (e) {
      setError(errMsg(e));
      load();
    }
  }

  if (!done) return <p className="muted">{error || 'Loading…'}</p>;

  const total = ALL_ITEM_IDS.length;
  const count = ALL_ITEM_IDS.filter((i) => done.has(i)).length;

  return (
    <>
      <div className="card">
        <div className="spread">
          <div>
            <h2>Your travel checklist</h2>
            <span className="muted small">Only you see your ticks. Everyone gets their own list.</span>
          </div>
          <strong>
            {count} / {total}
          </strong>
        </div>
        <div className="progress" style={{ marginTop: '0.7rem' }}>
          <div style={{ width: `${(count / total) * 100}%` }} />
        </div>
        {error && <div className="error">{error}</div>}
      </div>

      {CHECKLIST.map((section, i) => {
        const sectionDone = section.items.filter((it) => done.has(it.id)).length;
        return (
          <div className="card" key={section.id}>
            <div className="spread">
              <h3 style={{ marginBottom: 0 }}>
                {i + 1}. {section.title}
              </h3>
              <span className="muted small">
                {sectionDone}/{section.items.length}
              </span>
            </div>
            {section.items.map((it) => (
              <label key={it.id} className={`check ${done.has(it.id) ? 'done' : ''}`}>
                <input type="checkbox" checked={done.has(it.id)} onChange={() => toggle(it.id)} />
                <span>
                  <strong>{it.lead}</strong> {it.text}
                </span>
              </label>
            ))}
          </div>
        );
      })}
    </>
  );
}

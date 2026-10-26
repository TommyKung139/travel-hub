'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { errMsg, joinTripByCode } from '@/lib/db';
import { useRequireAuth } from '@/components/AuthProvider';
import { useT } from '@/components/LanguageProvider';

// Invite link: /join/ABC123 — signs you in if needed, then joins the trip.
export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const { user, displayName } = useRequireAuth();
  const { t } = useT();
  const router = useRouter();
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;
    joinTripByCode(user, displayName, code)
      .then((tripId) => router.replace(`/trips/${tripId}`))
      .catch((e) => setError(errMsg(e)));
  }, [user, displayName, code, router]);

  if (error) {
    return (
      <div className="card" style={{ maxWidth: 480, margin: '2rem auto' }}>
        <h2>{t('join.failTitle')}</h2>
        <div className="error">{error}</div>
        <Link href="/trips" className="btn">
          {t('join.back')}
        </Link>
      </div>
    );
  }
  return <p className="muted">{t('join.joining')}</p>;
}

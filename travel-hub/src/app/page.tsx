'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useT } from '@/components/LanguageProvider';

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useT();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/trips');
  }, [loading, user, router]);

  return (
    <div className="hero">
      <h1>{t('home.title')}</h1>
      <p>{t('home.sub')}</p>
      <div className="row" style={{ marginTop: '1.2rem' }}>
        <Link href="/login" className="btn primary">
          {t('home.cta')}
        </Link>
        <Link href="/guide" className="btn">
          {t('home.guide')}
        </Link>
      </div>
    </div>
  );
}

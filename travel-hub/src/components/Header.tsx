'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useT } from '@/components/LanguageProvider';
import { isConfigured } from '@/lib/firebase';

export default function Header() {
  const { user, displayName, signOut } = useAuth();
  const { t, lang, setLang } = useT();
  const router = useRouter();

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href={user ? '/trips' : '/'} className="brand">
            <span className="brand-mark" aria-hidden>✈</span> {t('brand')}
          </Link>
          <nav className="nav">
            {user && <Link href="/trips">{t('nav.trips')}</Link>}
            <Link href="/guide">{t('nav.guide')}</Link>
            <button
              className="btn ghost small"
              aria-label="Language / 語言"
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            >
              🌐 {lang === 'zh' ? 'English' : '繁體中文'}
            </button>
            {user ? (
              <>
                <span className="who">{displayName}</span>
                <button
                  className="btn ghost small"
                  onClick={async () => {
                    await signOut();
                    router.replace('/login');
                  }}
                >
                  {t('nav.signOut')}
                </button>
              </>
            ) : (
              <Link href="/login" className="btn primary small">
                {t('nav.signIn')}
              </Link>
            )}
          </nav>
        </div>
      </header>
      {!isConfigured() && <div className="banner warn">{t('banner.firebase')}</div>}
    </>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { isConfigured } from '@/lib/firebase';

export default function Header() {
  const { user, displayName, signOut } = useAuth();
  const router = useRouter();

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href={user ? '/trips' : '/'} className="brand">
            <span className="brand-mark" aria-hidden>✈</span> Travel Hub
          </Link>
          <nav className="nav">
            {user && <Link href="/trips">My trips</Link>}
            <Link href="/guide">Travel guide</Link>
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
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="btn primary small">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      {!isConfigured() && (
        <div className="banner warn">
          Firebase isn&apos;t configured yet. Add the <code>NEXT_PUBLIC_FIREBASE_*</code> variables (see
          README) to enable login and trips.
        </div>
      )}
    </>
  );
}

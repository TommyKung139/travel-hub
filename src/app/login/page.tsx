'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { tr } from '@/lib/i18n';
import { useAuth } from '@/components/AuthProvider';
import { useT } from '@/components/LanguageProvider';
import Field from '@/components/Field';

function safeNext(): string {
  if (typeof window === 'undefined') return '/trips';
  const n = new URLSearchParams(window.location.search).get('next');
  return n && n.startsWith('/') && !n.startsWith('//') ? n : '/trips';
}

function friendlyAuthError(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return tr('auth.wrong');
    case 'auth/email-already-in-use':
      return tr('auth.exists');
    case 'auth/weak-password':
      return tr('auth.weak');
    case 'auth/invalid-email':
      return tr('auth.invalidEmail');
    case 'auth/too-many-requests':
      return tr('auth.tooMany');
    case 'auth/operation-not-allowed':
      return tr('auth.notEnabled');
    case 'auth/network-request-failed':
      return tr('auth.network');
    default:
      return err instanceof Error ? err.message : tr('err.generic');
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useT();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace(safeNext());
  }, [loading, user, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const auth = getFirebaseAuth();
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() || email.split('@')[0] });
        await cred.user.getIdToken(true); // refresh so the name shows up everywhere
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <div className="card">
        <h1 style={{ fontSize: '1.6rem' }}>{mode === 'signin' ? t('login.welcome') : t('login.create')}</h1>
        <p className="muted">{mode === 'signin' ? t('login.subIn') : t('login.subUp')}</p>
        <form onSubmit={submit} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          {mode === 'signup' && (
            <Field label={t('login.name')} hint={t('login.nameHint')}>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
          )}
          <Field label={t('login.email')}>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label={t('login.password')} hint={mode === 'signup' ? t('login.passwordHint') : undefined}>
            <input
              className="input"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <div className="error">{error}</div>}
          <button className="btn primary" disabled={busy}>
            {busy ? t('login.wait') : mode === 'signin' ? t('login.btnIn') : t('login.btnUp')}
          </button>
        </form>
        <p className="muted small" style={{ marginTop: '1rem' }}>
          {mode === 'signin' ? t('login.newHere') : t('login.haveAccount')}{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
          >
            {mode === 'signin' ? t('login.createLink') : t('login.signInLink')}
          </a>
        </p>
      </div>
    </div>
  );
}

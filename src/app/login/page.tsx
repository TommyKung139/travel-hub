'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
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
      return 'Wrong email or password.';
    case 'auth/email-already-in-use':
      return 'That email already has an account. Try signing in.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not switched on in Firebase yet (Authentication → Sign-in method).';
    case 'auth/network-request-failed':
      return 'Network problem. Check your connection.';
    default:
      return err instanceof Error ? err.message : 'Something went wrong';
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace(safeNext());
  }, [loading, user, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
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
        <h1 style={{ fontSize: '1.6rem' }}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted">
          {mode === 'signin'
            ? 'Sign in so your trips and bookings follow you.'
            : 'So your friends can see who is on the trip.'}
        </p>
        <form onSubmit={submit} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          {mode === 'signup' && (
            <Field label="Your name" hint="Shown to people on your trips">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
          )}
          <Field label="Email">
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" hint={mode === 'signup' ? 'At least 6 characters' : undefined}>
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
          {info && <div className="notice">{info}</div>}
          <button className="btn primary" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="muted small" style={{ marginTop: '1rem' }}>
          {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setInfo('');
            }}
          >
            {mode === 'signin' ? 'Create an account' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  );
}

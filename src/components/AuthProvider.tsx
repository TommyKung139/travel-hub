'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onIdTokenChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

type Ctx = {
  user: User | null;
  loading: boolean;
  displayName: string;
  signOut: () => Promise<void>;
  // Fresh ID token for calling our own API routes.
  getToken: () => Promise<string | null>;
};

const AuthCtx = createContext<Ctx>({
  user: null,
  loading: true,
  displayName: '',
  signOut: async () => {},
  getToken: async () => null,
});

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, bump] = useState(0);

  useEffect(() => {
    // onIdTokenChanged also fires after we force-refresh the token (used after
    // sign-up so the display name shows up straight away).
    const unsub = onIdTokenChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setLoading(false);
      bump((n) => n + 1);
    });
    return unsub;
  }, []);

  const displayName = user?.displayName || user?.email?.split('@')[0] || '';

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        displayName,
        signOut: () => fbSignOut(getFirebaseAuth()),
        getToken: async () => (user ? user.getIdToken() : null),
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

// Redirects to /login (and back afterwards) when nobody is signed in.
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!auth.loading && !auth.user) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [auth.loading, auth.user, router]);
  return auth;
}

'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/trips');
  }, [loading, user, router]);

  return (
    <div className="hero">
      <h1>Plan trips abroad together, without the chaos.</h1>
      <p>
        Create a trip, share a code with your friends, compare flights and hotels, keep every
        booking in one place, and track your flight on the way.
      </p>
      <div className="row" style={{ marginTop: '1.2rem' }}>
        <Link href="/login" className="btn primary">
          Sign in or create account
        </Link>
        <Link href="/guide" className="btn">
          Read the travel guide
        </Link>
      </div>
    </div>
  );
}

import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-auth';
import { translateWith, type Lang } from '@/lib/i18n';
import type { FareLeg, FareOffer, FareSearchResult } from '@/lib/types';

// Live fare search through SerpApi's Google Flights engine.
// (Amadeus' free self-service API was shut down in July 2026.)
// Free SerpApi plan = 250 searches/month, so results are cached for 6 hours.

export const dynamic = 'force-dynamic';

const cache = new Map<string, { at: number; value: FareSearchResult }>();
const TTL = 6 * 60 * 60 * 1000;

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseOffer(raw: any, currency: string): FareOffer | null {
  const segs: any[] = Array.isArray(raw?.flights) ? raw.flights : [];
  if (!segs.length || typeof raw.price !== 'number') return null;
  const legs: FareLeg[] = segs.map((s) => ({
    from: s.departure_airport?.id ?? '',
    to: s.arrival_airport?.id ?? '',
    dep: s.departure_airport?.time ?? '',
    arr: s.arrival_airport?.time ?? '',
    airline: s.airline ?? '',
    flightNumber: s.flight_number ?? '',
    duration: s.duration ?? 0,
  }));
  return {
    price: raw.price,
    currency,
    totalDuration: raw.total_duration ?? legs.reduce((a, l) => a + l.duration, 0),
    stops: Math.max(0, legs.length - 1),
    legs,
  };
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lang: Lang = u.searchParams.get('lang') === 'zh' ? 'zh' : 'en';

  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: translateWith(lang, 'srv.signIn') }, { status: 401 });

  const key = process.env.SERPAPI_KEY;
  if (!key) {
    const body: FareSearchResult = {
      configured: false,
      offers: [],
      note: translateWith(lang, 'srv.fareOff'),
    };
    return NextResponse.json(body);
  }

  const origin = (u.searchParams.get('origin') ?? '').toUpperCase();
  const dest = (u.searchParams.get('dest') ?? '').toUpperCase();
  const depart = u.searchParams.get('depart') ?? '';
  const ret = u.searchParams.get('return') ?? '';
  const adults = Math.min(9, Math.max(1, Number(u.searchParams.get('adults') ?? 1) || 1));
  const currency = (u.searchParams.get('currency') ?? 'USD').toUpperCase();

  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(dest) || !/^\d{4}-\d{2}-\d{2}$/.test(depart)) {
    return NextResponse.json({ error: translateWith(lang, 'srv.fareBadInput') }, { status: 400 });
  }
  if (ret && !/^\d{4}-\d{2}-\d{2}$/.test(ret)) {
    return NextResponse.json({ error: translateWith(lang, 'srv.fareBadReturn') }, { status: 400 });
  }

  const cacheKey = [origin, dest, depart, ret, adults, currency].join('|');
  const hit = cache.get(cacheKey);
  const note = ret ? translateWith(lang, 'srv.fareRoundTrip') : undefined;
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json({ ...hit.value, note });

  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: origin,
    arrival_id: dest,
    outbound_date: depart,
    currency,
    hl: lang === 'zh' ? 'zh-TW' : 'en',
    adults: String(adults),
    type: ret ? '1' : '2',
    api_key: key,
  });
  if (ret) params.set('return_date', ret);

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, { cache: 'no-store' });
    const json: any = await res.json();
    if (!res.ok || json.error) {
      const msg = String(json?.error ?? `Search failed (${res.status})`);
      const body: FareSearchResult = { configured: true, offers: [], error: msg };
      return NextResponse.json(body, { status: res.ok ? 200 : 502 });
    }

    const all: any[] = [...(json.best_flights ?? []), ...(json.other_flights ?? [])];
    const offers = all
      .map((o) => parseOffer(o, currency))
      .filter((o): o is FareOffer => o !== null)
      .sort((a, b) => a.price - b.price)
      .slice(0, 12);

    const pi = json.price_insights;
    const value: FareSearchResult = {
      configured: true,
      offers,
      insights: pi
        ? {
            lowest: pi.lowest_price,
            level: pi.price_level,
            typicalLow: pi.typical_price_range?.[0],
            typicalHigh: pi.typical_price_range?.[1],
          }
        : undefined,
    };
    cache.set(cacheKey, { at: Date.now(), value });
    return NextResponse.json({ ...value, note });
  } catch (e) {
    const body: FareSearchResult = {
      configured: true,
      offers: [],
      error: e instanceof Error ? e.message : 'Search failed',
    };
    return NextResponse.json(body, { status: 502 });
  }
}

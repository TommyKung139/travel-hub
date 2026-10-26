import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-auth';
import { translateWith, type Lang } from '@/lib/i18n';
import type { EndPoint, TrackResult, TrackedFlight } from '@/lib/types';

// Live flight status through aviationstack (free plan = 100 requests/month,
// real-time data only, so status appears close to the departure day).

export const dynamic = 'force-dynamic';

/* eslint-disable @typescript-eslint/no-explicit-any */
function endpoint(p: any): EndPoint {
  return {
    airport: p?.airport ?? '',
    iata: p?.iata ?? '',
    terminal: p?.terminal ?? null,
    gate: p?.gate ?? null,
    delay: typeof p?.delay === 'number' ? p.delay : null,
    scheduled: p?.scheduled ?? null,
    estimated: p?.estimated ?? null,
    actual: p?.actual ?? null,
  };
}

function toFlight(f: any): TrackedFlight {
  return {
    status: f.flight_status ?? 'unknown',
    airline: f.airline?.name ?? '',
    flightIata: f.flight?.iata ?? '',
    flightDate: f.flight_date ?? '',
    departure: endpoint(f.departure),
    arrival: endpoint(f.arrival),
    live: f.live
      ? {
          lat: f.live.latitude,
          lon: f.live.longitude,
          altitude: f.live.altitude,
          speed: f.live.speed_horizontal,
          onGround: !!f.live.is_ground,
        }
      : null,
  };
}

async function callApi(key: string, flight: string, unreachable: string): Promise<any> {
  const qs = `access_key=${encodeURIComponent(key)}&flight_iata=${encodeURIComponent(flight)}&limit=20`;
  // The free plan may only serve plain HTTP, so fall back if HTTPS is refused.
  for (const proto of ['https', 'http']) {
    try {
      const res = await fetch(`${proto}://api.aviationstack.com/v1/flights?${qs}`, { cache: 'no-store' });
      const json = await res.json();
      if (json?.error?.code === 'https_access_restricted') continue;
      return json;
    } catch {
      // try the next protocol
    }
  }
  throw new Error(unreachable);
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lang: Lang = u.searchParams.get('lang') === 'zh' ? 'zh' : 'en';
  const m = (key: Parameters<typeof translateWith>[1], vars?: Record<string, string | number>) =>
    translateWith(lang, key, vars);

  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: m('srv.signIn') }, { status: 401 });

  const key = process.env.AVIATIONSTACK_KEY;
  if (!key) {
    const body: TrackResult = { configured: false, found: false, note: m('srv.trackOff') };
    return NextResponse.json(body);
  }

  const flight = (u.searchParams.get('flight') ?? '').replace(/\s+/g, '').toUpperCase();
  const date = u.searchParams.get('date') ?? '';
  if (!/^[A-Z0-9]{2}\d{1,4}[A-Z]?$/.test(flight)) {
    return NextResponse.json({ error: m('srv.trackBadFlight') }, { status: 400 });
  }

  try {
    const json = await callApi(key, flight, m('srv.cantReach'));
    if (json?.error) {
      const body: TrackResult = {
        configured: true,
        found: false,
        error: String(json.error.message ?? json.error.code ?? 'Provider error'),
      };
      return NextResponse.json(body, { status: 502 });
    }

    const rows: any[] = Array.isArray(json?.data) ? json.data : [];
    if (!rows.length) {
      const body: TrackResult = { configured: true, found: false, note: m('srv.trackNoData') };
      return NextResponse.json(body);
    }

    const exact = rows.find((r) => r.flight_date === date);
    const chosen = exact ?? rows[0];
    const body: TrackResult = {
      configured: true,
      found: true,
      matchedDate: !!exact,
      flight: toFlight(chosen),
      note: exact
        ? undefined
        : m('srv.trackOtherDate', { date: chosen.flight_date, want: date || m('srv.yourDate') }),
    };
    return NextResponse.json(body);
  } catch (e) {
    const body: TrackResult = {
      configured: true,
      found: false,
      error: e instanceof Error ? e.message : 'Tracking failed',
    };
    return NextResponse.json(body, { status: 502 });
  }
}

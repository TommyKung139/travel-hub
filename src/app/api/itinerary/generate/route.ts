import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-auth';
import { translateWith, type Key, type Lang } from '@/lib/i18n';
import type { ItinDay, ItinItem, ItinKind, ItinSettings, ItinUnscheduled, Itinerary, TravelMode } from '@/lib/types';

// Builds a day-by-day plan with Google's Gemini API from the trip's flights,
// hotels and the places the group has pitched. The model estimates travel
// times and distances from its own knowledge of the city (no live maps),
// so the page labels them as estimates and links to Google Maps to double-check.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Light brake on abuse: a few plans per person per hour (resets when the server instance restarts).
const calls = new Map<string, number[]>();
function tooMany(uid: string): boolean {
  const now = Date.now();
  const recent = (calls.get(uid) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= 12) {
    calls.set(uid, recent);
    return true;
  }
  recent.push(now);
  calls.set(uid, recent);
  return false;
}

type InPlace = {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  planned_date: string | null;
  notes: string | null;
  added_by_name: string | null;
};
type Body = {
  lang?: string;
  trip?: {
    name?: string;
    destination?: string;
    start_date?: string | null;
    end_date?: string | null;
  };
  flights?: { flight_number: string; flight_date: string; origin: string | null; destination: string | null; airline: string | null }[];
  hotels?: { name: string; address: string | null; check_in: string | null; check_out: string | null }[];
  places?: InPlace[];
  settings?: Partial<ItinSettings>;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const KINDS: ItinKind[] = ['place', 'meal', 'transit', 'hotel', 'flight', 'free', 'other'];
const MODES: TravelMode[] = ['walk', 'transit', 'drive'];
const WEEKDAY = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  zh: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
};

function datesBetween(a: string, b: string): string[] {
  const out: string[] = [];
  const d = new Date(`${a}T00:00:00Z`);
  const end = new Date(`${b}T00:00:00Z`);
  while (d <= end && out.length < 21) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const str = (v: unknown, max = 400): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown, lo: number, hi: number, dp = 0): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  const c = Math.min(hi, Math.max(lo, n));
  const f = 10 ** dp;
  return Math.round(c * f) / f;
};
const padTime = (v: unknown): string => {
  const m = TIME.exec(str(v, 8));
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractJson(text: string): any {
  const t = text.trim();
  try {
    return JSON.parse(t);
  } catch {
    // The model sometimes wraps JSON in a code fence or adds a sentence around it.
    const a = t.indexOf('{');
    const b = t.lastIndexOf('}');
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error('no json');
  }
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }
  const lang: Lang = body.lang === 'zh' ? 'zh' : 'en';
  const m = (key: Key, vars?: Record<string, string | number>) => translateWith(lang, key, vars);
  const fail = (key: Key, status: number, vars?: Record<string, string | number>) =>
    NextResponse.json({ error: m(key, vars) }, { status });

  const user = await verifyUser(req);
  if (!user) return fail('srv.signIn', 401);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ configured: false, note: m('srv.geminiOff') });

  // ── inputs ──
  const trip = body.trip ?? {};
  const places = (body.places ?? []).slice(0, 80);
  const hotels = (body.hotels ?? []).slice(0, 10);
  const flights = (body.flights ?? []).slice(0, 12);
  const destination = str(trip.destination, 120);

  let dates: string[] = [];
  if (trip.start_date && trip.end_date && DATE.test(trip.start_date) && DATE.test(trip.end_date) && trip.start_date <= trip.end_date) {
    dates = datesBetween(trip.start_date, trip.end_date);
  }
  if (!destination || !dates.length) return fail('srv.itinBad', 400);
  if (!places.length) return fail('srv.itinNoPlaces', 400);
  if (tooMany(user.uid)) return fail('srv.itinRate', 429);

  const s: ItinSettings = {
    pace: body.settings?.pace === 'relaxed' || body.settings?.pace === 'packed' ? body.settings.pace : 'balanced',
    day_start: padTime(body.settings?.day_start) || '09:00',
    day_end: padTime(body.settings?.day_end) || '21:00',
    arrival_time: padTime(body.settings?.arrival_time),
    departure_time: padTime(body.settings?.departure_time),
    wishes: str(body.settings?.wishes, 800),
  };

  const refs = new Map<string, InPlace>();
  places.forEach((p, i) => refs.set(`P${i + 1}`, p));

  const wd = WEEKDAY.en;
  const dayLines = dates
    .map((d, i) => `Day ${i + 1}: ${d} (${wd[new Date(`${d}T00:00:00Z`).getUTCDay()]})`)
    .join('\n');
  const flightLines = flights.length
    ? flights
        .map((f) => `- ${f.flight_date}: ${f.airline ?? ''} ${f.flight_number} ${f.origin ?? '?'} -> ${f.destination ?? '?'}`)
        .join('\n')
    : '- (none entered)';
  const hotelLines = hotels.length
    ? hotels
        .map((h) => `- ${h.name}${h.address ? `, ${h.address}` : ''} (check-in ${h.check_in ?? '?'}, check-out ${h.check_out ?? '?'})`)
        .join('\n')
    : '- (none entered: assume a central hotel and say so in warnings)';
  const placeLines = places
    .map((p, i) => {
      const bits = [
        `[P${i + 1}] ${str(p.name, 120)}`,
        p.category ? `category: ${str(p.category, 40)}` : '',
        p.address ? `address: ${str(p.address, 200)}` : '',
        p.planned_date ? `MUST be on ${p.planned_date}` : '',
        p.notes ? `notes: ${str(p.notes, 300)}` : '',
        p.added_by_name ? `suggested by ${str(p.added_by_name, 40)}` : '',
      ].filter(Boolean);
      return `- ${bits.join(' | ')}`;
    })
    .join('\n');

  const system = [
    'You are an experienced local travel planner who builds realistic, well-paced day-by-day itineraries for a group of friends.',
    'Respond with one JSON object only. No markdown.',
    lang === 'zh'
      ? 'Write every title, note, summary and warning in Traditional Chinese as used in Taiwan. Keep proper names of places in their local form, adding the common Traditional Chinese name where one exists.'
      : 'Write every title, note, summary and warning in English.',
  ].join(' ');

  const user_prompt = `Plan this trip.

DESTINATION: ${destination}
DAYS (the "date" field in your answer must be one of these):
${dayLines}

FLIGHTS ALREADY BOOKED:
${flightLines}
${s.arrival_time ? `Arrival time at the destination on day 1: about ${s.arrival_time} (allow time for immigration, baggage and getting to the hotel).` : 'Arrival time on day 1 is unknown: keep day 1 light and flexible.'}
${s.departure_time ? `Flight home on the last day departs at about ${s.departure_time} (be at the airport 2.5 hours before an international flight and leave the hotel with time for the transfer).` : 'Departure time on the last day is unknown: keep the last day light and finish in the morning or early afternoon.'}

HOTELS ALREADY BOOKED (do not suggest other hotels):
${hotelLines}

PLACES THE GROUP WANTS TO GO (use the [P#] code in place_ref):
${placeLines}

PREFERENCES
- Pace: ${s.pace} (relaxed = 2-3 main stops a day, balanced = 3-4, packed = 5-6).
- Each full day starts around ${s.day_start} and ends around ${s.day_end}.
${s.wishes ? `- Extra wishes from the group: ${s.wishes}` : ''}

RULES
1. Try to include every place. Group places that are close together on the same day to avoid backtracking, and order the stops in a sensible walking/transit route that starts and ends near the hotel. If a place has "MUST be on <date>", put it on that date.
2. Think about opening hours, usual closing days, typical visit length and queue times from what you know; when unsure whether something is open on a given weekday, say so in that stop's notes. Put sunrise/sunset-dependent places (viewpoints, night views) at suitable times.
3. Add lunch and dinner as separate stops (kind "meal") near the route, suggesting a type of food or a well-known local spot in the area. Add short rests only when the pace needs them.
4. For every stop after the first of the day, "travel_min" and "distance_km" are the realistic door-to-door travel time and distance from the previous stop. For the first stop of the day they are from the hotel. Use the mode that people actually use there ("walk" for under about 1 km, otherwise usually "transit" in cities with good rail, "drive" for rural spots).
5. Include one "hotel" stop on day 1 for dropping bags/check-in after arrival and one on the last day for check-out, and a "flight" stop on the last day for the airport transfer if a departure time is known. Do not add a hotel stop on other days.
6. Do not invent places that were not requested except meals and light fillers (kind "free"). If a requested place cannot reasonably fit, leave it out and list it in "unscheduled" with a short reason.
7. Times are 24-hour "HH:MM". Make sure start time + duration + the next stop's travel time does not overlap with the next stop.
8. Be honest: travel times are estimates. Put anything worth double-checking (reservations, closures, transfers) in "warnings".

JSON SHAPE
{
  "summary": "two or three sentences about the plan",
  "warnings": ["..."],
  "days": [
    {
      "date": "YYYY-MM-DD",
      "title": "short theme for the day",
      "items": [
        {
          "time": "HH:MM",
          "title": "name of the stop",
          "kind": "place | meal | transit | hotel | flight | free | other",
          "place_ref": "P3 or empty string",
          "address": "street address or area if known, else empty",
          "duration_min": 90,
          "travel_min": 12,
          "travel_mode": "walk | transit | drive",
          "distance_km": 0.9,
          "notes": "tips, how to get there, what to order, what to book ahead"
        }
      ]
    }
  ],
  "unscheduled": [ { "place_ref": "P7", "reason": "..." } ]
}
Return all ${dates.length} days, in order.`;

  // ── call Gemini ──
  let text = '';
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 55_000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user_prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 32768 },
        }),
        signal: ctl.signal,
        cache: 'no-store',
      }
    ).finally(() => clearTimeout(timer));

    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = String(json?.error?.message ?? `HTTP ${res.status}`);
      if (res.status === 429) return fail('srv.itinQuota', 429);
      if (res.status === 404) return fail('srv.itinModel', 502, { model: MODEL });
      if (res.status === 400 && /api key/i.test(msg)) return fail('srv.itinKey', 502);
      if (res.status === 403) return fail('srv.itinKey', 502);
      return fail('srv.itinFail', 502, { msg: msg.slice(0, 200) });
    }
    const cand = json?.candidates?.[0];
    text = (cand?.content?.parts ?? [])
      .filter((p: any) => typeof p?.text === 'string' && !p?.thought)
      .map((p: any) => p.text)
      .join('');
    if (!text) {
      const why = json?.promptFeedback?.blockReason ?? cand?.finishReason ?? 'empty';
      return fail('srv.itinFail', 502, { msg: String(why) });
    }
    if (cand?.finishReason === 'MAX_TOKENS') return fail('srv.itinTooLong', 502);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return fail('srv.itinTimeout', 504);
    return fail('srv.cantReachAi', 502);
  }

  // ── check and tidy what came back ──
  let raw: any;
  try {
    raw = extractJson(text);
  } catch {
    return fail('srv.itinParse', 502);
  }

  let seq = 0;
  const nid = () => `i${Date.now().toString(36)}${(seq++).toString(36)}`;
  const used = new Set<string>();
  const rawDays: any[] = Array.isArray(raw?.days) ? raw.days : [];

  const days: ItinDay[] = dates.map((date, idx) => {
    const src = rawDays.find((d) => str(d?.date, 10) === date) ?? rawDays[idx] ?? {};
    const items: ItinItem[] = (Array.isArray(src.items) ? src.items : []).slice(0, 30).map((it: any) => {
      const ref = str(it?.place_ref, 6).toUpperCase();
      const place = refs.get(ref) ?? null;
      if (place) used.add(ref);
      const kind = KINDS.includes(it?.kind) ? (it.kind as ItinKind) : place ? 'place' : 'other';
      const mode = MODES.includes(it?.travel_mode) ? (it.travel_mode as TravelMode) : '';
      return {
        id: nid(),
        time: padTime(it?.time),
        title: str(it?.title, 160) || (place ? place.name : ''),
        kind,
        place_id: place ? place.id : null,
        address: str(it?.address, 240) || (place?.address ?? ''),
        duration_min: num(it?.duration_min, 0, 720),
        travel_min: num(it?.travel_min, 0, 360),
        travel_mode: mode,
        distance_km: num(it?.distance_km, 0, 500, 1),
        notes: str(it?.notes, 600),
      };
    });
    return { id: nid(), date, title: str(src.title, 120), items: items.filter((i) => i.title) };
  });

  const unscheduled: ItinUnscheduled[] = [];
  const reasons = new Map<string, string>();
  for (const u of Array.isArray(raw?.unscheduled) ? raw.unscheduled : []) {
    reasons.set(str(u?.place_ref, 6).toUpperCase(), str(u?.reason, 300));
  }
  for (const [ref, p] of refs) {
    if (used.has(ref)) continue;
    unscheduled.push({
      id: nid(),
      title: p.name,
      place_id: p.id,
      address: p.address ?? '',
      reason: reasons.get(ref) ?? '',
    });
  }

  const itinerary: Itinerary = {
    days,
    unscheduled,
    summary: str(raw?.summary, 1200),
    warnings: (Array.isArray(raw?.warnings) ? raw.warnings : []).map((w: unknown) => str(w, 400)).filter(Boolean).slice(0, 12),
    settings: s,
    generated_by: '',
    generated_at: new Date().toISOString(),
  };
  return NextResponse.json({ configured: true, itinerary });
}

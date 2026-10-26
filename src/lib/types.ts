// Field names are snake_case in Firestore documents.

export type Trip = {
  id: string;
  name: string;
  origin: string | null;
  destination: string;
  destination_code: string | null;
  start_date: string | null;
  end_date: string | null;
  join_code: string;
  created_by: string;
};

export type Member = {
  uid: string;
  role: string;
  display_name: string;
};

export type Flight = {
  id: string;
  trip_id: string;
  airline: string | null;
  flight_number: string;
  flight_date: string;
  origin: string | null;
  destination: string | null;
  booking_ref: string | null;
  ticket_number: string | null;
  price: number | null;
  currency: string | null;
  notes: string | null;
  added_by_name: string | null;
};

export type Hotel = {
  id: string;
  trip_id: string;
  name: string;
  address: string | null;
  check_in: string | null;
  check_out: string | null;
  price: number | null;
  currency: string | null;
  booking_url: string | null;
  confirmation: string | null;
  notes: string | null;
  added_by_name: string | null;
};

export type Place = {
  id: string;
  trip_id: string;
  name: string;
  category: string | null;
  address: string | null;
  planned_date: string | null;
  url: string | null;
  notes: string | null;
  added_by_name: string | null;
};

export type FareLeg = {
  from: string;
  to: string;
  dep: string;
  arr: string;
  airline: string;
  flightNumber: string;
  duration: number;
};

export type FareOffer = {
  price: number;
  currency: string;
  totalDuration: number;
  stops: number;
  legs: FareLeg[];
};

export type FareSearchResult = {
  configured: boolean;
  offers: FareOffer[];
  insights?: { lowest?: number; level?: string; typicalLow?: number; typicalHigh?: number };
  note?: string;
  error?: string;
};

export type TrackedFlight = {
  status: string;
  airline: string;
  flightIata: string;
  flightDate: string;
  departure: EndPoint;
  arrival: EndPoint;
  live: { lat: number; lon: number; altitude: number; speed: number; onGround: boolean } | null;
};

export type EndPoint = {
  airport: string;
  iata: string;
  terminal: string | null;
  gate: string | null;
  delay: number | null;
  scheduled: string | null;
  estimated: string | null;
  actual: string | null;
};

export type TrackResult = {
  configured: boolean;
  found: boolean;
  matchedDate?: boolean;
  flight?: TrackedFlight;
  note?: string;
  error?: string;
};

// ───── AI itinerary (stored as one JSON string in trips/{id}/itinerary/main) ─────

export type ItinKind = 'place' | 'meal' | 'transit' | 'hotel' | 'flight' | 'free' | 'other';
export type TravelMode = 'walk' | 'transit' | 'drive' | '';

export type ItinItem = {
  id: string;
  time: string; // "HH:MM" start time, '' if unknown
  title: string;
  kind: ItinKind;
  place_id: string | null; // id of the saved place this stop came from
  address: string; // used for map links
  duration_min: number; // time spent here
  travel_min: number; // getting here from the previous stop (or the hotel)
  travel_mode: TravelMode;
  distance_km: number;
  notes: string;
};

export type ItinDay = { id: string; date: string; title: string; items: ItinItem[] };

export type ItinUnscheduled = { id: string; title: string; place_id: string | null; address: string; reason: string };

export type ItinSettings = {
  pace: 'relaxed' | 'balanced' | 'packed';
  day_start: string; // "09:00"
  day_end: string; // "21:00"
  arrival_time: string; // first day, optional
  departure_time: string; // last day, optional
  wishes: string;
};

export type Itinerary = {
  days: ItinDay[];
  unscheduled: ItinUnscheduled[];
  summary: string;
  warnings: string[];
  settings: ItinSettings;
  generated_by: string; // display name
  generated_at: string; // ISO
};

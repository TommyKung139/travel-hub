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

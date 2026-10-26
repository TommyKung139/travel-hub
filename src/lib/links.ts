// Builds pre-filled search links for the big comparison sites, so one click
// lands on live prices for the exact route / dates / city the user entered.

export type SiteLink = { name: string; url: string; note: string };

const enc = encodeURIComponent;
const yymmdd = (d: string) => d.slice(2).replace(/-/g, '');
const mdy = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
};

export function flightLinks(p: {
  origin: string;
  dest: string;
  depart: string;
  ret?: string;
  adults: number;
}): SiteLink[] {
  const o = p.origin.trim().toUpperCase();
  const d = p.dest.trim().toUpperCase();
  const { depart, ret, adults } = p;
  if (!o || !d || !depart) return [];

  const gf = `Flights from ${o} to ${d} on ${depart}${ret ? ` through ${ret}` : ''}${
    adults > 1 ? ` for ${adults} adults` : ''
  }`;

  return [
    {
      name: 'Google Flights',
      note: 'Best overview, shows price trends',
      url: `https://www.google.com/travel/flights?q=${enc(gf)}`,
    },
    {
      name: 'Skyscanner',
      note: 'Many airlines and agents',
      url: `https://www.skyscanner.com/transport/flights/${o.toLowerCase()}/${d.toLowerCase()}/${yymmdd(
        depart
      )}/${ret ? `${yymmdd(ret)}/` : ''}?adultsv2=${adults}`,
    },
    {
      name: 'Kayak',
      note: 'Compares across booking sites',
      url: `https://www.kayak.com/flights/${o}-${d}/${depart}${ret ? `/${ret}` : ''}/${adults}adults`,
    },
    {
      name: 'Expedia',
      note: 'Bundle flight + hotel',
      url: `https://www.expedia.com/Flights-Search?trip=${ret ? 'roundtrip' : 'oneway'}&leg1=from:${o},to:${d},departure:${mdy(
        depart
      )}TANYT${ret ? `&leg2=from:${d},to:${o},departure:${mdy(ret)}TANYT` : ''}&passengers=adults:${adults}&mode=search`,
    },
    {
      name: 'Trip.com',
      note: 'Often cheap for Asia routes',
      url: `https://www.trip.com/flights/showfarefirst?dcity=${o.toLowerCase()}&acity=${d.toLowerCase()}&ddate=${depart}${
        ret ? `&rdate=${ret}&triptype=rt` : '&triptype=ow'
      }&class=y&quantity=${adults}`,
    },
  ];
}

export function hotelLinks(p: {
  city: string;
  checkin?: string;
  checkout?: string;
  adults: number;
}): SiteLink[] {
  const city = p.city.trim();
  if (!city) return [];
  const { checkin, checkout, adults } = p;
  const dates = checkin && checkout ? `&checkin=${checkin}&checkout=${checkout}` : '';

  return [
    {
      name: 'Google Hotels',
      note: 'Compares prices across sites',
      url: `https://www.google.com/travel/search?q=${enc(
        `Hotels in ${city}${checkin && checkout ? ` ${checkin} to ${checkout}` : ''}`
      )}`,
    },
    {
      name: 'Booking.com',
      note: 'Large selection, free cancellation filter',
      url: `https://www.booking.com/searchresults.html?ss=${enc(city)}${dates}&group_adults=${adults}&no_rooms=1`,
    },
    {
      name: 'Agoda',
      note: 'Strong deals in Asia',
      url: `https://www.agoda.com/search?textToSearch=${enc(city)}${
        checkin ? `&checkIn=${checkin}` : ''
      }${checkin && checkout ? `&los=${Math.max(1, Math.round((Date.parse(checkout) - Date.parse(checkin)) / 86400000))}` : ''}&adults=${adults}&rooms=1`,
    },
    {
      name: 'Expedia',
      note: 'Bundle with flights',
      url: `https://www.expedia.com/Hotel-Search?destination=${enc(city)}${
        checkin ? `&startDate=${checkin}` : ''
      }${checkout ? `&endDate=${checkout}` : ''}&adults=${adults}`,
    },
    {
      name: 'Airbnb',
      note: 'Apartments and homes for groups',
      url: `https://www.airbnb.com/s/${enc(city)}/homes?adults=${adults}${
        checkin ? `&checkin=${checkin}` : ''
      }${checkout ? `&checkout=${checkout}` : ''}`,
    },
  ];
}

export function placeLinks(p: { city: string; topic: string }): SiteLink[] {
  const city = p.city.trim();
  if (!city) return [];
  const q = `${p.topic} ${city}`.trim();
  return [
    {
      name: 'Google Maps',
      note: 'See where things are',
      url: `https://www.google.com/maps/search/?api=1&query=${enc(q)}`,
    },
    {
      name: 'Tripadvisor',
      note: 'Reviews and rankings',
      url: `https://www.tripadvisor.com/Search?q=${enc(q)}`,
    },
    {
      name: 'Klook',
      note: 'Tickets, tours, passes',
      url: `https://www.klook.com/search/result/?query=${enc(city)}`,
    },
    {
      name: 'GetYourGuide',
      note: 'Tours and activities',
      url: `https://www.getyourguide.com/s/?q=${enc(city)}`,
    },
    {
      name: 'Google search',
      note: 'Blogs and local tips',
      url: `https://www.google.com/search?q=${enc(`${q} guide`)}`,
    },
  ];
}

export function trackLinks(flightNumber: string): SiteLink[] {
  const f = flightNumber.replace(/\s+/g, '').toUpperCase();
  if (!f) return [];
  return [
    {
      name: 'FlightAware',
      note: 'Live status and history',
      url: `https://www.flightaware.com/live/flight/${f}`,
    },
    {
      name: 'Flightradar24',
      note: 'Live map',
      url: `https://www.flightradar24.com/data/flights/${f.toLowerCase()}`,
    },
    {
      name: 'Google',
      note: 'Quick status card',
      url: `https://www.google.com/search?q=${enc(`${f} flight status`)}`,
    },
  ];
}

export function mapsLink(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${enc(query)}`;
}

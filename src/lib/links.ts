// Builds pre-filled search links for the big comparison sites, so one click
// lands on live prices for the exact route / dates / city the user entered.

import type { Lang } from '@/lib/i18n';

export type SiteLink = { name: string; url: string; note: { en: string; zh: string } };

const enc = encodeURIComponent;
const yymmdd = (d: string) => d.slice(2).replace(/-/g, '');
const mdy = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
};
// Ask Google to show its pages in Traditional Chinese when the site is.
const hl = (lang: Lang) => (lang === 'zh' ? '&hl=zh-TW' : '');

export function flightLinks(p: {
  origin: string;
  dest: string;
  depart: string;
  ret?: string;
  adults: number;
  lang?: Lang;
}): SiteLink[] {
  const o = p.origin.trim().toUpperCase();
  const d = p.dest.trim().toUpperCase();
  const { depart, ret, adults } = p;
  const lang = p.lang ?? 'en';
  if (!o || !d || !depart) return [];

  const gf = `Flights from ${o} to ${d} on ${depart}${ret ? ` through ${ret}` : ''}${
    adults > 1 ? ` for ${adults} adults` : ''
  }`;

  return [
    {
      name: 'Google Flights',
      note: { en: 'Best overview, shows price trends', zh: '總覽最完整，可看價格趨勢' },
      url: `https://www.google.com/travel/flights?q=${enc(gf)}${hl(lang)}`,
    },
    {
      name: 'Skyscanner',
      note: { en: 'Many airlines and agents', zh: '涵蓋眾多航空公司與代理商' },
      url: `https://www.skyscanner.com/transport/flights/${o.toLowerCase()}/${d.toLowerCase()}/${yymmdd(
        depart
      )}/${ret ? `${yymmdd(ret)}/` : ''}?adultsv2=${adults}`,
    },
    {
      name: 'Kayak',
      note: { en: 'Compares across booking sites', zh: '跨訂票網站比價' },
      url: `https://www.kayak.com/flights/${o}-${d}/${depart}${ret ? `/${ret}` : ''}/${adults}adults`,
    },
    {
      name: 'Expedia',
      note: { en: 'Bundle flight + hotel', zh: '機加酒組合訂購' },
      url: `https://www.expedia.com/Flights-Search?trip=${ret ? 'roundtrip' : 'oneway'}&leg1=from:${o},to:${d},departure:${mdy(
        depart
      )}TANYT${ret ? `&leg2=from:${d},to:${o},departure:${mdy(ret)}TANYT` : ''}&passengers=adults:${adults}&mode=search`,
    },
    {
      name: 'Trip.com',
      note: { en: 'Often cheap for Asia routes', zh: '亞洲航線常有好價' },
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
  lang?: Lang;
}): SiteLink[] {
  const city = p.city.trim();
  if (!city) return [];
  const { checkin, checkout, adults } = p;
  const lang = p.lang ?? 'en';
  const dates = checkin && checkout ? `&checkin=${checkin}&checkout=${checkout}` : '';

  return [
    {
      name: 'Google Hotels',
      note: { en: 'Compares prices across sites', zh: '跨平台比價' },
      url: `https://www.google.com/travel/search?q=${enc(
        `Hotels in ${city}${checkin && checkout ? ` ${checkin} to ${checkout}` : ''}`
      )}${hl(lang)}`,
    },
    {
      name: 'Booking.com',
      note: { en: 'Large selection, free cancellation filter', zh: '選擇多，可篩選免費取消' },
      url: `https://www.booking.com/searchresults.html?ss=${enc(city)}${dates}&group_adults=${adults}&no_rooms=1${
        lang === 'zh' ? '&lang=zh-tw' : ''
      }`,
    },
    {
      name: 'Agoda',
      note: { en: 'Strong deals in Asia', zh: '亞洲住宿優惠多' },
      url: `https://www.agoda.com/search?textToSearch=${enc(city)}${
        checkin ? `&checkIn=${checkin}` : ''
      }${checkin && checkout ? `&los=${Math.max(1, Math.round((Date.parse(checkout) - Date.parse(checkin)) / 86400000))}` : ''}&adults=${adults}&rooms=1`,
    },
    {
      name: 'Expedia',
      note: { en: 'Bundle with flights', zh: '可搭配機票' },
      url: `https://www.expedia.com/Hotel-Search?destination=${enc(city)}${
        checkin ? `&startDate=${checkin}` : ''
      }${checkout ? `&endDate=${checkout}` : ''}&adults=${adults}`,
    },
    {
      name: 'Airbnb',
      note: { en: 'Apartments and homes for groups', zh: '適合多人的公寓與民宿' },
      url: `https://www.airbnb.com/s/${enc(city)}/homes?adults=${adults}${
        checkin ? `&checkin=${checkin}` : ''
      }${checkout ? `&checkout=${checkout}` : ''}`,
    },
  ];
}

// `query` is the full search phrase, e.g. "things to do in Tokyo" or "Tokyo 景點".
export function placeLinks(p: { city: string; query: string; lang?: Lang }): SiteLink[] {
  const city = p.city.trim();
  if (!city) return [];
  const q = p.query.trim() || city;
  const lang = p.lang ?? 'en';
  return [
    {
      name: 'Google Maps',
      note: { en: 'See where things are', zh: '查看景點位置' },
      url: `https://www.google.com/maps/search/?api=1&query=${enc(q)}${hl(lang)}`,
    },
    {
      name: 'Tripadvisor',
      note: { en: 'Reviews and rankings', zh: '評論與排名' },
      url: `https://www.tripadvisor.com/Search?q=${enc(q)}`,
    },
    {
      name: 'Klook',
      note: { en: 'Tickets, tours, passes', zh: '票券、行程、通行證' },
      url: `https://www.klook.com/search/result/?query=${enc(city)}`,
    },
    {
      name: 'GetYourGuide',
      note: { en: 'Tours and activities', zh: '導覽行程與體驗' },
      url: `https://www.getyourguide.com/s/?q=${enc(city)}`,
    },
    {
      name: 'Google',
      note: { en: 'Blogs and local tips', zh: '部落格與在地推薦' },
      url: `https://www.google.com/search?q=${enc(lang === 'zh' ? `${q} 推薦` : `${q} guide`)}${hl(lang)}`,
    },
  ];
}

export function trackLinks(flightNumber: string, lang: Lang = 'en'): SiteLink[] {
  const f = flightNumber.replace(/\s+/g, '').toUpperCase();
  if (!f) return [];
  return [
    {
      name: 'FlightAware',
      note: { en: 'Live status and history', zh: '即時狀態與歷史' },
      url: `https://www.flightaware.com/live/flight/${f}`,
    },
    {
      name: 'Flightradar24',
      note: { en: 'Live map', zh: '即時地圖' },
      url: `https://www.flightradar24.com/data/flights/${f.toLowerCase()}`,
    },
    {
      name: 'Google',
      note: { en: 'Quick status card', zh: '快速查看狀態' },
      url: `https://www.google.com/search?q=${enc(`${f} flight status`)}${hl(lang)}`,
    },
  ];
}

export function mapsLink(query: string, lang: Lang = 'en'): string {
  return `https://www.google.com/maps/search/?api=1&query=${enc(query)}${hl(lang)}`;
}

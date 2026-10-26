'use client';

import { useT } from '@/components/LanguageProvider';
import { AIRPORTS } from '@/lib/airports';

// One shared <datalist id="airports"> used by every airport input.
export default function AirportDatalist() {
  const { lang } = useT();
  return (
    <datalist id="airports">
      {AIRPORTS.map((a) => (
        <option key={a.code} value={a.code}>
          {lang === 'zh' ? a.zh : a.city}
        </option>
      ))}
    </datalist>
  );
}

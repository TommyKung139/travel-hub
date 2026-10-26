'use client';

import { useT } from '@/components/LanguageProvider';
import type { SiteLink } from '@/lib/links';

export default function LinkGrid({ links, empty }: { links: SiteLink[]; empty?: string }) {
  const { lang } = useT();
  if (!links.length) {
    return <p className="muted">{empty ?? ''}</p>;
  }
  return (
    <div className="linkgrid">
      {links.map((l) => (
        <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" className="linkcard">
          <strong>{l.name} ↗</strong>
          <span>{l.note[lang]}</span>
        </a>
      ))}
    </div>
  );
}

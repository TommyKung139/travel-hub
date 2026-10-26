import type { SiteLink } from '@/lib/links';

export default function LinkGrid({ links, empty }: { links: SiteLink[]; empty?: string }) {
  if (!links.length) {
    return <p className="muted">{empty ?? 'Fill in the details above to get comparison links.'}</p>;
  }
  return (
    <div className="linkgrid">
      {links.map((l) => (
        <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" className="linkcard">
          <strong>{l.name} ↗</strong>
          <span>{l.note}</span>
        </a>
      ))}
    </div>
  );
}

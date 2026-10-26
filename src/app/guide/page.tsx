import Link from 'next/link';
import { CHECKLIST, GOLDEN_RULE } from '@/lib/checklist';

export const metadata = { title: 'Travel guide · Travel Hub' };

export default function GuidePage() {
  return (
    <>
      <h1>The travel guide</h1>
      <p className="muted">
        Everything worth knowing before, during, and after a trip abroad, from booking flights to
        getting home. Inside a trip you can tick these off as a personal checklist.
      </p>

      <div className="golden">
        <h2>The golden rule</h2>
        <p>{GOLDEN_RULE}</p>
      </div>

      {CHECKLIST.map((section, i) => (
        <section key={section.id} className="guide-section">
          <h2>
            {i + 1}. {section.title}
          </h2>
          <ul>
            {section.items.map((item) => (
              <li key={item.id} style={{ marginBottom: '0.4rem' }}>
                <strong>{item.lead}</strong> {item.text}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p style={{ marginTop: '2rem' }}>
        <Link href="/trips" className="btn primary">
          Start planning a trip
        </Link>
      </p>
    </>
  );
}

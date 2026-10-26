'use client';

import Link from 'next/link';
import { useT } from '@/components/LanguageProvider';
import { CHECKLIST, GOLDEN_RULE, GOLDEN_RULE_ZH, itemText, sectionTitle } from '@/lib/checklist';

export default function GuidePage() {
  const { t, lang } = useT();

  return (
    <>
      <h1>{t('guide.title')}</h1>
      <p className="muted">{t('guide.intro')}</p>

      <div className="golden">
        <h2>{t('guide.golden')}</h2>
        <p>{lang === 'zh' ? GOLDEN_RULE_ZH : GOLDEN_RULE}</p>
      </div>

      {CHECKLIST.map((section, i) => (
        <section key={section.id} className="guide-section">
          <h2>
            {i + 1}. {sectionTitle(section, lang)}
          </h2>
          <ul>
            {section.items.map((item) => {
              const it = itemText(item, lang);
              return (
                <li key={item.id} style={{ marginBottom: '0.4rem' }}>
                  <strong>{it.lead}</strong>
                  {it.sep}
                  {it.text}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p style={{ marginTop: '2rem' }}>
        <Link href="/trips" className="btn primary">
          {t('guide.cta')}
        </Link>
      </p>
    </>
  );
}

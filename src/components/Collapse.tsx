'use client';

import { useState, type ReactNode } from 'react';
import { useT } from '@/components/LanguageProvider';

// A card whose body can be folded away. `autoOpen` is the default (e.g. open only
// while nothing has been saved yet); once the person clicks, their choice wins.
export default function Collapse({
  title,
  sub,
  autoOpen,
  children,
}: {
  title: string;
  sub?: string;
  autoOpen: boolean;
  children: ReactNode;
}) {
  const { t } = useT();
  const [chosen, setChosen] = useState<boolean | null>(null);
  const open = chosen ?? autoOpen;
  return (
    <div className="card">
      <div className="spread">
        <div>
          <h2 style={{ marginBottom: open ? undefined : 0 }}>{title}</h2>
          {sub && open && (
            <p className="muted small" style={{ marginTop: 0 }}>
              {sub}
            </p>
          )}
        </div>
        <button type="button" className="btn small" aria-expanded={open} onClick={() => setChosen(!open)}>
          {open ? t('common.hide') : t('common.show')}
        </button>
      </div>
      {open && children}
    </div>
  );
}

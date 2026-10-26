'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { hasKey, setCurrentLang, translateWith, type Key, type Lang } from '@/lib/i18n';

type Vars = Record<string, string | number>;

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Vars) => string;
  // For keys built at runtime (e.g. `cat.${name}`): falls back to the plain text.
  tOr: (key: string, fallback: string) => string;
};

const LangCtx = createContext<Ctx>({
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => translateWith('en', key, vars),
  tOr: (_key, fallback) => fallback,
});

export const useT = () => useContext(LangCtx);

const STORAGE_KEY = 'travel-hub-lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  // Keeps non-React helpers (date formatting, error messages) in the same language.
  setCurrentLang(lang);

  // After mount: use the saved choice, otherwise Traditional Chinese for zh-TW/HK/MO browsers.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'zh' || saved === 'en') {
        setLangState(saved);
        return;
      }
    } catch {
      // storage unavailable: fall through to browser language
    }
    if (/^zh-(tw|hk|mo|hant)/i.test(navigator.language || '')) setLangState('zh');
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant-TW' : 'en';
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback((key: Key, vars?: Vars) => translateWith(lang, key, vars), [lang]);
  const tOr = useCallback(
    (key: string, fallback: string) => (hasKey(key) ? translateWith(lang, key) : fallback),
    [lang]
  );

  return <LangCtx.Provider value={{ lang, setLang, t, tOr }}>{children}</LangCtx.Provider>;
}

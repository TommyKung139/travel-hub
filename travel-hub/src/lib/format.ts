import { getLang } from '@/lib/i18n';

const loc = () => (getLang() === 'zh' ? 'zh-TW' : 'en-US');

// "2026-11-20" -> "Nov 20, 2026" / "2026/11/20" (no timezone shifting)
export function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  if (!y || !m || !day) return d;
  const date = new Date(y, m - 1, day);
  return getLang() === 'zh'
    ? date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' })
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtRange(
  a: string | null | undefined,
  b: string | null | undefined,
  empty: string
): string {
  if (a && b) return `${fmtDate(a)} → ${fmtDate(b)}`;
  if (a) return fmtDate(a);
  return empty;
}

export function nights(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null;
  const ms = Date.parse(b) - Date.parse(a);
  return Number.isFinite(ms) && ms > 0 ? Math.round(ms / 86400000) : null;
}

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return getLang() === 'zh' ? `${h}小時${m}分` : `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function fmtMoney(n: number | null | undefined, currency?: string | null): string {
  if (n == null) return '';
  try {
    return new Intl.NumberFormat(loc(), {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n} ${currency ?? ''}`.trim();
  }
}

export function fmtDateTime(s: string | null | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return getLang() === 'zh'
    ? d.toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

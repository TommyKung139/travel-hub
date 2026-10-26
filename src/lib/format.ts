// "2026-11-20" -> "Nov 20, 2026" (no timezone shifting)
export function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function fmtRange(a: string | null | undefined, b: string | null | undefined): string {
  if (a && b) return `${fmtDate(a)} → ${fmtDate(b)}`;
  if (a) return fmtDate(a);
  return 'Dates not set';
}

export function nights(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null;
  const ms = Date.parse(b) - Date.parse(a);
  return Number.isFinite(ms) && ms > 0 ? Math.round(ms / 86400000) : null;
}

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function fmtMoney(n: number | null | undefined, currency?: string | null): string {
  if (n == null) return '';
  try {
    return new Intl.NumberFormat('en-US', {
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
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

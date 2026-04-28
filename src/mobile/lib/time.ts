export function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'agora';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d`;
  const w = Math.floor(day / 7);
  if (w < 5) return `${w}sem`;
  const m = Math.floor(day / 30);
  if (m < 12) return `${m}mês`;
  return `${Math.floor(day / 365)}a`;
}

export type Period = 'day' | 'week' | 'month' | 'year' | 'all';

export function periodSince(p: Period): Date | null {
  const now = Date.now();
  const map: Record<Period, number> = {
    day: 24 * 3600e3,
    week: 7 * 24 * 3600e3,
    month: 30 * 24 * 3600e3,
    year: 365 * 24 * 3600e3,
    all: 0,
  };
  if (p === 'all') return null;
  return new Date(now - map[p]);
}

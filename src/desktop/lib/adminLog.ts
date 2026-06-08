import { supabase } from '@/integrations/supabase/client';

export async function adminLog(opts: {
  action: string;
  entity: string;
  entity_id?: string | null;
  reason?: string | null;
  payload?: Record<string, any> | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('admin_logs').insert({
    admin_id: user.id,
    action: opts.action,
    entity: opts.entity,
    entity_id: opts.entity_id ?? null,
    reason: opts.reason ?? null,
    payload: (opts.payload ?? null) as any,
  } as any);
}

export function exportCsv(filename: string, rows: Record<string, any>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = r[h];
      if (v == null) return '';
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

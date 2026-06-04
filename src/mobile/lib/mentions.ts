// Sistema de menções compartilhado — Fase 6
import { supabase } from '@/integrations/supabase/client';

const MENTION_RE = /@([a-zA-Z0-9_.-]{2,32})/g;

export function extractMentionHandles(text: string): string[] {
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = MENTION_RE.exec(text)) !== null) set.add(m[1].toLowerCase());
  return [...set];
}

/**
 * Resolve handles em user_ids consultando profiles.display_name (case-insensitive).
 */
export async function resolveMentions(handles: string[]): Promise<{ id: string; handle: string }[]> {
  if (!handles.length) return [];
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name')
    .or(handles.map(h => `display_name.ilike.${h}`).join(','))
    .limit(50);
  return (data || []).map(p => ({ id: p.id as string, handle: (p.display_name || '').toLowerCase() }));
}

/**
 * Registra menções para um conteúdo. As menções disparam trigger de notificação no banco.
 */
export async function recordMentions(opts: {
  text: string;
  mentionedBy: string;
  sourceType: 'forum_post' | 'forum_reply' | 'review' | 'message' | 'review_comment';
  sourceId: string;
}) {
  const handles = extractMentionHandles(opts.text);
  if (!handles.length) return;
  const resolved = await resolveMentions(handles);
  if (!resolved.length) return;
  const rows = resolved
    .filter(r => r.id !== opts.mentionedBy)
    .map(r => ({
      mentioned_user_id: r.id,
      mentioned_by: opts.mentionedBy,
      source_type: opts.sourceType,
      source_id: opts.sourceId,
      context_preview: opts.text.slice(0, 140),
    }));
  if (!rows.length) return;
  await supabase.from('mentions').insert(rows as any);
}

/**
 * Renderiza texto com menções como spans clicáveis (lado consumidor faz parsing).
 * Retorna array de partes para renderização React.
 */
export type MentionPart = { kind: 'text'; value: string } | { kind: 'mention'; handle: string };

export function parseMentionParts(text: string): MentionPart[] {
  const parts: MentionPart[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ kind: 'text', value: text.slice(last, m.index) });
    parts.push({ kind: 'mention', handle: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', value: text.slice(last) });
  return parts;
}

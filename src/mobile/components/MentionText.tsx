import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseMentionParts } from '@/mobile/lib/mentions';

/**
 * Renderiza texto convertendo @usuario em chips clicáveis.
 * Fase 6: menções globais.
 */
export function MentionText({ text, className }: { text: string; className?: string }) {
  const parts = parseMentionParts(text);
  const handles = parts.filter(p => p.kind === 'mention').map(p => (p as any).handle.toLowerCase());
  const [map, setMap] = useState<Record<string, { id: string; display_name: string | null; avatar_url: string | null }>>({});

  useEffect(() => {
    if (!handles.length) return;
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .or(handles.map(h => `display_name.ilike.${h}`).join(','))
        .limit(50);
      if (cancel || !data) return;
      const m: any = {};
      data.forEach(p => { m[(p.display_name || '').toLowerCase()] = p; });
      setMap(m);
    })();
    return () => { cancel = true; };
  }, [handles.join(',')]);

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.kind === 'text') return <span key={i}>{p.value}</span>;
        const prof = map[p.handle.toLowerCase()];
        if (!prof) return <span key={i} className="text-primary">@{p.handle}</span>;
        return (
          <Link key={i} to={`/m/perfil/${prof.id}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-primary/15 text-primary text-[12px] font-semibold hover:bg-primary/25 transition-colors">
            {prof.avatar_url && <img src={prof.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />}
            @{prof.display_name}
          </Link>
        );
      })}
    </span>
  );
}

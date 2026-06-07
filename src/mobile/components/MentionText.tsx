import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseMentionParts } from '@/mobile/lib/mentions';

/**
 * Renderiza texto convertendo @usuario (pessoal) e $vendedor (seller) em chips clicáveis.
 * Cada tipo resolve de uma tabela distinta e leva a rotas diferentes.
 */
export function MentionText({ text, className }: { text: string; className?: string }) {
  const parts = parseMentionParts(text);
  const personalHandles = parts.filter(p => p.kind === 'mention' && p.mentionKind === 'personal').map(p => (p as any).handle.toLowerCase());
  const sellerHandles = parts.filter(p => p.kind === 'mention' && p.mentionKind === 'seller').map(p => (p as any).handle.toLowerCase());
  const [pmap, setPmap] = useState<Record<string, { id: string; display_name: string | null; avatar_url: string | null }>>({});
  const [smap, setSmap] = useState<Record<string, { handle: string; display_name: string | null; avatar_url: string | null }>>({});

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (personalHandles.length) {
        const { data } = await supabase.from('profiles').select('id, display_name, avatar_url')
          .or(personalHandles.map(h => `display_name.ilike.${h}`).join(',')).limit(50);
        if (!cancel && data) {
          const m: any = {}; data.forEach(p => { m[(p.display_name || '').toLowerCase()] = p; }); setPmap(m);
        }
      }
      if (sellerHandles.length) {
        const { data } = await supabase.from('seller_profiles' as any).select('handle, display_name, avatar_url')
          .in('handle', sellerHandles).limit(50);
        if (!cancel && data) {
          const m: any = {}; (data as any[]).forEach(p => { m[(p.handle || '').toLowerCase()] = p; }); setSmap(m);
        }
      }
    })();
    return () => { cancel = true; };
  }, [personalHandles.join(','), sellerHandles.join(',')]);

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.kind === 'text') return <span key={i}>{p.value}</span>;
        if (p.mentionKind === 'seller') {
          const s = smap[p.handle.toLowerCase()];
          if (!s) return <span key={i} className="text-accent">${p.handle}</span>;
          return (
            <Link key={i} to={`/m/vendedor/${s.handle}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-accent/15 text-accent text-[12px] font-semibold hover:bg-accent/25 transition-colors">
              {s.avatar_url && <img src={s.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />}
              ${s.handle}
            </Link>
          );
        }
        const prof = pmap[p.handle.toLowerCase()];
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

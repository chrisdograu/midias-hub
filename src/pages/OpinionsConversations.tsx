// Área "Conversas de Opiniões" — lista todas as conversas vinculadas a opiniões
// onde o usuário é autor ou respondente. NÃO se mistura com DM normal.
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, MessageSquare, Gamepad2, Sparkles } from 'lucide-react';

interface Row {
  conv_id: string;
  opinion_id: string;
  product_id: string;
  product_title: string;
  product_image: string | null;
  opinion_text: string;
  opinion_author_id: string;
  opinion_author_name: string | null;
  other_id: string;
  other_name: string | null;
  other_avatar: string | null;
  last_message: string | null;
  last_at: string;
  unread: number;
  i_am_author: boolean;
}

export default function OpinionsConversations() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: convs } = await supabase
        .from('opinion_conversations')
        .select('id, opinion_id, author_id, responder_id, created_at, updated_at')
        .or(`author_id.eq.${user.id},responder_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (!convs || convs.length === 0) { setRows([]); setLoading(false); return; }

      const opinionIds = [...new Set(convs.map(c => c.opinion_id))];
      const userIds = new Set<string>();
      convs.forEach(c => { userIds.add(c.author_id); userIds.add(c.responder_id); });

      const [{ data: opinions }, { data: profiles }, { data: lastMsgs }] = await Promise.all([
        supabase.from('game_opinions').select('id, text, product_id, user_id').in('id', opinionIds),
        supabase.from('profiles').select('id, display_name, avatar_url').in('id', [...userIds]),
        supabase.from('game_opinion_replies').select('conversation_id, text, created_at').in('conversation_id', convs.map(c => c.id)).order('created_at', { ascending: false }),
      ]);

      const productIds = [...new Set((opinions || []).map((o: any) => o.product_id))];
      const { data: products } = productIds.length
        ? await supabase.from('produtos').select('id, title, image_url').in('id', productIds)
        : { data: [] as any[] };

      const profMap = new Map((profiles || []).map(p => [p.id, p]));
      const opMap = new Map((opinions || []).map((o: any) => [o.id, o]));
      const prodMap = new Map((products || []).map((p: any) => [p.id, p]));
      const lastByConv = new Map<string, { text: string; created_at: string }>();
      (lastMsgs || []).forEach((m: any) => {
        if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, { text: m.text, created_at: m.created_at });
      });

      const result: Row[] = convs.map(c => {
        const op: any = opMap.get(c.opinion_id);
        const prod: any = op ? prodMap.get(op.product_id) : null;
        const i_am_author = c.author_id === user.id;
        const other_id = i_am_author ? c.responder_id : c.author_id;
        const other = profMap.get(other_id);
        const author = profMap.get(c.author_id);
        const last = lastByConv.get(c.id);
        return {
          conv_id: c.id,
          opinion_id: c.opinion_id,
          product_id: op?.product_id || '',
          product_title: prod?.title || 'Jogo',
          product_image: prod?.image_url || null,
          opinion_text: op?.text || '',
          opinion_author_id: c.author_id,
          opinion_author_name: author?.display_name || null,
          other_id,
          other_name: other?.display_name || null,
          other_avatar: other?.avatar_url || null,
          last_message: last?.text || null,
          last_at: last?.created_at || c.updated_at || c.created_at,
          unread: 0,
          i_am_author,
        };
      }).sort((a, b) => +new Date(b.last_at) - +new Date(a.last_at));

      setRows(result);
      setLoading(false);
    })();
  }, [user?.id]);

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">Conversas de Opiniões</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Conversas privadas iniciadas a partir de opiniões em jogos. Separadas das suas mensagens diretas.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>Você ainda não participa de nenhuma conversa de opinião.</p>
          <p className="text-sm mt-1">Responda a uma opinião na página de um jogo para iniciar uma.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map(r => (
            <li key={r.conv_id}>
              <Link
                to={`/perfil/${r.opinion_author_id}/jogo/${r.product_id}/opniao/${r.opinion_id}/conversa/${r.conv_id}`}
                className="block bg-card border border-border rounded-xl p-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                    {r.product_image ? <img src={r.product_image} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Gamepad2 className="h-4 w-4" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-muted-foreground truncate">{r.product_title}</span>
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                        {r.i_am_author ? 'Sua opinião' : `Opinião de ${r.opinion_author_name || '...'}`}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">com {r.other_name || 'usuário'}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {r.last_message || <span className="italic">— sem mensagens ainda —</span>}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{new Date(r.last_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

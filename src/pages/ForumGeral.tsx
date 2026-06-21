// Fórum Geral (web) — categorias da comunidade + posts recentes cross-game.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessagesSquare, Loader2, Flame, Users, Gamepad2, MessageSquare } from 'lucide-react';
import SpoilerGuard from '@/components/spoiler/SpoilerGuard';

interface Cat { slug: string; name: string; description: string | null; parent_slug: string | null }
interface RecentPost { id: string; title: string | null; content: string; created_at: string; product_id: string | null; user_id: string; author: string; product_title: string | null; image_url: string | null; is_spoiler: boolean; spoiler_achievement_name: string | null }

export default function ForumGeral() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [posts, setPosts] = useState<RecentPost[]>([]);
  const [topGames, setTopGames] = useState<{ id: string; title: string; image_url: string | null; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: cs }, { data: ps }] = await Promise.all([
        supabase.from('forum_categories').select('slug,name,description,parent_slug').eq('is_community', true).order('display_order'),
        supabase.from('forum_posts').select('id,title,content,created_at,product_id,user_id,is_spoiler,spoiler_achievement_name').order('created_at', { ascending: false }).limit(20),
      ]);
      setCats((cs as any) || []);
      const userIds = new Set<string>(); const prodIds = new Set<string>();
      (ps || []).forEach(p => { userIds.add(p.user_id); if (p.product_id) prodIds.add(p.product_id); });
      const [{ data: profs }, { data: prods }] = await Promise.all([
        userIds.size ? supabase.from('profiles').select('id,display_name').in('id', [...userIds]) : Promise.resolve({ data: [] }),
        prodIds.size ? supabase.from('produtos').select('id,title,image_url').in('id', [...prodIds]) : Promise.resolve({ data: [] }),
      ]);
      const profMap = new Map((profs || []).map(p => [p.id, p.display_name || 'Usuário']));
      const prodMap = new Map((prods || []).map(p => [p.id, p]));
      setPosts((ps || []).map((p: any) => ({
        ...p, author: profMap.get(p.user_id) || 'Usuário',
        product_title: p.product_id ? prodMap.get(p.product_id)?.title || null : null,
        image_url: p.product_id ? prodMap.get(p.product_id)?.image_url || null : null,
        is_spoiler: !!p.is_spoiler,
        spoiler_achievement_name: p.spoiler_achievement_name || null,
      })));

      const countByGame = new Map<string, number>();
      (ps || []).forEach(p => p.product_id && countByGame.set(p.product_id, (countByGame.get(p.product_id) || 0) + 1));
      const top = [...countByGame.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, count]) => {
        const p = prodMap.get(id); return { id, title: p?.title || 'Jogo', image_url: p?.image_url || null, count };
      });
      setTopGames(top);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <MessagesSquare className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Fórum MIDIAS</h1>
          <p className="text-sm text-muted-foreground">Discussões da comunidade e tópicos por jogo.</p>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Esquerda: categorias + jogos */}
          <div className="md:col-span-1 space-y-6">
            <section className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-accent" /> Comunidade</h2>
              {cats.filter(c => c.parent_slug).length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma categoria geral cadastrada.</p>
              ) : (
                <div className="space-y-1.5">
                  {cats.filter(c => c.parent_slug).map(c => (
                    <Link key={c.slug} to={`/m/forum-comunidade/${c.slug}`} className="block p-2 rounded-lg hover:bg-secondary transition-colors">
                      <p className="text-sm font-semibold">{c.name}</p>
                      {c.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{c.description}</p>}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-primary" /> Em alta nos jogos</h2>
              {topGames.length === 0 ? <p className="text-xs text-muted-foreground">Sem atividade recente.</p> : (
                <div className="space-y-1.5">
                  {topGames.map((g, i) => (
                    <Link key={g.id} to={`/jogo/${g.id}/social`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors">
                      <span className="text-xs font-bold text-primary w-5">#{i + 1}</span>
                      <div className="w-9 h-12 rounded bg-muted overflow-hidden">
                        {g.image_url ? <img src={g.image_url} alt="" className="w-full h-full object-cover" /> : <Gamepad2 className="h-4 w-4 m-auto" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{g.title}</p>
                        <p className="text-[10px] text-muted-foreground">{g.count} posts</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Direita: posts recentes */}
          <section className="md:col-span-2">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> Posts recentes</h2>
            {posts.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">Nenhum post ainda — seja o primeiro!</div>
            ) : (
              <div className="space-y-2.5">
                {posts.map(p => (
                  <Link key={p.id} to={p.product_id ? `/jogo/${p.product_id}/social` : `/m/forum/post/${p.id}`}
                    className="block bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
                    <div className="flex items-start gap-3">
                      {p.image_url && <div className="w-12 h-16 rounded bg-muted overflow-hidden shrink-0"><img src={p.image_url} alt="" className="w-full h-full object-cover" /></div>}
                      <div className="flex-1 min-w-0">
                        {p.title && <p className="font-semibold text-sm">{p.title}</p>}
                        <p className="text-sm text-muted-foreground line-clamp-2">{p.content}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                          <span>{p.author}</span>
                          {p.product_title && <><span>·</span><span className="text-primary">{p.product_title}</span></>}
                          <span>·</span>
                          <time>{new Date(p.created_at).toLocaleDateString('pt-BR')}</time>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// Busca Global Única — indexa Mobile + Web. Cada resultado marcado com 📱/🖥.
// Click inteligente: se estamos no Web e destino é Mobile (ou vice-versa), CTA "Abrir versão X".
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Loader2, Gamepad2, User, Store, MessageSquare, Star, ShoppingBag, Monitor, Smartphone } from 'lucide-react';

type Category = 'all' | 'games' | 'users' | 'sellers' | 'reviews' | 'forum' | 'marketplace';
type Platform = 'web' | 'mobile' | 'both';

interface Result {
  id: string;
  title: string;
  subtitle?: string;
  image?: string | null;
  category: Exclude<Category, 'all'>;
  platform: Platform;
  webUrl?: string;
  mobileUrl?: string;
}

const TABS: { k: Category; label: string; icon: any }[] = [
  { k: 'all', label: 'Tudo', icon: Search },
  { k: 'games', label: 'Jogos', icon: Gamepad2 },
  { k: 'users', label: 'Usuários', icon: User },
  { k: 'sellers', label: 'Vendedores', icon: Store },
  { k: 'reviews', label: 'Reviews', icon: Star },
  { k: 'forum', label: 'Fórum', icon: MessageSquare },
  { k: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
];

export default function BuscaGlobal() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [tab, setTab] = useState<Category>((params.get('cat') as Category) || 'all');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(q, 250);
  const isMobileApp = typeof window !== 'undefined' && window.location.pathname.startsWith('/m');

  useEffect(() => {
    setParams(p => { if (debounced) p.set('q', debounced); else p.delete('q'); p.set('cat', tab); return p; }, { replace: true });
  }, [debounced, tab, setParams]);

  useEffect(() => {
    const term = debounced.trim();
    if (term.length < 2) { setResults([]); return; }
    setLoading(true);
    let cancel = false;
    (async () => {
      const like = `%${term}%`;
      const [games, profiles, sellers, reviews, posts, ads] = await Promise.all([
        supabase.from('produtos').select('id,title,image_url,category').eq('is_active', true).ilike('title', like).limit(20),
        supabase.from('profiles').select('id,display_name,username,avatar_url').or(`display_name.ilike.${like},username.ilike.${like}`).limit(20),
        supabase.from('seller_profiles').select('user_id,handle,display_name,avatar_url').or(`handle.ilike.${like},display_name.ilike.${like}`).limit(20),
        supabase.from('avaliacoes').select('id,product_id,rating,comment,user_id').not('comment', 'is', null).ilike('comment', like).limit(20),
        supabase.from('forum_posts').select('id,title,content,product_id').or(`title.ilike.${like},content.ilike.${like}`).limit(20),
        supabase.from('anuncios').select('id,title,description,price').eq('status', 'active').or(`title.ilike.${like},description.ilike.${like}`).limit(20),
      ]);

      if (cancel) return;

      const list: Result[] = [];
      (games.data || []).forEach(g => list.push({
        id: g.id, title: g.title, subtitle: g.category || 'Jogo', image: g.image_url,
        category: 'games', platform: 'both',
        webUrl: `/jogo/${g.id}`, mobileUrl: `/m/forum/${g.id}`,
      }));
      (profiles.data || []).forEach(p => list.push({
        id: p.id, title: p.display_name || 'Usuário', subtitle: p.username ? `@${p.username}` : undefined,
        image: p.avatar_url, category: 'users', platform: 'both',
        webUrl: `/perfil/${p.id}`, mobileUrl: `/m/perfil/${p.id}`,
      }));
      (sellers.data || []).forEach((s: any) => list.push({
        id: s.user_id, title: s.display_name || s.handle, subtitle: `$${s.handle}`,
        image: s.avatar_url, category: 'sellers', platform: 'web',
        webUrl: `/vendedor/${s.handle}`,
      }));
      (reviews.data || []).forEach((r: any) => list.push({
        id: r.id, title: `Review · ${r.rating}★`, subtitle: r.comment?.slice(0, 80),
        category: 'reviews', platform: 'mobile',
        mobileUrl: `/m/review/${r.product_id}`,
      }));
      (posts.data || []).forEach((p: any) => list.push({
        id: p.id, title: p.title || 'Post do fórum',
        subtitle: (p.content || '').slice(0, 80), category: 'forum', platform: 'mobile',
        mobileUrl: `/m/forum/post/${p.id}`,
      }));
      (ads.data || []).forEach((a: any) => list.push({
        id: a.id, title: a.title, subtitle: a.price ? `R$ ${Number(a.price).toFixed(2)}` : a.description?.slice(0, 60),
        category: 'marketplace', platform: 'mobile',
        mobileUrl: `/m/marketplace/${a.id}`,
      }));
      setResults(list);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [debounced]);

  const filtered = useMemo(() => tab === 'all' ? results : results.filter(r => r.category === tab), [results, tab]);

  const counts = useMemo(() => {
    const c: Record<Category, number> = { all: results.length, games: 0, users: 0, sellers: 0, reviews: 0, forum: 0, marketplace: 0 };
    results.forEach(r => { c[r.category]++; });
    return c;
  }, [results]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          autoFocus
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar em todo MIDIAS — jogos, usuários, vendedores, reviews, fórum, marketplace..."
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-thin">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.k;
          const count = counts[t.k];
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="h-3.5 w-3.5" /> {t.label}
              {count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-primary-foreground/20' : 'bg-background'}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {q.trim().length < 2 ? (
        <p className="text-center text-sm text-muted-foreground py-20">Digite pelo menos 2 caracteres.</p>
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-20">Nenhum resultado para "{q}".</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map(r => (
            <ResultRow key={`${r.category}-${r.id}`} r={r} isMobileApp={isMobileApp} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultRow({ r, isMobileApp }: { r: Result; isMobileApp: boolean }) {
  const Icon = TABS.find(t => t.k === r.category)?.icon || Search;
  // Primary action: open in current platform if available, otherwise the other.
  const primaryUrl = isMobileApp ? (r.mobileUrl || r.webUrl) : (r.webUrl || r.mobileUrl);
  const isPrimaryMobile = primaryUrl === r.mobileUrl;
  const showAlt = isMobileApp ? (!r.mobileUrl && !!r.webUrl) || (!!r.mobileUrl && !!r.webUrl && r.webUrl !== r.mobileUrl)
                              : (!r.webUrl && !!r.mobileUrl) || (!!r.webUrl && !!r.mobileUrl && r.webUrl !== r.mobileUrl);

  return (
    <li className="bg-card border border-border rounded-xl p-3 hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
          {r.image ? <img src={r.image} alt="" className="w-full h-full object-cover" /> :
            <Icon className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {primaryUrl ? (
              <Link to={primaryUrl} className="font-semibold text-sm hover:text-primary truncate">{r.title}</Link>
            ) : <span className="font-semibold text-sm truncate">{r.title}</span>}
            <PlatformTag platform={r.platform} />
          </div>
          {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
        </div>
        {showAlt && (
          <div className="shrink-0 flex flex-col gap-1">
            {isMobileApp && r.webUrl && (
              <a href={r.webUrl} target="_blank" rel="noopener" className="text-[10px] inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-primary/40">
                <Monitor className="h-3 w-3" /> Abrir versão Web
              </a>
            )}
            {!isMobileApp && r.mobileUrl && r.platform !== 'web' && (
              <Link to={r.mobileUrl} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-primary/40">
                <Smartphone className="h-3 w-3" /> Abrir versão Mobile
              </Link>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function PlatformTag({ platform }: { platform: Platform }) {
  if (platform === 'both') return (
    <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
      <Smartphone className="h-2.5 w-2.5" />+<Monitor className="h-2.5 w-2.5" />
    </span>
  );
  if (platform === 'mobile') return (
    <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent">
      <Smartphone className="h-2.5 w-2.5" /> Mobile
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
      <Monitor className="h-2.5 w-2.5" /> Web
    </span>
  );
}

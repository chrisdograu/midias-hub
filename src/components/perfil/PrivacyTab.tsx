import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Plus, X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

type Visibility = 'public' | 'friends' | 'private';
type Scope = 'reviews_completas' | 'screenshots' | 'opinions' | 'stats' | 'achievements' | 'library_items' | 'full';

const SCOPES: { id: Scope; label: string }[] = [
  { id: 'full', label: 'Acesso total (tudo)' },
  { id: 'library_items', label: 'Itens da biblioteca' },
  { id: 'reviews_completas', label: 'Reviews completas' },
  { id: 'opinions', label: 'Opiniões' },
  { id: 'screenshots', label: 'Screenshots' },
  { id: 'stats', label: 'Estatísticas' },
  { id: 'achievements', label: 'Conquistas' },
];

interface Profile { id: string; display_name: string | null; avatar_url: string | null }

export default function PrivacyTab() {
  const { user } = useAuth();
  const [visibility, setVisibility] = useState<Visibility>('friends');
  const [exceptions, setExceptions] = useState<Profile[]>([]);
  const [grants, setGrants] = useState<Record<string, Set<Scope>>>({});
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [alwaysHide, setAlwaysHide] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('library_visibility, privacy_exceptions, always_hide_spoilers')
        .eq('id', user.id)
        .maybeSingle();
      const v = (prof as any)?.library_visibility as Visibility | null;
      if (v) setVisibility(v);
      setAlwaysHide(!!(prof as any)?.always_hide_spoilers);
      const ids: string[] = (prof as any)?.privacy_exceptions || [];
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', ids);
        setExceptions((profs as any) || []);
      }
      const { data: g } = await supabase
        .from('privacy_grants' as any)
        .select('viewer_id, scope')
        .eq('owner_id', user.id);
      const map: Record<string, Set<Scope>> = {};
      ((g as any[]) || []).forEach(r => {
        if (!map[r.viewer_id]) map[r.viewer_id] = new Set();
        map[r.viewer_id].add(r.scope);
      });
      setGrants(map);
      setLoading(false);
    })();
  }, [user?.id]);

  const persistVisibility = async (v: Visibility) => {
    setVisibility(v);
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ library_visibility: v } as any).eq('id', user.id);
    if (error) toast.error('Erro ao salvar'); else toast.success('Visibilidade atualizada');
  };

  const persistAlwaysHide = async (v: boolean) => {
    setAlwaysHide(v);
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ always_hide_spoilers: v } as any).eq('id', user.id);
    if (error) toast.error('Erro ao salvar'); else toast.success(v ? 'Spoilers sempre ocultos' : 'Preferência atualizada');
  };

  const persistExceptions = async (next: Profile[]) => {
    if (!user) return;
    const ids = next.map(p => p.id);
    const { error } = await supabase.from('profiles').update({ privacy_exceptions: ids } as any).eq('id', user.id);
    if (error) { toast.error('Erro ao salvar exceções'); return; }
    setExceptions(next);
  };

  const search = async () => {
    if (!query.trim()) { setResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .ilike('display_name', `%${query}%`)
      .neq('id', user!.id)
      .limit(8);
    setResults((data as any) || []);
  };

  const addException = (p: Profile) => {
    if (exceptions.some(e => e.id === p.id)) return;
    persistExceptions([...exceptions, p]);
    setResults([]); setQuery('');
  };
  const removeException = (id: string) => persistExceptions(exceptions.filter(e => e.id !== id));

  const toggleGrant = async (viewerId: string, scope: Scope, on: boolean) => {
    if (!user) return;
    if (on) {
      await supabase.from('privacy_grants' as any).insert({ owner_id: user.id, viewer_id: viewerId, scope });
    } else {
      await supabase.from('privacy_grants' as any).delete().match({ owner_id: user.id, viewer_id: viewerId, scope });
    }
    setGrants(prev => {
      const next = { ...prev };
      const s = new Set(next[viewerId] || []);
      if (on) s.add(scope); else s.delete(scope);
      next[viewerId] = s;
      return next;
    });
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <section className="border border-border rounded-lg p-3 bg-card">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={alwaysHide} onCheckedChange={(v) => persistAlwaysHide(!!v)} className="mt-0.5" />
          <span className="flex-1">
            <span className="text-sm font-semibold text-foreground block">Sempre ocultar spoilers</span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Conteúdo marcado como spoiler (manual ou de conquista) sempre exigirá um clique para revelar — mesmo se você já tiver a conquista vinculada.
            </span>
          </span>
        </label>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" /> Visibilidade da biblioteca
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(['public', 'friends', 'private'] as Visibility[]).map(v => (
            <button
              key={v}
              onClick={() => persistVisibility(v)}
              className={`px-3 py-3 rounded-lg border text-xs font-medium transition ${visibility === v ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {v === 'public' ? 'Público' : v === 'friends' ? 'Amigos' : 'Privado'}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          {visibility === 'public' && 'Qualquer pessoa pode ver sua biblioteca.'}
          {visibility === 'friends' && 'Apenas amigos mútuos têm acesso ao conteúdo social.'}
          {visibility === 'private' && 'Apenas amigos próximos e exceções autorizadas têm acesso.'}
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Exceções (acesso especial)</h3>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Buscar usuário pelo nome"
              className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button onClick={search} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Buscar</button>
        </div>
        {results.length > 0 && (
          <div className="mb-3 border border-border rounded-lg overflow-hidden">
            {results.map(r => (
              <button key={r.id} onClick={() => addException(r)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary text-left">
                <div className="w-7 h-7 rounded-full bg-primary/20 overflow-hidden">
                  {r.avatar_url && <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="text-sm flex-1 truncate">{r.display_name}</span>
                <Plus className="h-4 w-4 text-primary" />
              </button>
            ))}
          </div>
        )}

        {exceptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma exceção definida.</p>
        ) : (
          <div className="space-y-3">
            {exceptions.map(p => (
              <div key={p.id} className="border border-border rounded-lg p-3 bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden">
                    {p.avatar_url && <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className="text-sm font-medium flex-1 truncate">{p.display_name}</span>
                  <button onClick={() => removeException(p.id)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SCOPES.map(s => {
                    const checked = grants[p.id]?.has(s.id) || false;
                    return (
                      <label key={s.id} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={(v) => toggleGrant(p.id, s.id, !!v)} />
                        {s.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

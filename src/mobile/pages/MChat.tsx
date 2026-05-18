import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Search, MessagesSquare, Check, X, Trophy, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/mobile/lib/time';
import { MobileBadge } from '@/mobile/lib/badge';
import { toast } from 'sonner';

interface Conv {
  id: string; participant_1: string; participant_2: string; anuncio_id: string | null;
  last_message: string | null; last_message_at: string | null; status: string;
  other_id: string; other_name: string; other_avatar: string | null;
  unread: number; ad_title: string | null;
  tournament_id: string | null; is_admin_chat: boolean; tournament_title: string | null;
}

export default function MChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversas, setConversas] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'geral' | 'torneios'>('geral');

  const applyConversationState = async (convs: any[]) => {
    const otherIds = convs.map(c => c.participant_1 === user?.id ? c.participant_2 : c.participant_1);
    const adIds = convs.map(c => c.anuncio_id).filter(Boolean) as string[];
    const tIds = [...new Set(convs.map(c => c.tournament_id).filter(Boolean) as string[])];
    const [{ data: profiles }, { data: ads }, { data: unread }, { data: tourns }] = await Promise.all([
      otherIds.length ? supabase.from('profiles').select('id, display_name, avatar_url').in('id', otherIds) : Promise.resolve({ data: [] }),
      adIds.length ? supabase.from('anuncios').select('id, title').in('id', adIds) : Promise.resolve({ data: [] }),
      user ? supabase.from('mensagens').select('sender_id').eq('receiver_id', user.id).eq('is_read', false) : Promise.resolve({ data: [] }),
      tIds.length ? supabase.from('tournaments' as any).select('id, title').in('id', tIds) : Promise.resolve({ data: [] }),
    ]);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const adMap = new Map((ads || []).map(a => [a.id, a.title]));
    const tournMap = new Map(((tourns as any) || []).map((t: any) => [t.id, t.title]));
    const unreadMap = new Map<string, number>();
    (unread || []).forEach(m => unreadMap.set(m.sender_id, (unreadMap.get(m.sender_id) || 0) + 1));

    setConversas(convs.map(c => {
      const otherId = c.participant_1 === user?.id ? c.participant_2 : c.participant_1;
      const p = profileMap.get(otherId);
      return {
        id: c.id, participant_1: c.participant_1, participant_2: c.participant_2,
        anuncio_id: c.anuncio_id, last_message: c.last_message, last_message_at: c.last_message_at,
        status: c.status || 'accepted',
        other_id: otherId, other_name: p?.display_name || 'Usuário', other_avatar: p?.avatar_url || null,
        unread: unreadMap.get(otherId) || 0, ad_title: c.anuncio_id ? adMap.get(c.anuncio_id) || null : null,
        tournament_id: c.tournament_id || null,
        is_admin_chat: !!c.is_admin_chat,
        tournament_title: c.tournament_id ? (tournMap.get(c.tournament_id) as string) || null : null,
      };
    }));
  };

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: convs } = await supabase
      .from('conversas').select('id, participant_1, participant_2, anuncio_id, last_message, last_message_at, status, tournament_id, is_admin_chat')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });
    if (!convs) { setLoading(false); return; }
    await applyConversationState(convs as any[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel('chat-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversas', filter: `participant_1=eq.${user.id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversas', filter: `participant_2=eq.${user.id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens', filter: `receiver_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const handleAccept = async (id: string) => {
    await supabase.from('conversas').update({ status: 'accepted' }).eq('id', id);
    toast.success('Conversa aceita');
    load();
  };
  const handleReject = async (id: string) => {
    await supabase.from('conversas').update({ status: 'rejected' }).eq('id', id);
    toast('Conversa recusada');
    load();
  };

  if (!user) {
    return (
      <div className="px-6 py-12 text-center">
        <MessagesSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground mb-4">Entre para acessar suas conversas.</p>
        <Link to="/m/auth" className="inline-block px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Entrar</Link>
      </div>
    );
  }

  const pending = conversas.filter(c => c.status === 'pending' && c.participant_2 === user.id);
  const active = conversas.filter(c => c.status === 'accepted');
  const tournamentConvs = active.filter(c => c.tournament_id);
  const generalConvs = active.filter(c => !c.tournament_id);
  const tournamentUnread = tournamentConvs.reduce((s, c) => s + c.unread, 0);

  // Group tournament convs by tournament_id
  const tournamentGroups = tournamentConvs.reduce<Record<string, Conv[]>>((acc, c) => {
    const k = c.tournament_id!;
    (acc[k] = acc[k] || []).push(c);
    return acc;
  }, {});

  const list = tab === 'torneios' ? tournamentConvs : generalConvs;
  const filtered = list.filter(c => !query.trim() || c.other_name.toLowerCase().includes(query.toLowerCase()) || (c.tournament_title || '').toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="font-display text-xl font-bold gradient-text">Chat</h1>

      <div className="flex gap-2 p-1 bg-card border border-border rounded-xl">
        <button onClick={() => setTab('geral')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === 'geral' ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md' : 'text-muted-foreground'}`}>
          <MessagesSquare className="h-3.5 w-3.5" /> Geral
          {generalConvs.reduce((s,c)=>s+c.unread,0) > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{generalConvs.reduce((s,c)=>s+c.unread,0)}</span>}
        </button>
        <button onClick={() => setTab('torneios')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === 'torneios' ? 'bg-gradient-to-r from-destructive to-accent text-primary-foreground shadow-md' : 'text-muted-foreground'}`}>
          <Trophy className="h-3.5 w-3.5" /> Torneios
          {tournamentUnread > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{tournamentUnread}</span>}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={tab === 'torneios' ? 'Buscar por torneio ou jogador...' : 'Buscar conversas...'} className="w-full pl-10 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {tab === 'geral' && pending.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-warning mb-2">Pedidos de conversa ({pending.length})</h2>
              <div className="space-y-2">
                {pending.map(c => (
                  <div key={c.id} className="glass rounded-xl p-3 flex items-center gap-3">
                    <Avatar name={c.other_name} url={c.other_avatar} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.other_name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{c.last_message || 'quer iniciar uma conversa'}</p>
                    </div>
                    <button onClick={() => handleAccept(c.id)} className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center"><Check className="h-4 w-4" /></button>
                    <button onClick={() => handleReject(c.id)} className="w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'torneios' ? (
            tournamentConvs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum chat de torneio.</p>
                <p className="text-xs mt-1">Inscreva-se em um torneio para conversar com adversários e admins.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(tournamentGroups).map(([tid, convs]) => {
                  const title = convs[0].tournament_title || 'Torneio';
                  const visible = convs.filter(c => filtered.includes(c));
                  if (visible.length === 0) return null;
                  return (
                    <section key={tid} className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <Trophy className="h-4 w-4 text-destructive" />
                        <h2 className="text-xs font-bold uppercase tracking-wider gradient-text truncate flex-1">{title}</h2>
                        <span className="text-[10px] text-muted-foreground">{visible.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {visible.map(c => (
                          <Link key={c.id} to={`/m/chat/${c.id}`} className="flex items-center gap-3 p-3 glass rounded-xl border-l-2 border-destructive/60 hover:border-destructive transition-all">
                            <Avatar name={c.other_name} url={c.other_avatar} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                                  {c.is_admin_chat && <ShieldAlert className="h-3 w-3 text-warning shrink-0" />}
                                  {c.other_name}
                                </p>
                                <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(c.last_message_at)}</span>
                              </div>
                              {c.is_admin_chat && <MobileBadge tone="warning">Admin</MobileBadge>}
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{c.last_message || 'Sem mensagens'}</p>
                            </div>
                            {c.unread > 0 && <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">{c.unread > 9 ? '9+' : c.unread}</span>}
                          </Link>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessagesSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma conversa ainda.</p>
              <p className="text-xs mt-1">Inicie uma conversa pelo Marketplace ou pelo Fórum.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(c => (
                <Link key={c.id} to={`/m/chat/${c.id}`} className="flex items-center gap-3 p-3 glass rounded-xl hover:border-primary/40 transition-colors">
                  <Avatar name={c.other_name} url={c.other_avatar} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{c.other_name}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(c.last_message_at)}</span>
                    </div>
                    {c.ad_title && <MobileBadge tone="primary">📦 {c.ad_title.slice(0, 30)}</MobileBadge>}
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{c.last_message || 'Sem mensagens'}</p>
                  </div>
                  {c.unread > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{c.unread > 9 ? '9+' : c.unread}</span>}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground font-bold shrink-0">
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : name[0]?.toUpperCase() || '?'}
    </div>
  );
}

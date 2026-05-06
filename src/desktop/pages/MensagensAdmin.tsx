import { useState, useEffect, useMemo } from 'react';
import { MessageSquare, AlertTriangle, Loader2, ArrowLeft, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Conv {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string | null;
  last_message_at: string | null;
  category: string;
  has_active_report: boolean;
  p1_name: string;
  p2_name: string;
  msg_count: number;
}
interface Msg {
  id: string; sender_id: string; sender_name: string; content: string; is_read: boolean; created_at: string;
}

export default function MensagensAdmin() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conv | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'reported'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cs } = await supabase.from('conversas')
        .select('*').order('last_message_at', { ascending: false }).limit(200);
      if (!cs) { setLoading(false); return; }
      const userIds = [...new Set(cs.flatMap(c => [c.participant_1, c.participant_2]))];
      const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds);
      const pmap = new Map(profiles?.map(p => [p.id, p.display_name || 'Usuário']) || []);

      // Contar mensagens por conversa via tabela mensagens (cruzando participantes)
      const ids = cs.map(c => c.id);
      const { data: msgs } = await supabase.from('mensagens').select('sender_id, receiver_id').limit(2000);
      const countMap = new Map<string, number>();
      cs.forEach(c => {
        const cnt = (msgs || []).filter(m =>
          (m.sender_id === c.participant_1 && m.receiver_id === c.participant_2) ||
          (m.sender_id === c.participant_2 && m.receiver_id === c.participant_1)
        ).length;
        countMap.set(c.id, cnt);
      });

      setConvs(cs.map(c => ({
        id: c.id, participant_1: c.participant_1, participant_2: c.participant_2,
        last_message: c.last_message, last_message_at: c.last_message_at,
        category: c.category || 'amizade',
        has_active_report: !!c.has_active_report,
        p1_name: pmap.get(c.participant_1) || 'Usuário',
        p2_name: pmap.get(c.participant_2) || 'Usuário',
        msg_count: countMap.get(c.id) || 0,
      })));
      setLoading(false);
    })();
  }, []);

  const openThread = async (c: Conv) => {
    setSelected(c);
    setThreadLoading(true);
    const { data } = await supabase.from('mensagens')
      .select('id, sender_id, content, is_read, created_at')
      .or(`and(sender_id.eq.${c.participant_1},receiver_id.eq.${c.participant_2}),and(sender_id.eq.${c.participant_2},receiver_id.eq.${c.participant_1})`)
      .order('created_at');
    const pmap = new Map<string, string>([[c.participant_1, c.p1_name], [c.participant_2, c.p2_name]]);
    setThread((data || []).map(m => ({
      id: m.id, sender_id: m.sender_id, sender_name: pmap.get(m.sender_id) || 'Usuário',
      content: m.content, is_read: m.is_read, created_at: m.created_at,
    })));
    setThreadLoading(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return convs.filter(c => {
      if (filter === 'reported' && !c.has_active_report) return false;
      if (q && !c.p1_name.toLowerCase().includes(q) && !c.p2_name.toLowerCase().includes(q) && !(c.last_message || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [convs, filter, query]);

  const reportedCount = convs.filter(c => c.has_active_report).length;

  if (selected) return (
    <div className="p-6 space-y-4">
      <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar</button>
      <Card className={`border ${selected.has_active_report ? 'border-destructive/60 bg-destructive/5' : 'border-border/50'}`}>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {selected.p1_name} ↔ {selected.p2_name}
              </h2>
              <p className="text-xs text-muted-foreground">Categoria: {selected.category} · {selected.msg_count} mensagens</p>
            </div>
            {selected.has_active_report && (
              <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Denunciada</Badge>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 border border-border/40 rounded-lg p-3 bg-background/50">
            {threadLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> :
              thread.length === 0 ? <p className="text-sm text-muted-foreground text-center">Sem mensagens.</p> :
              thread.map(m => (
                <div key={m.id} className={`p-2.5 rounded-lg border ${m.sender_id === selected.participant_1 ? 'border-primary/30 bg-primary/5' : 'border-accent/30 bg-accent/5 ml-8'}`}>
                  <div className="text-[11px] font-semibold text-muted-foreground">{m.sender_name} · {new Date(m.created_at).toLocaleString('pt-BR')}</div>
                  <div className="text-sm mt-0.5 whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /> Mensagens</h1>
        <p className="text-muted-foreground text-sm">Supervisão de conversas (agrupadas)</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="py-4 px-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10"><MessageSquare className="h-5 w-5 text-blue-400" /></div>
          <div><p className="text-2xl font-bold">{convs.length}</p><p className="text-xs text-muted-foreground">Conversas</p></div>
        </CardContent></Card>
        <Card><CardContent className="py-4 px-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
          <div><p className="text-2xl font-bold text-destructive">{reportedCount}</p><p className="text-xs text-muted-foreground">Denunciadas</p></div>
        </CardContent></Card>
        <Card><CardContent className="py-4 px-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10"><MessageSquare className="h-5 w-5 text-green-400" /></div>
          <div><p className="text-2xl font-bold">{convs.length - reportedCount}</p><p className="text-xs text-muted-foreground">Saudáveis</p></div>
        </CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por usuário ou conteúdo..."
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm" />
        </div>
        <button onClick={() => setFilter('all')} className={`px-3 py-2 rounded-lg text-xs font-semibold border ${filter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>Todas</button>
        <button onClick={() => setFilter('reported')} className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1 ${filter === 'reported' ? 'bg-destructive text-destructive-foreground border-destructive' : 'border-border text-destructive'}`}>
          <AlertTriangle className="h-3.5 w-3.5" />Apenas denunciadas
        </button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <div className="divide-y divide-border">
              {filtered.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">Nenhuma conversa.</p>
              ) : filtered.map(c => (
                <button key={c.id} onClick={() => openThread(c)}
                  className={`w-full text-left p-4 hover:bg-muted/30 transition-colors flex items-center gap-3 ${c.has_active_report ? 'bg-destructive/5 border-l-4 border-destructive' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{c.p1_name} ↔ {c.p2_name}</span>
                      {c.has_active_report && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />Denunciada</Badge>}
                      <Badge variant="outline" className="text-[10px]">{c.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">{c.last_message || '—'}</p>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground shrink-0">
                    <div>{c.msg_count} msgs</div>
                    <div>{c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

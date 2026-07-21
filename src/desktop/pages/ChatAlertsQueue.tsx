// ECA Digital: fila de revisão humana dos alertas de IA em chats de menores.
// Regra: nunca bloquear automaticamente — sempre humano decide.
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AdminPageHeader } from '@/desktop/components/AdminPageHeader';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Check, AlertTriangle, ShieldAlert } from 'lucide-react';

type Row = {
  id: string; kind: string; severity: 'low' | 'medium' | 'high' | 'critical';
  snippet: string | null; status: string; minor_id: string; peer_id: string | null;
  conversation_id: string | null; created_at: string; action_taken: string | null;
};

const sevTone: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-yellow-500/15 text-yellow-500',
  high: 'bg-orange-500/15 text-orange-500',
  critical: 'bg-red-500/20 text-red-500',
};

export default function ChatAlertsQueue() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<'pending' | 'reviewed_safe' | 'reviewed_action'>('pending');
  const [action, setAction] = useState('');

  const load = useCallback(async () => {
    const { data } = await (supabase as any).from('chat_ai_alerts').select('*')
      .eq('status', tab).order('severity', { ascending: false }).order('created_at', { ascending: false }).limit(200);
    setRows((data as Row[]) || []);
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const review = async (id: string, safe: boolean) => {
    const { error } = await (supabase as any).rpc('review_chat_ai_alert', {
      _id: id, _safe: safe, _action: action || (safe ? 'sem-acao' : 'acao-tomada'),
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Revisado');
    setAction(''); load();
  };

  return (
    <div className="p-6 space-y-4">
      <AdminPageHeader
        icon={ShieldAlert}
        title="Fila de Alertas de IA — Chat de Menor"
        subtitle="Nenhuma mensagem é bloqueada sem revisão humana."
      />
      <div className="flex gap-2">
        {([
          ['pending', 'Pendentes'],
          ['reviewed_safe', 'Revisadas OK'],
          ['reviewed_action', 'Ação tomada'],
        ] as const).map(([t, l]) => (
          <Button key={t} size="sm" variant={tab === t ? 'default' : 'outline'} onClick={() => setTab(t)}>{l}</Button>
        ))}
      </div>

      {rows.length === 0 && <p className="text-sm text-muted-foreground">Nada aqui.</p>}

      <div className="grid gap-3">
        {rows.map(r => (
          <div key={r.id} className="border rounded-lg p-4 bg-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={sevTone[r.severity]}>{r.severity}</Badge>
                <span className="text-sm font-medium">{r.kind}</span>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</span>
            </div>
            {r.snippet && (
              <blockquote className="text-sm bg-muted/30 p-2 rounded border-l-2 border-primary">
                "{r.snippet}"
              </blockquote>
            )}
            <div className="text-xs text-muted-foreground">
              Menor: <code>{r.minor_id}</code>{r.peer_id && <> · Peer: <code>{r.peer_id}</code></>}
            </div>
            {r.action_taken && <p className="text-xs">Ação: <strong>{r.action_taken}</strong></p>}

            {tab === 'pending' && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => review(r.id, true)}>
                  <Check className="h-4 w-4" />Marcar seguro
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="gap-1">
                      <AlertTriangle className="h-4 w-4" />Tomar ação
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Registrar ação de moderação</AlertDialogTitle>
                      <AlertDialogDescription>
                        Descreva a ação tomada (avisou responsável, silenciou peer, escalou para admin, etc). Bloqueios de conta seguem pela Moderação normal — aqui só registra a decisão sobre o alerta.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea value={action} onChange={e => setAction(e.target.value)} placeholder="Ação tomada" />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => action.trim() ? review(r.id, false) : toast.error('Descreva a ação')}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

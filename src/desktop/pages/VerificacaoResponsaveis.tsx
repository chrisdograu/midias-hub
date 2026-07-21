// ECA Digital: fila de verificação de responsáveis (CPF + telefone + atestado).
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AdminPageHeader } from '@/desktop/components/AdminPageHeader';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ShieldCheck, ShieldX, ExternalLink } from 'lucide-react';

type Row = {
  id: string; minor_id: string; guardian_cpf: string; guardian_phone: string;
  guardian_full_name: string; atestado_url: string; status: string;
  created_at: string; reason: string | null;
};

export default function VerificacaoResponsaveis() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('guardian_link_requests').select('*')
      .eq('status', tab).order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar');
    setRows((data as Row[]) || []);
    setLoading(false);
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const review = async (id: string, approve: boolean) => {
    const { error } = await (supabase as any).rpc('admin_review_guardian_link', {
      _id: id, _approve: approve, _reason: reason || null,
    });
    if (error) { toast.error(error.message || 'Erro'); return; }
    toast.success(approve ? 'Vínculo aprovado — conta marcada como verificada' : 'Pedido rejeitado');
    setReason('');
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <AdminPageHeader title="Verificação de Responsáveis" subtitle="ECA Digital — Lei 15.211/2025" />
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected'] as const).map(t => (
          <Button key={t} size="sm" variant={tab === t ? 'default' : 'outline'} onClick={() => setTab(t)}>
            {t === 'pending' ? 'Pendentes' : t === 'approved' ? 'Aprovados' : 'Rejeitados'}
          </Button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {!loading && rows.length === 0 && <p className="text-sm text-muted-foreground">Nada aqui.</p>}

      <div className="grid gap-3">
        {rows.map(r => (
          <div key={r.id} className="border rounded-lg p-4 bg-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <strong>{r.guardian_full_name}</strong>
                <span className="text-muted-foreground ml-2">CPF {r.guardian_cpf} · Tel {r.guardian_phone}</span>
              </div>
              <Badge variant="outline">{new Date(r.created_at).toLocaleString('pt-BR')}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">Menor: <code>{r.minor_id}</code></div>
            <a href={r.atestado_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary text-sm hover:underline">
              <ExternalLink className="h-3 w-3" /> Ver atestado
            </a>
            {r.reason && <p className="text-xs text-muted-foreground">Motivo: {r.reason}</p>}

            {tab === 'pending' && (
              <div className="flex gap-2 pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" className="gap-1"><ShieldCheck className="h-4 w-4" />Aprovar</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Aprovar vínculo de responsável</AlertDialogTitle>
                      <AlertDialogDescription>
                        Confirmo que verifiquei CPF, telefone e atestado. A conta do menor será marcada como verificada e receberá o badge "Conta Verificada".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Observação (opcional)" />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => review(r.id, true)}>Aprovar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="gap-1"><ShieldX className="h-4 w-4" />Rejeitar</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rejeitar vínculo</AlertDialogTitle>
                      <AlertDialogDescription>Explique o motivo — o menor será notificado.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Motivo obrigatório" />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => reason.trim() ? review(r.id, false) : toast.error('Informe o motivo')}>Rejeitar</AlertDialogAction>
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

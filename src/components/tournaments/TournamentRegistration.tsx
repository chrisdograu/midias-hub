import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import { Sparkles, ShieldAlert, CreditCard, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tournament: any;
  isFull: boolean;
  onSuccess: () => void;
};

export default function TournamentRegistration({ open, onOpenChange, tournament, isFull, onSuccess }: Props) {
  const { user } = useAuth();
  const [adult, setAdult] = useState(false);
  const [refundAck, setRefundAck] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPaid = Number(tournament?.entry_price || 0) > 0;
  const isMonthly = tournament?.kind === 'monthly';
  const prizeDist = tournament?.prize_distribution || { first: 0, second: 0, third: 0 };
  const refundText = tournament?.refund_policy
    || 'Faltas confirmadas geram reembolso de 50% do valor. Cancelamento até 48h antes: 100%. Após início: sem reembolso.';

  const canSubmit = adult && refundAck && terms && !loading;

  const submit = async () => {
    if (!user) { toast.error('Entre para participar'); return; }
    setLoading(true);
    try {
      if (isFull) {
        const { error } = await supabase.from('tournament_waitlist' as any).insert({
          tournament_id: tournament.id, user_id: user.id,
        });
        if (error) throw error;
        toast.success('Você entrou na fila de espera!');
      } else {
        // Simulated payment for academic context (TCC)
        if (isPaid) {
          await new Promise(r => setTimeout(r, 800)); // fake processing
        }
        const { error } = await supabase.from('tournament_participants' as any).insert({
          tournament_id: tournament.id, user_id: user.id,
        });
        if (error) throw error;
        toast.success(isPaid ? `Inscrição confirmada (R$ ${Number(tournament.entry_price).toFixed(2)} simulado)` : 'Inscrição confirmada!');
      }
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao inscrever');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFull ? <Clock className="h-5 w-5 text-amber-500" /> : <Sparkles className="h-5 w-5 text-primary" />}
            {isFull ? 'Entrar na fila de espera' : `Inscrição — ${tournament?.title}`}
          </DialogTitle>
          <DialogDescription>
            {isMonthly ? 'Torneio mensal' : 'Torneio semanal'} • {tournament?.type}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isPaid && !isFull && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Taxa de inscrição</span>
                <span className="text-lg font-bold tabular-nums">R$ {Number(tournament.entry_price).toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Distribuição: 🥇 R$ {Number(prizeDist.first || 0).toFixed(0)} • 🥈 R$ {Number(prizeDist.second || 0).toFixed(0)} • 🥉 R$ {Number(prizeDist.third || 0).toFixed(0)}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-amber-300 mb-1">Política de reembolso</p>
                <p className="text-muted-foreground leading-relaxed">{refundText}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox checked={adult} onCheckedChange={v => setAdult(!!v)} className="mt-0.5" />
              <span className="text-sm leading-snug">Confirmo que tenho <strong>18 anos ou mais</strong>.</span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox checked={refundAck} onCheckedChange={v => setRefundAck(!!v)} className="mt-0.5" />
              <span className="text-sm leading-snug">Li e aceito a política de reembolso e regras de faltas.</span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox checked={terms} onCheckedChange={v => setTerms(!!v)} className="mt-0.5" />
              <span className="text-sm leading-snug">Aceito os termos do torneio e código de conduta.</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit} className="bg-gradient-to-r from-primary to-purple-500">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : isFull ? <Clock className="h-4 w-4 mr-2" />
              : isPaid ? <CreditCard className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {isFull ? 'Entrar na fila' : isPaid ? `Pagar R$ ${Number(tournament.entry_price).toFixed(2)}` : 'Confirmar inscrição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

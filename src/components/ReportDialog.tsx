import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type TargetType =
  | 'profile'
  | 'anuncio'
  | 'forum_post'
  | 'comentario_forum'
  | 'review'
  | 'comentario_review'
  | 'mensagem'
  | 'conversa';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: TargetType;
  targetId: string;
  label?: string;
}

const REASONS = [
  'Spam',
  'Conteúdo ofensivo',
  'Assédio',
  'Golpe / fraude',
  'Conteúdo sexual',
  'Violência',
  'Outro',
];

// Denúncias com contexto de marketplace/troca ganham campo opcional de evidência
// (link de print, foto, mensagem). Não trava o envio — só sinaliza que resolve mais rápido.
const MARKETPLACE_TARGETS: TargetType[] = ['anuncio', 'mensagem', 'conversa'];

export function ReportDialog({ open, onClose, targetType, targetId, label }: ReportDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState(REASONS[0]);
  const [desc, setDesc] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const showEvidence = MARKETPLACE_TARGETS.includes(targetType);

  const submit = async () => {
    if (!user) {
      toast.error('Entre para denunciar');
      return;
    }
    setSubmitting(true);
    const evidenceTrim = evidence.trim();
    const descTrim = desc.trim();
    const fullDescription = [
      descTrim || null,
      evidenceTrim ? `[Evidência anexada pelo denunciante]: ${evidenceTrim}` : null,
    ].filter(Boolean).join('\n\n') || null;
    const { error } = await supabase.from('denuncias').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      description: fullDescription,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Erro ao denunciar');
      return;
    }
    toast.success('Denúncia enviada para análise');
    setDesc('');
    setEvidence('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-5 space-y-3 border border-border max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Flag className="h-4 w-4 text-destructive" /> Denunciar {label || 'conteúdo'}
              </h3>
              <button onClick={onClose}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-background border border-border rounded-lg text-sm"
            >
              {REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Detalhes (opcional)..."
              className="w-full p-3 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {showEvidence && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-xs text-foreground font-semibold">
                  Anexar evidência (opcional, mas ajuda muito)
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Cole um link de print da conversa, foto do item ou comprovante. Denúncias com evidência são resolvidas mais rápido — protege quem denuncia e quem foi denunciado.
                </p>
                <input
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  maxLength={500}
                  placeholder="https://... ou descrição da evidência"
                  className="w-full p-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-secondary text-sm font-semibold">
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar denúncia'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

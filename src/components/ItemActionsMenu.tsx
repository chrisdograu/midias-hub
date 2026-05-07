import { useState, ReactNode } from 'react';
import { MoreVertical, Copy, Flag, Trash2, Link as LinkIcon, Check } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { toast } from 'sonner';
import { ReportDialog } from '@/components/ReportDialog';

type ReportType =
  | 'profile'
  | 'anuncio'
  | 'forum_post'
  | 'comentario_forum'
  | 'review'
  | 'comentario_review'
  | 'mensagem'
  | 'conversa';

interface Props {
  /** Texto a ser copiado (mensagem, conteúdo do post, comentário). */
  copyText?: string;
  /** Link absoluto/relativo a ser copiado (compartilhar). */
  shareUrl?: string;
  /** Se true mostra a opção de excluir e chama onDelete. */
  canDelete?: boolean;
  onDelete?: () => void | Promise<void>;
  deleteConfirm?: string;
  /** Se setado, mostra a opção "Denunciar" e abre o ReportDialog. */
  reportType?: ReportType;
  reportTargetId?: string;
  reportLabel?: string;
  /** Cor/tamanho do botão. */
  className?: string;
  iconClassName?: string;
  /** Slot para itens extras no menu. */
  extra?: ReactNode;
}

export function ItemActionsMenu({
  copyText,
  shareUrl,
  canDelete,
  onDelete,
  deleteConfirm = 'Tem certeza que deseja excluir?',
  reportType,
  reportTargetId,
  reportLabel,
  className = '',
  iconClassName = 'h-4 w-4',
  extra,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const close = () => setOpen(false);

  const doCopy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(msg);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error('Não foi possível copiar');
    }
    close();
  };

  const doDelete = async () => {
    close();
    if (deleteConfirm && !confirm(deleteConfirm)) return;
    await onDelete?.();
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            aria-label="Mais ações"
            className={`p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors ${className}`}
          >
            <MoreVertical className={iconClassName} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={4}
          className="w-44 p-1 rounded-xl"
          onClick={(e) => e.stopPropagation()}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {copyText && (
            <MenuItem icon={copied ? Check : Copy} label="Copiar texto" onClick={() => doCopy(copyText, 'Texto copiado')} />
          )}
          {shareUrl && (
            <MenuItem
              icon={LinkIcon}
              label="Copiar link"
              onClick={() => {
                const abs = shareUrl.startsWith('http') ? shareUrl : `${window.location.origin}${shareUrl}`;
                doCopy(abs, 'Link copiado');
              }}
            />
          )}
          {extra}
          {reportType && reportTargetId && (
            <MenuItem
              icon={Flag}
              label="Denunciar"
              tone="destructive"
              onClick={() => { close(); setReportOpen(true); }}
            />
          )}
          {canDelete && (
            <MenuItem icon={Trash2} label="Excluir" tone="destructive" onClick={doDelete} />
          )}
        </PopoverContent>
      </Popover>

      {reportType && reportTargetId && (
        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType={reportType}
          targetId={reportTargetId}
          label={reportLabel}
        />
      )}
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  tone?: 'destructive';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm hover:bg-muted/60 transition-colors ${
        tone === 'destructive' ? 'text-destructive' : 'text-foreground'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

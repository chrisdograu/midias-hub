import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, Undo2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function EntityTimelineDrawer({
  open, onOpenChange, entity, entityId, title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entity: string;
  entityId: string | null;
  title?: string;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !entityId) return;
    setLoading(true);
    supabase.from('admin_logs').select('*').eq('entity', entity).eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setRows(data || []); setLoading(false); });
  }, [open, entity, entityId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[460px] sm:max-w-[460px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> {title || 'Timeline'}</SheetTitle>
        </SheetHeader>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sem registros para este item.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map(r => (
              <div key={r.id} className="border-l-2 border-primary/40 pl-3 py-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={r.reverted_at ? 'secondary' : 'default'} className="font-mono text-[10px]">{r.action}</Badge>
                  {r.reverted_at && <Badge variant="outline" className="text-[10px]"><Undo2 className="h-3 w-3 mr-1" />revertido</Badge>}
                  <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</span>
                </div>
                {r.reason && <p className="text-xs mt-1">{r.reason}</p>}
                {r.payload && Object.keys(r.payload).length > 0 && (
                  <pre className="text-[10px] bg-muted/40 rounded p-1.5 mt-1 overflow-x-auto">{JSON.stringify(r.payload, null, 2)}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

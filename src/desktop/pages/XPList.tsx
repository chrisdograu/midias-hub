import { useEffect, useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageHeader } from '../components/AdminPageHeader';

interface Props { platform: 'mobile' | 'web' }

const MOBILE_ACTIONS = ['forum_post', 'forum_reply', 'tournament_rank_1', 'tournament_rank_2', 'tournament_rank_3', 'tournament_signup'];

export default function XPList({ platform }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let q = supabase.from('user_xp_log').select('user_id, action, xp, created_at').order('created_at', { ascending: false }).limit(300);
      if (platform === 'mobile') q = q.in('action', MOBILE_ACTIONS);
      else q = q.in('action', ['purchase', 'review']);
      const { data } = await q;
      setRows(data || []); setLoading(false);
    })();
  }, [platform]);

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Zap} title={`XP ${platform === 'mobile' ? 'Mobile' : 'Web'}`}
        subtitle={`Distribuição de XP na plataforma ${platform}`} />
      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Ação</TableHead><TableHead>XP</TableHead><TableHead>Quando</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sem registros</TableCell></TableRow> :
                rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.user_id.slice(0, 8)}</TableCell>
                    <TableCell>{r.action}</TableCell>
                    <TableCell className="font-bold text-primary">+{r.xp}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}

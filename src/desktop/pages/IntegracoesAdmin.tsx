import { useEffect, useState } from 'react';
import { Plug, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageHeader } from '../components/AdminPageHeader';

const PLATAFORMAS = ['steam', 'xbox', 'psn', 'discord', 'twitch', 'youtube'];

export default function IntegracoesAdmin() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const result: Record<string, number> = {};
      for (const p of PLATAFORMAS) {
        const { count } = await supabase.from('connected_platforms').select('*', { count: 'exact', head: true }).eq('platform', p);
        result[p] = count || 0;
      }
      setStats(result); setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Plug} title="Integrações" subtitle="Conexões com plataformas externas dos usuários" />
      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Plataforma</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Usuários conectados</TableHead></TableRow></TableHeader>
            <TableBody>
              {PLATAFORMAS.map(p => (
                <TableRow key={p}>
                  <TableCell className="font-medium capitalize">{p}</TableCell>
                  <TableCell><Badge variant="secondary">Disponível</Badge></TableCell>
                  <TableCell className="text-right font-mono">{stats[p] ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}

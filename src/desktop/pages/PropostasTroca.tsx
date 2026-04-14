import { useState, useEffect } from 'react';
import { ArrowLeftRight, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { tradeStatusLabels, tradeStatusColors } from '../mockData';

interface Proposal {
  id: string; proposer_name: string; seller_name: string; anuncio_title: string;
  offered_item: string; status: string; proposer_confirmed: boolean; seller_confirmed: boolean; created_at: string;
}

export default function PropostasTroca() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from('trade_proposals').select('*').order('created_at', { ascending: false });
      if (!data) { setLoading(false); return; }

      const proposerIds = [...new Set(data.map(p => p.proposer_id))];
      const anuncioIds = [...new Set(data.map(p => p.anuncio_id))];

      const [{ data: profiles }, { data: anuncios }] = await Promise.all([
        supabase.from('profiles').select('id, display_name').in('id', proposerIds),
        supabase.from('anuncios').select('id, title, seller_id').in('id', anuncioIds),
      ]);

      const profileMap = new Map<string, string>(profiles?.map(p => [p.id, p.display_name || 'Usuário']) || []);
      const anuncioMap = new Map<string, any>(anuncios?.map(a => [a.id, a])) || []);

      // Get seller names
      const sellerIds = [...new Set(anuncios?.map(a => a.seller_id) || [])];
      const { data: sellerProfiles } = sellerIds.length > 0 ? await supabase.from('profiles').select('id, display_name').in('id', sellerIds) : { data: [] };
      const sellerMap = new Map<string, string>(sellerProfiles?.map(p => [p.id, p.display_name || 'Vendedor']) || []);

      setProposals(data.map(p => {
        const anuncio = anuncioMap.get(p.anuncio_id);
        return {
          id: p.id, proposer_name: profileMap.get(p.proposer_id) || 'Usuário',
          seller_name: anuncio ? (sellerMap.get(anuncio.seller_id) || 'Vendedor') : 'Vendedor',
          anuncio_title: anuncio?.title || 'Anúncio', offered_item: p.offered_item,
          status: p.status, proposer_confirmed: p.proposer_confirmed,
          seller_confirmed: p.seller_confirmed, created_at: p.created_at,
        };
      }));
      setLoading(false);
    };
    fetch();
  }, []);

  const counts = {
    pending: proposals.filter(p => p.status === 'pending').length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
  };

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><ArrowLeftRight className="h-6 w-6 text-primary" /> Propostas de Troca</h1><p className="text-muted-foreground text-sm">Acompanhamento de trocas</p></div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendentes', value: counts.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Aceitas', value: counts.accepted, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Recusadas', value: counts.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="border-border">
              <TableHead>Proponente</TableHead><TableHead>Vendedor</TableHead><TableHead>Anúncio</TableHead>
              <TableHead>Item Oferecido</TableHead><TableHead className="text-center">Confirmações</TableHead>
              <TableHead className="text-center">Status</TableHead><TableHead>Data</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {proposals.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma proposta</TableCell></TableRow>
              ) : proposals.map(p => (
                <TableRow key={p.id} className="border-border hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{p.proposer_name}</TableCell>
                  <TableCell className="text-sm">{p.seller_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{p.anuncio_title}</TableCell>
                  <TableCell className="text-sm truncate max-w-[200px]">{p.offered_item}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center text-xs">
                      <span className={p.proposer_confirmed ? 'text-green-400' : 'text-muted-foreground'}>Prop: {p.proposer_confirmed ? '✓' : '✗'}</span>
                      <span className={p.seller_confirmed ? 'text-green-400' : 'text-muted-foreground'}>Vend: {p.seller_confirmed ? '✓' : '✗'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center"><Badge className={tradeStatusColors[p.status] || ''}>{tradeStatusLabels[p.status] || p.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

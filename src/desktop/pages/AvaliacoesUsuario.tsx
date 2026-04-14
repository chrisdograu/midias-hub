import { useState, useEffect } from 'react';
import { Star, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string; reviewer_name: string; reviewed_name: string; anuncio_title: string;
  rating: number; comment: string | null; created_at: string;
}

export default function AvaliacoesUsuario() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase.from('avaliacoes_usuario').select('*').order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.flatMap(a => [a.reviewer_id, a.reviewed_id]))];
    const anuncioIds = [...new Set(data.map(a => a.anuncio_id).filter(Boolean))] as string[];

    const [{ data: profiles }, { data: anuncios }] = await Promise.all([
      supabase.from('profiles').select('id, display_name').in('id', userIds),
      anuncioIds.length > 0 ? supabase.from('anuncios').select('id, title').in('id', anuncioIds) : { data: [] },
    ]);

    const profileMap = new Map<string, string>(profiles?.map(p => [p.id, p.display_name || 'Usuário']) || []);
    const anuncioMap = new Map<string, string>(anuncios?.map(a => [a.id, a.title])) || []);

    setReviews(data.map(a => ({
      id: a.id, reviewer_name: profileMap.get(a.reviewer_id) || 'Usuário',
      reviewed_name: profileMap.get(a.reviewed_id) || 'Usuário',
      anuncio_title: a.anuncio_id ? (anuncioMap.get(a.anuncio_id) || 'Anúncio') : '—',
      rating: a.rating, comment: a.comment, created_at: a.created_at,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from('avaliacoes_usuario').delete().eq('id', id);
    toast({ title: 'Avaliação removida' }); fetchReviews();
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, a) => s + a.rating, 0) / reviews.length).toFixed(1) : '0';

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Star className="h-6 w-6 text-primary" /> Avaliações de Usuários</h1><p className="text-muted-foreground text-sm">Reviews entre compradores e vendedores</p></div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Avaliações', value: reviews.length, color: 'text-blue-400' },
          { label: 'Média Geral', value: avgRating, color: 'text-yellow-400' },
          { label: 'Negativas (≤2)', value: reviews.filter(a => a.rating <= 2).length, color: 'text-red-400' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-4 px-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="border-border">
              <TableHead>Avaliador</TableHead><TableHead>Avaliado</TableHead><TableHead>Anúncio</TableHead>
              <TableHead className="text-center">Nota</TableHead><TableHead>Comentário</TableHead>
              <TableHead>Data</TableHead><TableHead className="text-center w-24">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {reviews.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma avaliação</TableCell></TableRow>
              ) : reviews.map(a => (
                <TableRow key={a.id} className="border-border hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{a.reviewer_name}</TableCell>
                  <TableCell className="text-sm">{a.reviewed_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.anuncio_title}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < a.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[250px]">{a.comment || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="h-3 w-3 mr-1" />Remover</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

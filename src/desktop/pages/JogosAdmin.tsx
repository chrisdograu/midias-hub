import { useEffect, useState } from 'react';
import { Gamepad2, Loader2, EyeOff, Eye, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '../components/AdminPageHeader';

const ESTADOS = ['ativo', 'oculto', 'somente_forum', 'somente_loja', 'descontinuado'] as const;
type Estado = typeof ESTADOS[number];

const LABELS: Record<Estado, string> = {
  ativo: 'Ativo', oculto: 'Oculto', somente_forum: 'Somente Fórum',
  somente_loja: 'Somente Loja', descontinuado: 'Descontinuado',
};

interface Jogo { id: string; title: string; estado_publicacao: Estado; stock: number; price: number; }

export default function JogosAdmin() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('produtos').select('id,title,estado_publicacao,stock,price')
      .order('updated_at', { ascending: false });
    setJogos((data || []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateEstado = async (id: string, estado: Estado) => {
    const { error } = await supabase.from('produtos').update({ estado_publicacao: estado } as any).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Estado atualizado');
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Gamepad2} title="Jogos" subtitle="Gerencie o catálogo e o estado de publicação"
        actions={<Button onClick={() => navigate('/desktop/jogos/novo')}><Plus className="h-4 w-4 mr-1" /> Novo jogo</Button>} />
      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Preço</TableHead><TableHead>Estoque</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {jogos.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum jogo</TableCell></TableRow>
                ) : jogos.map(j => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.title}</TableCell>
                    <TableCell>R$ {Number(j.price).toFixed(2)}</TableCell>
                    <TableCell>{j.stock}</TableCell>
                    <TableCell><Badge variant={j.estado_publicacao === 'ativo' ? 'default' : 'secondary'}>{LABELS[j.estado_publicacao]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Select value={j.estado_publicacao} onValueChange={(v) => updateEstado(j.id, v as Estado)}>
                        <SelectTrigger className="w-[180px] inline-flex"><SelectValue /></SelectTrigger>
                        <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{LABELS[e]}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

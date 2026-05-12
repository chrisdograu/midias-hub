import { useState, useEffect } from 'react';
import { Lightbulb, Check, X, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDesktopAuth } from '@/hooks/useDesktopAuth';

type Status = 'pendente' | 'aprovado' | 'rejeitado';

interface Suggestion {
  id: string;
  title: string;
  cover_url: string | null;
  description: string | null;
  status: Status;
  admin_notes: string | null;
  created_product_id: string | null;
  created_at: string;
  requested_by: string;
  author_name: string;
}

export default function SugestoesJogos() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | Status>('pendente');
  const [approveOpen, setApproveOpen] = useState<Suggestion | null>(null);
  const [rejectOpen, setRejectOpen] = useState<Suggestion | null>(null);
  const [form, setForm] = useState({ title: '', cover_url: '', description: '', price: '0', publisher: '', admin_notes: '' });
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useDesktopAuth();

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('game_suggestions')
      .select('id, title, cover_url, description, status, admin_notes, created_product_id, created_at, requested_by')
      .order('created_at', { ascending: false });
    if (!data) { setItems([]); setLoading(false); return; }
    const userIds = [...new Set(data.map(s => s.requested_by))];
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds);
    const pm = new Map((profiles || []).map(p => [p.id, p.display_name || 'Usuário']));
    setItems(data.map(s => ({ ...s, author_name: pm.get(s.requested_by) || 'Usuário' } as Suggestion)));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openApprove = (s: Suggestion) => {
    setApproveOpen(s);
    setForm({
      title: s.title,
      cover_url: s.cover_url || '',
      description: s.description || '',
      price: '0',
      publisher: '',
      admin_notes: '',
    });
  };

  const handleApprove = async () => {
    if (!approveOpen || !user) return;
    if (!form.title.trim()) { toast({ title: 'Título obrigatório', variant: 'destructive' }); return; }
    setSaving(true);
    const { data: prod, error: prodError } = await supabase.from('produtos').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      image_url: form.cover_url.trim() || null,
      publisher: form.publisher.trim() || null,
      price: Number(form.price) || 0,
      original_price: Number(form.price) || 0,
      stock: 0,
      is_active: true,
      awaiting_first_stock: true,
      product_type: 'digital',
    }).select('id').single();
    if (prodError || !prod) {
      setSaving(false);
      toast({ title: 'Erro ao criar produto', description: prodError?.message, variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('game_suggestions').update({
      status: 'aprovado',
      created_product_id: prod.id,
      admin_notes: form.admin_notes.trim() || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', approveOpen.id);
    setSaving(false);
    if (error) { toast({ title: 'Erro ao aprovar', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Sugestão aprovada', description: 'Produto criado (oculto até receber estoque) e usuário notificado.' });
    setApproveOpen(null);
    fetchAll();
  };
    if (!rejectOpen || !user) return;
    setSaving(true);
    const { error } = await supabase.from('game_suggestions').update({
      status: 'rejeitado',
      admin_notes: adminNotes.trim() || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', rejectOpen.id);
    setSaving(false);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Sugestão rejeitada', description: 'Usuário notificado.' });
    setRejectOpen(null); setAdminNotes('');
    fetchAll();
  };

  const visible = items.filter(i => filter === 'todas' || i.status === filter);
  const stats = {
    pendente: items.filter(i => i.status === 'pendente').length,
    aprovado: items.filter(i => i.status === 'aprovado').length,
    rejeitado: items.filter(i => i.status === 'rejeitado').length,
  };

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Lightbulb className="h-6 w-6 text-primary" /> Sugestões da Comunidade</h1>
        <p className="text-muted-foreground text-sm">Jogos sugeridos pelos usuários para serem adicionados ao catálogo</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {([
          { key: 'pendente', label: 'Pendentes', value: stats.pendente, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { key: 'aprovado', label: 'Aprovadas', value: stats.aprovado, color: 'text-green-400', bg: 'bg-green-500/10' },
          { key: 'rejeitado', label: 'Rejeitadas', value: stats.rejeitado, color: 'text-red-400', bg: 'bg-red-500/10' },
        ] as const).map(s => (
          <Card key={s.key} className="border-border/50 cursor-pointer" onClick={() => setFilter(s.key)}>
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}><Lightbulb className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {(['pendente', 'aprovado', 'rejeitado', 'todas'] as const).map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f === 'todas' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
          </Button>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="border-border">
              <TableHead>Capa</TableHead><TableHead>Título</TableHead><TableHead>Autor</TableHead>
              <TableHead className="max-w-[300px]">Descrição</TableHead><TableHead>Status</TableHead>
              <TableHead>Data</TableHead><TableHead className="text-center w-32">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma sugestão</TableCell></TableRow>
              ) : visible.map(s => (
                <TableRow key={s.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    {s.cover_url ? (
                      <img src={s.cover_url} alt="" className="w-12 h-16 object-cover rounded" />
                    ) : <div className="w-12 h-16 bg-muted rounded" />}
                  </TableCell>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.author_name}</TableCell>
                  <TableCell className="text-sm max-w-[300px] truncate">{s.description || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'pendente' ? 'secondary' : s.status === 'aprovado' ? 'default' : 'destructive'}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-center">
                    {s.status === 'pendente' ? (
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="default" className="h-7 px-2" onClick={() => openApprove(s)}>
                          <Check className="h-3 w-3 mr-1" />Aprovar
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => setRejectOpen(s)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : s.status === 'aprovado' && s.created_product_id ? (
                      <a href={`/jogo/${s.created_product_id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        Ver produto <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve dialog */}
      <Dialog open={!!approveOpen} onOpenChange={(o) => !o && setApproveOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Aprovar e criar produto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>URL da capa</Label><Input value={form.cover_url} onChange={e => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Publisher</Label><Input value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} /></div>
            <div><Label>Preço inicial (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <p className="text-xs text-muted-foreground">O produto será criado ativo, com estoque 0. Ajuste depois em Produtos/Estoque.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(null)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleApprove} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectOpen} onOpenChange={(o) => !o && setRejectOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar sugestão</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">"{rejectOpen?.title}"</p>
            <div>
              <Label>Motivo (opcional, será mostrado ao usuário)</Label>
              <Textarea rows={3} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Ex.: já existe no catálogo, título inválido..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(null)} disabled={saving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

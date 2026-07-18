import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CLASSIFICACOES: { value: 'L' | '10' | '12' | '14' | '16' | '18'; label: string; hint: string }[] = [
  { value: 'L', label: 'Livre', hint: 'Sem restrição de idade.' },
  { value: '10', label: '10 anos', hint: 'Fantasia leve, competição.' },
  { value: '12', label: '12 anos', hint: 'Violência leve, insinuação.' },
  { value: '14', label: '14 anos', hint: 'Violência, terror leve.' },
  { value: '16', label: '16 anos', hint: 'Violência intensa, drogas.' },
  { value: '18', label: '18 anos', hint: 'Adulto — só maiores.' },
];

export default function CriarJogo() {
  const [form, setForm] = useState({ title: '', description: '', price: 0, original_price: 0, stock: 0, image_url: '', publisher: '' });
  const [featured, setFeatured] = useState(false);
  const [classificacao, setClassificacao] = useState<'L' | '10' | '12' | '14' | '16' | '18'>('L');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const save = async () => {
    if (!form.title.trim()) return toast.error('Título é obrigatório');
    setSaving(true);
    const originalPrice = form.original_price && form.original_price > 0 ? form.original_price : form.price;
    const { error } = await supabase.from('produtos').insert({
      ...form,
      original_price: originalPrice,
      featured,
      classificacao_indicativa: classificacao,
      product_type: 'jogo',
      estado_publicacao: 'ativo',
    } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Jogo criado');
    navigate('/desktop/jogos');
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <AdminPageHeader icon={Sparkles} title="Criar Jogo" subtitle="Cadastre um novo jogo no catálogo" />
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          {(['title', 'publisher', 'image_url'] as const).map(k => (
            <div key={k}><Label className="capitalize">{k.replace('_', ' ')}</Label>
              <Input value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Preço</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><Label>Preço original</Label><Input type="number" step="0.01" value={form.original_price} onChange={e => setForm({ ...form, original_price: Number(e.target.value) })} /></div>
            <div><Label>Estoque</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>Classificação indicativa (ECA Digital — Lei 15.211/2025)</Label>
            <Select value={classificacao} onValueChange={(v: any) => setClassificacao(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLASSIFICACOES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label} — <span className="text-muted-foreground">{c.hint}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Define a idade mínima para o jogo aparecer no catálogo do usuário.</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Switch checked={featured} onCheckedChange={setFeatured} />
            <div>
              <Label className="cursor-pointer">Destacar na Home</Label>
              <p className="text-xs text-muted-foreground">Aparece na prateleira de destaques quando ativo.</p>
            </div>
          </div>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar jogo</Button>
        </CardContent>
      </Card>
    </div>
  );
}

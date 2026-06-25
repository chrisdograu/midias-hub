import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2, Trash2, Award, UserPlus, Crown, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Badge {
  id: string; name: string; description: string; icon: string; category: string;
  image_url?: string | null; is_custom?: boolean | null;
}
interface UserTitle { id: string; user_id: string; name: string; source: string; awarded_at: string; }

const CATEGORY_LABELS: Record<string, string> = {
  store: 'Loja & Compras', community: 'Comunidade', level: 'Nível & XP',
  tournament: 'Torneios', special: 'Especiais', general: 'Gerais',
};

export default function BadgesAdmin() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [titles, setTitles] = useState<(UserTitle & { display_name?: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<Badge | null>(null);
  const [titleOpen, setTitleOpen] = useState(false);
  const [form, setForm] = useState<any>({ id: '', name: '', description: '', icon: '🏆', category: 'special', is_custom: true, image_url: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [titleForm, setTitleForm] = useState({ name: '', user_email: '' });
  const [assignEmail, setAssignEmail] = useState('');

  const load = async () => {
    setLoading(true);
    const [{ data: bs }, { data: ts }] = await Promise.all([
      supabase.from('badge_catalog' as any).select('*').order('category').order('id'),
      supabase.from('user_titles' as any).select('id, user_id, name, source, awarded_at, profiles:user_id(display_name)').order('awarded_at', { ascending: false }).limit(100),
    ]);
    setBadges((bs as any) || []);
    setTitles(((ts as any) || []).map((t: any) => ({ ...t, display_name: t.profiles?.display_name })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.id || !form.name) return toast.error('ID e Nome obrigatórios');
    let image_url = form.image_url || null;
    if (imageFile) {
      const path = `badges/${form.id}-${Date.now()}.${imageFile.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, imageFile);
      if (upErr) return toast.error('Erro ao subir imagem');
      const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
      image_url = pub.publicUrl;
    }
    const { error } = await supabase.from('badge_catalog' as any).insert({ ...form, image_url, is_custom: true });
    if (error) return toast.error(error.message);
    toast.success('Badge criado!');
    setOpen(false); setImageFile(null);
    setForm({ id: '', name: '', description: '', icon: '🏆', category: 'special', is_custom: true, image_url: '' });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este badge?')) return;
    const { error } = await supabase.from('badge_catalog' as any).delete().eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  const assignBadge = async () => {
    if (!assignOpen || !assignEmail.trim()) return;
    const { data: prof } = await supabase.from('profiles').select('id').or(`username.eq.${assignEmail.trim()},display_name.eq.${assignEmail.trim()}`).limit(1).maybeSingle();
    if (!prof) return toast.error('Usuário não encontrado (busque por username ou display_name exato)');
    const { error } = await supabase.from('user_badges' as any).insert({ user_id: prof.id, badge_id: assignOpen.id });
    if (error) return toast.error(error.message);
    toast.success('Badge atribuído!');
    setAssignOpen(null); setAssignEmail('');
  };

  const createTitle = async () => {
    if (!titleForm.name || !titleForm.user_email) return toast.error('Nome e usuário obrigatórios');
    const { data: prof } = await supabase.from('profiles').select('id').or(`username.eq.${titleForm.user_email.trim()},display_name.eq.${titleForm.user_email.trim()}`).limit(1).maybeSingle();
    if (!prof) return toast.error('Usuário não encontrado');
    const { error } = await supabase.from('user_titles' as any).insert({ user_id: prof.id, name: titleForm.name, source: 'achievement' });
    if (error) return toast.error(error.message);
    toast.success('Título atribuído!');
    setTitleOpen(false); setTitleForm({ name: '', user_email: '' });
    load();
  };

  const removeTitle = async (id: string) => {
    if (!confirm('Remover este título?')) return;
    await supabase.from('user_titles' as any).delete().eq('id', id);
    load();
  };

  const grouped = badges.reduce<Record<string, Badge[]>>((acc, b) => {
    const cat = b.is_custom ? 'custom' : b.category;
    (acc[cat] ||= []).push(b); return acc;
  }, {});
  const cats = ['custom', ...Object.keys(CATEGORY_LABELS).filter(c => grouped[c]?.length)];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Award className="h-6 w-6 text-primary" /> Badges & Títulos</h1>
          <p className="text-sm text-muted-foreground">Gerencie conquistas, badges personalizados e títulos.</p>
        </div>
      </div>

      <Tabs defaultValue="badges">
        <TabsList>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="titles">Títulos de conquista ({titles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Novo Badge Personalizado</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar badge personalizado</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>ID (slug)</Label><Input value={form.id} onChange={e => setForm({ ...form, id: e.target.value.replace(/\s+/g, '_').toLowerCase() })} /></div>
                  <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Ícone (emoji) ou imagem</Label>
                    <div className="flex gap-2 items-center">
                      <Input className="w-24" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} maxLength={4} />
                      <label className="flex-1 flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-md cursor-pointer text-sm text-muted-foreground hover:border-primary">
                        <Upload className="h-4 w-4" />
                        {imageFile ? imageFile.name.slice(0, 20) : 'Upload de imagem (opcional)'}
                        <input type="file" accept="image/*" hidden onChange={e => setImageFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>
                  <div><Label>Categoria</Label>
                    <select className="w-full bg-background border border-border rounded-md p-2 text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={create}>Criar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Tabs defaultValue={cats[0] || 'custom'}>
              <TabsList className="flex-wrap h-auto">
                {cats.map(c => <TabsTrigger key={c} value={c}>{c === 'custom' ? '⭐ Personalizados' : CATEGORY_LABELS[c]} ({grouped[c]?.length || 0})</TabsTrigger>)}
              </TabsList>
              {cats.map(c => (
                <TabsContent key={c} value={c}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(grouped[c] || []).map(b => (
                      <div key={b.id} className={`bg-card border ${b.is_custom ? 'border-yellow-500/40 shadow-[0_0_8px_rgba(234,179,8,0.15)]' : 'border-border'} rounded-lg p-4 flex gap-3 items-start`}>
                        {b.image_url ? <img src={b.image_url} alt="" className="w-12 h-12 rounded object-cover" /> : <div className="text-3xl">{b.icon}</div>}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{b.name}{b.is_custom && <span className="ml-1 text-[10px] text-yellow-500">★ CUSTOM</span>}</h3>
                          <p className="text-xs text-muted-foreground mb-1">{b.id}</p>
                          <p className="text-sm text-muted-foreground">{b.description}</p>
                          {b.is_custom && (
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => setAssignOpen(b)}>
                              <UserPlus className="h-3.5 w-3.5 mr-1" /> Atribuir
                            </Button>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="titles" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setTitleOpen(true)}><Plus className="h-4 w-4 mr-1" /> Criar Título</Button>
          </div>
          {titles.length === 0 ? <p className="text-sm text-muted-foreground text-center py-12">Nenhum título atribuído ainda.</p> : (
            <div className="space-y-2">
              {titles.map(t => (
                <div key={t.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.display_name || t.user_id.slice(0, 8)} · {new Date(t.awarded_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => removeTitle(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Assign badge dialog */}
      <Dialog open={!!assignOpen} onOpenChange={() => setAssignOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atribuir "{assignOpen?.name}"</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Username ou nome exibido do usuário</Label>
            <Input value={assignEmail} onChange={e => setAssignEmail(e.target.value)} placeholder="ex: joaogamer" />
          </div>
          <DialogFooter><Button onClick={assignBadge}>Atribuir</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create title dialog */}
      <Dialog open={titleOpen} onOpenChange={setTitleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo título de conquista</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do título</Label><Input value={titleForm.name} onChange={e => setTitleForm({ ...titleForm, name: e.target.value })} placeholder="ex: Mestre do Marketplace" /></div>
            <div><Label>Usuário (username ou display_name)</Label><Input value={titleForm.user_email} onChange={e => setTitleForm({ ...titleForm, user_email: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={createTitle}>Criar e atribuir</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

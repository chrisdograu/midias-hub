// Página de admin para CRUD das recompensas cosméticas por jogo.
// Permite filtrar por jogo, upload de PNG para o bucket 'game-rewards',
// editar tipo/raridade/critério de desbloqueio com payload JSON validado.
import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Loader2, Plus, Trash2, Edit, Upload, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { CosmeticPreview } from '@/components/cosmetics/CosmeticPreview';
import { GamePagePreviewSimulator } from '@/components/cosmetics/GamePagePreviewSimulator';
import { GameReward, RewardKind, RewardRarity, KIND_LABEL, RARITY_COLOR } from '@/hooks/useCosmetics';

const KINDS: RewardKind[] = ['avatar_frame','profile_banner','profile_accent','game_card_skin','game_page_theme','character_icon','sticker'];
const RARITIES: RewardRarity[] = ['common','rare','epic','legendary','mythic'];
const CRITERIA: { type: string; label: string; fields?: { key: string; label: string; type: 'number'|'text' }[] }[] = [
  { type: 'library_owned', label: 'Tem o jogo na biblioteca' },
  { type: 'completed', label: 'Zerou o jogo' },
  { type: 'platinum', label: 'Platinou o jogo' },
  { type: 'all_achievements', label: 'Tem todas as conquistas do jogo' },
  { type: 'playtime', label: 'X horas jogadas', fields: [{ key: 'min_hours', label: 'Horas mínimas', type: 'number' }] },
  { type: 'reviews_for_game', label: 'X reviews do jogo', fields: [{ key: 'count', label: 'Quantidade', type: 'number' }] },
  { type: 'forum_posts_for_game', label: 'X posts no fórum do jogo', fields: [{ key: 'count', label: 'Quantidade', type: 'number' }] },
  { type: 'forum_post_likes', label: 'Post no fórum com X likes', fields: [{ key: 'min_likes', label: 'Likes mínimos', type: 'number' }] },
  { type: 'review_likes', label: 'Review com X likes', fields: [{ key: 'min_likes', label: 'Likes mínimos', type: 'number' }] },
  { type: 'screenshots_for_game', label: 'X screenshots do jogo', fields: [{ key: 'count', label: 'Quantidade', type: 'number' }] },
  { type: 'clips_for_game', label: 'X clipes do jogo', fields: [{ key: 'count', label: 'Quantidade', type: 'number' }] },
  { type: 'achievement', label: 'Conquista específica', fields: [{ key: 'achievement_name', label: 'Nome da conquista', type: 'text' }] },
];

interface Jogo { id: string; title: string }

const emptyForm = () => ({
  id: '' as string | undefined,
  product_id: '',
  kind: 'avatar_frame' as RewardKind,
  rarity: 'common' as RewardRarity,
  name: '',
  description: '',
  asset_url: '',
  color: '#14B8A6',
  emoji: '✨',
  criteria_type: 'library_owned',
  criteria_params: {} as Record<string, any>,
  is_active: true,
});

export default function GameRewardsAdmin() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [productId, setProductId] = useState<string>('');
  const [rewards, setRewards] = useState<GameReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ReturnType<typeof emptyForm> | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from('produtos').select('id,title').order('title').then(({ data }) => setJogos((data || []) as any));
  }, []);

  useEffect(() => {
    if (!productId) { setRewards([]); return; }
    setLoading(true);
    supabase.from('game_rewards' as any).select('*').eq('product_id', productId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setRewards((data as any) || []); setLoading(false); });
  }, [productId]);

  const filtered = useMemo(
    () => jogos.filter(j => !search || j.title.toLowerCase().includes(search.toLowerCase())),
    [jogos, search]
  );

  const reload = async () => {
    const { data } = await supabase.from('game_rewards' as any).select('*').eq('product_id', productId).order('created_at', { ascending: false });
    setRewards((data as any) || []);
  };

  const openNew = () => setEditing({ ...emptyForm(), product_id: productId });
  const openEdit = (r: GameReward) => setEditing({
    id: r.id, product_id: r.product_id, kind: r.kind, rarity: r.rarity,
    name: r.name, description: r.description || '', asset_url: r.asset_url || '',
    color: r.payload?.color || '#14B8A6', emoji: r.payload?.emoji || '✨',
    criteria_type: r.unlock_criteria?.type || 'library_owned',
    criteria_params: Object.fromEntries(Object.entries(r.unlock_criteria || {}).filter(([k]) => k !== 'type')),
    is_active: r.is_active,
  });

  const upload = async (f: File) => {
    if (!editing) return;
    if (f.size > 3 * 1024 * 1024) return toast.error('Máx 3MB');
    setUploading(true);
    const ext = f.name.split('.').pop() || 'png';
    const path = `${editing.product_id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('game-rewards').upload(path, f, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('game-rewards').getPublicUrl(path);
    setEditing({ ...editing, asset_url: publicUrl });
    setUploading(false);
  };

  const save = async () => {
    if (!editing || !editing.name || !editing.product_id) return toast.error('Preencha jogo e nome');
    const payload = { color: editing.color, emoji: editing.emoji };
    const unlock = { type: editing.criteria_type, ...editing.criteria_params };
    const row = {
      product_id: editing.product_id, kind: editing.kind, name: editing.name,
      description: editing.description || null, asset_url: editing.asset_url || null,
      payload, unlock_criteria: unlock, rarity: editing.rarity, is_active: editing.is_active,
    };
    const { error } = editing.id
      ? await supabase.from('game_rewards' as any).update(row).eq('id', editing.id)
      : await supabase.from('game_rewards' as any).insert(row);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? 'Recompensa atualizada' : 'Recompensa criada');
    setEditing(null); reload();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta recompensa?')) return;
    const { error } = await supabase.from('game_rewards' as any).delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Removida'); reload();
  };

  const criteriaMeta = CRITERIA.find(c => c.type === editing?.criteria_type);
  const previewReward: GameReward = editing ? {
    id: 'preview', product_id: editing.product_id, kind: editing.kind, name: editing.name || 'Preview',
    description: editing.description, asset_url: editing.asset_url || null,
    payload: { color: editing.color, emoji: editing.emoji }, unlock_criteria: { type: editing.criteria_type },
    rarity: editing.rarity, is_active: editing.is_active,
  } : null as any;

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Sparkles} title="Recompensas por jogo" subtitle="Cosméticos desbloqueáveis (frames, banners, temas, stickers...) por jogo" />

      <Card><CardContent className="p-4 space-y-3">
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <Label className="text-xs">Buscar jogo</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Título..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="min-w-[280px]">
            <Label className="text-xs">Jogo selecionado</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Escolha um jogo" /></SelectTrigger>
              <SelectContent className="max-h-80">
                {filtered.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={!productId} onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nova recompensa</Button>
        </div>
      </CardContent></Card>

      {productId && (
        <Card><CardContent className="p-4">
          {loading ? <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> :
            rewards.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhuma recompensa neste jogo ainda.</p> :
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {rewards.map(r => (
                <div key={r.id} className={`p-3 rounded-xl border bg-card/50 flex flex-col items-center gap-2 ${!r.is_active ? 'opacity-50' : ''}`}>
                  <CosmeticPreview reward={r} size={72} />
                  <div className="text-center w-full">
                    <p className="text-sm font-semibold line-clamp-1">{r.name}</p>
                    <div className="flex justify-center gap-1 flex-wrap mt-1">
                      <Badge variant="outline" className={`text-[9px] ${RARITY_COLOR[r.rarity]}`}>{r.rarity}</Badge>
                      <Badge variant="secondary" className="text-[9px]">{KIND_LABEL[r.kind]}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">🔓 {r.unlock_criteria?.type}</p>
                  </div>
                  <div className="flex gap-1 w-full">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(r)}><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          }
        </CardContent></Card>
      )}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar recompensa' : 'Nova recompensa'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Descrição</Label><Textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Tipo</Label>
                    <Select value={editing.kind} onValueChange={(v) => setEditing({ ...editing, kind: v as RewardKind })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{KINDS.map(k => <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Raridade</Label>
                    <Select value={editing.rarity} onValueChange={(v) => setEditing({ ...editing, rarity: v as RewardRarity })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{RARITIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Cor placeholder</Label><Input type="color" value={editing.color} onChange={e => setEditing({ ...editing, color: e.target.value })} className="h-10 p-1" /></div>
                  <div><Label>Emoji</Label><Input value={editing.emoji} onChange={e => setEditing({ ...editing, emoji: e.target.value })} maxLength={4} /></div>
                </div>
                <div>
                  <Label>Imagem (PNG/GIF até 3MB) — opcional</Label>
                  <div className="flex gap-2 items-center">
                    <Input value={editing.asset_url} onChange={e => setEditing({ ...editing, asset_url: e.target.value })} placeholder="ou cole uma URL" />
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
                      <Button asChild size="sm" variant="outline"><span>{uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}</span></Button>
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-2">
                  <Label className="text-xs uppercase tracking-wider">Critério de desbloqueio</Label>
                  <Select value={editing.criteria_type} onValueChange={(v) => setEditing({ ...editing, criteria_type: v, criteria_params: {} })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CRITERIA.map(c => <SelectItem key={c.type} value={c.type}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                  {criteriaMeta?.fields?.map(f => (
                    <div key={f.key}>
                      <Label className="text-xs">{f.label}</Label>
                      <Input type={f.type} value={editing.criteria_params[f.key] || ''}
                        onChange={e => setEditing({ ...editing, criteria_params: { ...editing.criteria_params, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value } })} />
                    </div>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
                  Ativa
                </label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">Preview</Label>
                <div className="rounded-lg border border-border p-4 bg-card flex flex-col items-center gap-3">
                  <CosmeticPreview reward={previewReward} size={120} />
                  <p className="text-sm font-semibold text-center">{editing.name || 'Sem nome'}</p>
                  <Badge variant="outline" className={RARITY_COLOR[editing.rarity]}>{editing.rarity}</Badge>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={save}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

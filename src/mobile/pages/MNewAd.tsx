import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';

const PLATAFORMAS = ['PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One', 'Switch', 'Mobile'];
const CATEGORIAS = ['jogo_digital', 'jogo_fisico', 'console', 'acessorio', 'colecionavel', 'outros'];

const schema = z.object({
  title: z.string().trim().min(3, 'Título muito curto').max(120),
  description: z.string().max(2000).optional(),
  price: z.number().nonnegative('Preço inválido'),
});

export default function MNewAd() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adType, setAdType] = useState<'venda' | 'troca'>('venda');
  const [protegido, setProtegido] = useState(false);
  const [hasCert, setHasCert] = useState(false);
  const [hasSeller, setHasSeller] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', price: '', condition: 'novo', category: 'jogo_digital',
    desired_item: '', accepts_counteroffer: false,
  });
  const [plataformas, setPlataformas] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; title: string; cover_url: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('certificados').select('status').eq('user_id', user.id).eq('status', 'ativo').limit(1)
      .then(({ data }) => setHasCert(!!data?.length));
    supabase.from('seller_profiles').select('id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setHasSeller(!!data));
  }, [user]);

  // Autocomplete a partir do games_catalog
  useEffect(() => {
    const q = form.title.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('games_catalog')
        .select('id, title, cover_url')
        .ilike('title', `%${q}%`)
        .order('popularity', { ascending: false })
        .limit(5);
      setSuggestions(data || []);
    }, 250);
    return () => clearTimeout(t);
  }, [form.title]);

  const togglePlatform = (p: string) =>
    setPlataformas(plataformas.includes(p) ? plataformas.filter(x => x !== p) : [...plataformas, p]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = [...files, ...Array.from(list)].slice(0, 6);
    setFiles(arr);
  };

  const submit = async () => {
    if (!user) return;
    if (!hasSeller) {
      toast.error('Você precisa criar um perfil de vendedor ($) antes de anunciar');
      navigate('/criar-vendedor');
      return;
    }
    const parsed = schema.safeParse({
      title: form.title, description: form.description, price: Number(form.price || 0),
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    if (protegido && !hasCert) { toast.error('Você precisa de certificação ativa para anúncio protegido'); return; }

    setSubmitting(true);

    // Anti-duplicação: bloqueia se o vendedor já tem anúncio ATIVO com o mesmo título
    const { data: dup } = await supabase
      .from('anuncios').select('id').eq('seller_id', user.id).eq('status', 'active')
      .ilike('title', form.title.trim()).limit(1);
    if (dup && dup.length) {
      setSubmitting(false);
      toast.error('Você já tem um anúncio ativo com esse título. Edite o existente em vez de duplicar.');
      return;
    }
    const { data: ad, error } = await supabase.from('anuncios').insert({
      seller_id: user.id, user_id: user.id, title: form.title.trim(),
      description: form.description.trim() || null, price: Number(form.price || 0),
      ad_type: adType, condition: form.condition, category: form.category,
      certificate_type: protegido ? 'verificado' : 'sem_certificado',
      desired_item: adType === 'troca' ? form.desired_item.trim() || null : null,
      plataformas: plataformas.length ? plataformas : null,
      accepts_counteroffer: form.accepts_counteroffer,
      status: 'active',
    }).select('id').single();

    if (error || !ad) { toast.error('Erro ao publicar'); setSubmitting(false); return; }

    // Upload images
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const path = `${user.id}/${ad.id}/${Date.now()}-${i}.${f.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from('ad-images').upload(path, f);
      if (!upErr) {
        const { data: pub } = supabase.storage.from('ad-images').getPublicUrl(path);
        await supabase.from('fotos_anuncio').insert({ anuncio_id: ad.id, image_url: pub.publicUrl, position: i });
      }
    }

    toast.success('Anúncio publicado!');
    navigate(`/m/marketplace/${ad.id}`);
  };

  if (!user) return <div className="p-6 text-center text-muted-foreground">Entre para anunciar.</div>;
  if (hasSeller === false) return (
    <div className="px-4 py-10 text-center space-y-4">
      <h2 className="font-display text-lg font-bold gradient-text">Crie seu perfil de vendedor</h2>
      <p className="text-sm text-muted-foreground">Para publicar anúncios no marketplace você precisa primeiro criar seu perfil $vendedor — separado do seu perfil pessoal @usuario.</p>
      <button onClick={() => navigate('/criar-vendedor')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">
        Criar perfil de vendedor
      </button>
    </div>
  );

  return (
    <div className="px-4 py-5 space-y-4 pb-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Voltar</button>
      <h1 className="font-display text-xl font-bold gradient-text">Novo anúncio</h1>

      <div className="glass rounded-xl p-3 space-y-3">
        <div className="flex p-1 bg-secondary rounded-lg">
          <button onClick={() => setAdType('venda')} className={`flex-1 py-2 rounded-md text-xs font-semibold ${adType === 'venda' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>💰 Venda</button>
          <button onClick={() => setAdType('troca')} className={`flex-1 py-2 rounded-md text-xs font-semibold ${adType === 'troca' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>🔄 Troca</button>
        </div>

        <div className="space-y-2 border border-border rounded-lg p-3">
          <button onClick={() => setProtegido(!protegido)} className="w-full flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-success" />Protegido pela loja</span>
            <span className={`relative w-10 h-5 rounded-full ${protegido ? 'bg-success' : 'bg-secondary'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${protegido ? 'translate-x-5' : ''}`} />
            </span>
          </button>
          <p className="text-[11px] text-muted-foreground">
            {protegido
              ? hasCert ? '✅ Você tem certificação ativa.' : '⚠️ Você precisa solicitar certificação em Configurações.'
              : 'Sem certificação. A loja não responde por problemas — risco do comprador e vendedor.'}
          </p>
        </div>
      </div>

      <div className="relative">
        <input
          value={form.title}
          onChange={e => { setForm({ ...form, title: e.target.value }); setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => setShowSuggestions(true)}
          maxLength={120}
          placeholder="Título do anúncio (digite o nome do jogo)"
          className="w-full p-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-lg overflow-hidden shadow-lg">
            {suggestions.map(s => (
              <button key={s.id} type="button" onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setForm({ ...form, title: s.title }); setShowSuggestions(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-left">
                {s.cover_url && <img src={s.cover_url} alt="" className="w-6 h-8 object-cover rounded" />}
                <span className="text-sm">{s.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} maxLength={2000} rows={4} placeholder="Descrição detalhada..." className="w-full p-3 bg-card border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
      <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Preço (R$)" className="w-full p-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />

      {adType === 'troca' && (
        <input value={form.desired_item} onChange={e => setForm({ ...form, desired_item: e.target.value })} maxLength={200} placeholder="O que você procura?" className="w-full p-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
      )}

      <div className="grid grid-cols-2 gap-2">
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="p-3 bg-card border border-border rounded-lg text-sm">
          {CATEGORIAS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
        </select>
        <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="p-3 bg-card border border-border rounded-lg text-sm">
          <option value="novo">Novo</option>
          <option value="usado">Usado</option>
        </select>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Plataformas</label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {PLATAFORMAS.map(p => (
            <button key={p} onClick={() => togglePlatform(p)} className={`text-xs px-2.5 py-1 rounded-full border ${plataformas.includes(p) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}>{p}</button>
          ))}
        </div>
      </div>

      <button onClick={() => setForm({ ...form, accepts_counteroffer: !form.accepts_counteroffer })} className="w-full flex items-center justify-between p-3 glass rounded-lg">
        <span className="text-sm">💬 Aceitar contraofertas</span>
        <span className={`relative w-10 h-5 rounded-full ${form.accepts_counteroffer ? 'bg-primary' : 'bg-secondary'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.accepts_counteroffer ? 'translate-x-5' : ''}`} />
        </span>
      </button>

      <div>
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Fotos (até 6)</label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {files.map((f, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center"><X className="h-3 w-3" /></button>
            </div>
          ))}
          {files.length < 6 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary text-muted-foreground">
              <Plus className="h-6 w-6" />
              <input type="file" accept="image/*" multiple hidden onChange={e => addFiles(e.target.files)} />
            </label>
          )}
        </div>
      </div>

      <button onClick={submit} disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold glow-primary disabled:opacity-50">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Publicar anúncio'}
      </button>
    </div>
  );
}

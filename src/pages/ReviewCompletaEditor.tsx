import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProduto } from '@/hooks/useProdutos';
import { ArrowLeft, BookOpen, Lock, Users, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import SpoilerComposerControls from '@/components/spoiler/SpoilerComposerControls';

type Visibility = 'friends' | 'private';

const STATUS_OPTS = ['jogando', 'zerado', 'pausado', 'abandonado', 'rejogando'];
const PLATAFORMA_OPTS = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile', 'Outro'];
const DIFICULDADE_OPTS = ['Fácil', 'Normal', 'Difícil', 'Muito Difícil', 'Brutal'];
const RECOMENDACAO_OPTS = ['Recomendo muito', 'Recomendo', 'Talvez', 'Não recomendo'];
const TAGS = ['Emocionante', 'Nostálgico', 'Frustrante', 'Relaxante', 'Sombrio', 'Inspirador', 'Engraçado', 'Profundo', 'Viciante'];

export default function ReviewCompletaEditor() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: game } = useProduto(id);

  const [analise, setAnalise] = useState('');
  const [horas, setHoras] = useState<string>('');
  const [plataforma, setPlataforma] = useState('');
  const [dificuldade, setDificuldade] = useState('');
  const [status, setStatus] = useState('');
  const [recomendacao, setRecomendacao] = useState('');
  const [personagens, setPersonagens] = useState('');
  const [trilha, setTrilha] = useState('');
  const [momentos, setMomentos] = useState('');
  const [pros, setPros] = useState('');
  const [contras, setContras] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('friends');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [spoilerAch, setSpoilerAch] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['review-completa', id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews_completas' as any)
        .select('*')
        .eq('product_id', id!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data as any;
    },
  });

  const draftKey = user && id ? `review-draft:${user.id}:${id}` : null;

  // Restaura rascunho do localStorage ao abrir o editor — só se não houver review já persistida.
  useEffect(() => {
    if (existing) {
      setAnalise(existing.analise || '');
      setHoras(existing.horas_jogadas?.toString() || '');
      setPlataforma(existing.plataforma || '');
      setDificuldade(existing.dificuldade || '');
      setStatus(existing.status || '');
      setRecomendacao(existing.recomendacao || '');
      setPersonagens(existing.personagens_favoritos || '');
      setTrilha(existing.trilha_sonora_favorita || '');
      setMomentos(existing.momentos_favoritos || '');
      setPros((existing.pros || []).join('\n'));
      setContras((existing.contras || []).join('\n'));
      setTags(existing.tags_emocionais || []);
      setVisibility((existing.visibility as Visibility) || 'friends');
      setIsSpoiler(!!existing.is_spoiler);
      setSpoilerAch(existing.spoiler_achievement_name || null);
      return;
    }
    if (!draftKey) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.analise) setAnalise(d.analise);
      if (d.horas) setHoras(d.horas);
      if (d.plataforma) setPlataforma(d.plataforma);
      if (d.dificuldade) setDificuldade(d.dificuldade);
      if (d.status) setStatus(d.status);
      if (d.recomendacao) setRecomendacao(d.recomendacao);
      if (d.personagens) setPersonagens(d.personagens);
      if (d.trilha) setTrilha(d.trilha);
      if (d.momentos) setMomentos(d.momentos);
      if (d.pros) setPros(d.pros);
      if (d.contras) setContras(d.contras);
      if (Array.isArray(d.tags)) setTags(d.tags);
      if (d.visibility) setVisibility(d.visibility);
      if (typeof d.isSpoiler === 'boolean') setIsSpoiler(d.isSpoiler);
      if (d.spoilerAch) setSpoilerAch(d.spoilerAch);
      toast.info('Rascunho restaurado do dispositivo.');
    } catch { /* ignore */ }
  }, [existing, draftKey]);

  // Autosave debounced: 800ms depois da última mudança. Salva enquanto não existir review persistida.
  useEffect(() => {
    if (!draftKey || existing) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          analise, horas, plataforma, dificuldade, status, recomendacao,
          personagens, trilha, momentos, pros, contras, tags,
          visibility, isSpoiler, spoilerAch,
        }));
      } catch { /* quota etc. — silencioso */ }
    }, 800);
    return () => clearTimeout(t);
  }, [draftKey, existing, analise, horas, plataforma, dificuldade, status, recomendacao, personagens, trilha, momentos, pros, contras, tags, visibility, isSpoiler, spoilerAch]);

  if (!user) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Faça login para escrever uma Review Completa.</div>;
  }

  const toggleTag = (t: string) =>
    setTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]);

  const handleSave = async () => {
    if (!analise.trim()) {
      toast.error('Escreva sua análise antes de salvar');
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user.id,
      product_id: id!,
      analise: analise.trim(),
      horas_jogadas: horas ? parseInt(horas, 10) : null,
      plataforma: plataforma || null,
      dificuldade: dificuldade || null,
      status: status || null,
      recomendacao: recomendacao || null,
      personagens_favoritos: personagens.trim() || null,
      trilha_sonora_favorita: trilha.trim() || null,
      momentos_favoritos: momentos.trim() || null,
      pros: pros.split('\n').map(s => s.trim()).filter(Boolean),
      contras: contras.split('\n').map(s => s.trim()).filter(Boolean),
      tags_emocionais: tags,
      visibility,
      is_spoiler: isSpoiler,
      spoiler_achievement_name: spoilerAch,
    };
    const { error } = existing
      ? await supabase.from('reviews_completas' as any).update(payload).eq('id', existing.id)
      : await supabase.from('reviews_completas' as any).insert(payload);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success('Review completa salva!');
    navigate(`/jogo/${id}/social`);
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link to={`/jogo/${id}/social`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar ao Hub
      </Link>

      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-5 mb-6">
        <p className="text-xs text-primary font-semibold uppercase tracking-wider flex items-center gap-1">
          <BookOpen className="h-3 w-3" /> Review Completa · Diário gamer privado
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-1 min-h-[2rem]">
          {game?.title ?? <span className="inline-block h-6 w-48 align-middle rounded-md bg-muted animate-pulse" aria-label="Carregando título do jogo" />}
        </h1>

        <p className="text-xs text-muted-foreground mt-1">
          Só seus amigos (ou close friends) podem ler. Diferente da Review pública mobile.
        </p>
      </motion.header>

      <div className="space-y-5">
        <Field label="Análise detalhada *">
          <textarea value={analise} onChange={e => setAnalise(e.target.value)} rows={6}
            placeholder="Conte sua experiência completa com o jogo..."
            className="w-full rounded-lg bg-background border border-border p-3 text-sm" />
        </Field>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Horas jogadas">
            <input type="number" min={0} value={horas} onChange={e => setHoras(e.target.value)}
              className="w-full rounded-lg bg-background border border-border p-2 text-sm" />
          </Field>
          <Select label="Plataforma" value={plataforma} onChange={setPlataforma} options={PLATAFORMA_OPTS} />
          <Select label="Dificuldade" value={dificuldade} onChange={setDificuldade} options={DIFICULDADE_OPTS} />
          <Select label="Status" value={status} onChange={setStatus} options={STATUS_OPTS} />
        </div>

        <Select label="Recomendação" value={recomendacao} onChange={setRecomendacao} options={RECOMENDACAO_OPTS} />

        <Field label="Personagens favoritos">
          <input value={personagens} onChange={e => setPersonagens(e.target.value)}
            className="w-full rounded-lg bg-background border border-border p-2 text-sm" />
        </Field>
        <Field label="Trilha sonora favorita">
          <input value={trilha} onChange={e => setTrilha(e.target.value)}
            className="w-full rounded-lg bg-background border border-border p-2 text-sm" />
        </Field>
        <Field label="Momentos favoritos">
          <textarea value={momentos} onChange={e => setMomentos(e.target.value)} rows={3}
            className="w-full rounded-lg bg-background border border-border p-2 text-sm" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Prós (um por linha)">
            <textarea value={pros} onChange={e => setPros(e.target.value)} rows={4}
              className="w-full rounded-lg bg-background border border-border p-2 text-sm" />
          </Field>
          <Field label="Contras (um por linha)">
            <textarea value={contras} onChange={e => setContras(e.target.value)} rows={4}
              className="w-full rounded-lg bg-background border border-border p-2 text-sm" />
          </Field>
        </div>

        <Field label="Tags emocionais">
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map(t => (
              <button key={t} type="button" onClick={() => toggleTag(t)}
                className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                  tags.includes(t) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                }`}>{t}</button>
            ))}
          </div>
        </Field>

        <Field label="Visibilidade">
          <div className="flex gap-2">
            {(['friends', 'private'] as Visibility[]).map(v => (
              <button key={v} type="button" onClick={() => setVisibility(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  visibility === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                }`}>
                {v === 'friends' ? <><Users className="h-3 w-3" /> Amigos</> : <><Lock className="h-3 w-3" /> Close Friends</>}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Aviso de spoiler">
          <SpoilerComposerControls
            isSpoiler={isSpoiler}
            onIsSpoilerChange={setIsSpoiler}
            achievementName={spoilerAch}
            onAchievementNameChange={setSpoilerAch}
            productId={id}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {existing ? 'Atualizar' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Field label={label}>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg bg-background border border-border p-2 text-sm">
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}

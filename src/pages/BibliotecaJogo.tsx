import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Library, Loader2, Star, Trophy, MessageSquare, Users, ArrowLeft, Save, Clock, Calendar, Camera, X, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { InteractiveHalfStar } from '@/components/HalfStarRating';

const STATUS_OPTIONS = [
  { v: 'quero_jogar', label: 'Quero jogar', tone: 'bg-blue-500/20 text-blue-300' },
  { v: 'jogando', label: 'Jogando atualmente', tone: 'bg-green-500/20 text-green-300' },
  { v: 'pausado', label: 'Pausado', tone: 'bg-yellow-500/20 text-yellow-300' },
  { v: 'zerado', label: 'Completado', tone: 'bg-purple-500/20 text-purple-300' },
  { v: 'abandonado', label: 'Abandonado', tone: 'bg-red-500/20 text-red-300' },
];

const MOOD_OPTIONS = ['Épico', 'Relaxante', 'Frustrante', 'Emocionante', 'Nostálgico', 'Viciante', 'Desafiador', 'Histórico'];

export default function BibliotecaJogo() {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('quero_jogar');
  const [note, setNote] = useState('');
  const [hours, setHours] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<string>('');
  const [completedAt, setCompletedAt] = useState<string>('');
  const [personalRating, setPersonalRating] = useState<number>(0);
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [friendsActivity, setFriendsActivity] = useState<any[]>([]);
  const { submitting, guard } = useSubmitGuard();

  useEffect(() => {
    if (!user || !productId) return;
    (async () => {
      const { data: lib } = await supabase
        .from('biblioteca_usuario')
        .select('*, produto:product_id(title, image_url, category, description, publisher)')
        .eq('user_id', user.id).eq('product_id', productId).maybeSingle();
      if (!lib) { setLoading(false); return; }
      setData(lib);
      setStatus(lib.status || 'quero_jogar');
      setNote((lib as any).personal_note || '');
      setHours((lib as any).hours_played || 0);
      setStartedAt((lib as any).started_at ? new Date((lib as any).started_at).toISOString().slice(0, 10) : '');
      setCompletedAt((lib as any).completed_at ? new Date((lib as any).completed_at).toISOString().slice(0, 10) : '');
      setPersonalRating(Number((lib as any).personal_rating || 0));
      setMoodTags(((lib as any).mood_tags as string[]) || []);
      setScreenshots(((lib as any).my_screenshots as string[]) || []);

      const [{ data: rev }, { data: pst }, { data: convs }] = await Promise.all([
        supabase.from('avaliacoes').select('id, rating, comment, created_at').eq('user_id', user.id).eq('product_id', productId),
        supabase.from('forum_posts').select('id, content, created_at').eq('user_id', user.id).eq('product_id', productId).limit(10),
        supabase.from('conversas').select('participant_1, participant_2').or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`).eq('status', 'accepted'),
      ]);
      setReviews(rev || []); setPosts(pst || []);

      const friendIds = new Set<string>();
      (convs || []).forEach((c: any) => { friendIds.add(c.participant_1 === user.id ? c.participant_2 : c.participant_1); });
      friendIds.delete(user.id);
      if (friendIds.size) {
        const { data: fa } = await supabase
          .from('biblioteca_usuario')
          .select('user_id, status, acquired_at, hours_played, profiles!inner(display_name, avatar_url, is_private)')
          .eq('product_id', productId).in('user_id', [...friendIds]).limit(20);
        setFriendsActivity(((fa as any) || []).filter((r: any) => !r.profiles?.is_private));
      }
      setLoading(false);
    })();
  }, [user, productId]);

  if (!user) return <Navigate to="/auth" replace />;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground mb-4">Você ainda não possui este jogo na sua biblioteca.</p>
      <Link to={`/jogo/${productId}`} className="text-primary hover:underline">Ver na loja</Link>
    </div>
  );

  const toggleMood = (m: string) => setMoodTags(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  const addScreenshot = () => {
    if (!newScreenshotUrl.trim()) return;
    setScreenshots(p => [...p, newScreenshotUrl.trim()]);
    setNewScreenshotUrl('');
  };
  const removeScreenshot = (i: number) => setScreenshots(p => p.filter((_, idx) => idx !== i));

  const save = guard(async () => {
    const payload: any = {
      status,
      personal_note: note,
      hours_played: hours,
      personal_rating: personalRating || null,
      mood_tags: moodTags,
      my_screenshots: screenshots,
      started_at: startedAt ? new Date(startedAt).toISOString() : null,
      completed_at: completedAt ? new Date(completedAt).toISOString() : null,
    };
    const { error } = await supabase.from('biblioteca_usuario')
      .update(payload)
      .eq('user_id', user.id).eq('product_id', productId!);
    if (error) toast.error(error.message); else toast.success('Jornada atualizada');
  });

  const currentStatus = STATUS_OPTIONS.find(o => o.v === status);
  const acquiredDate = new Date(data.acquired_at);
  const daysOwned = Math.floor((Date.now() - acquiredDate.getTime()) / 86400000);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link to="/biblioteca" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar à biblioteca
        </Link>

        {/* Hero cinematográfico - jornada do jogador */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="relative rounded-2xl overflow-hidden mb-8 border border-primary/30 shadow-2xl shadow-primary/10"
        >
          {data.produto?.image_url && (
            <>
              <img src={data.produto.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
            </>
          )}
          <div className="relative p-8 flex flex-col md:flex-row items-start md:items-end gap-6 min-h-[320px]">
            {data.produto?.image_url && (
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                src={data.produto.image_url} alt={data.produto.title}
                className="w-44 aspect-[3/4] object-cover rounded-xl shadow-2xl border-2 border-primary/40"
              />
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-primary/20 text-primary border border-primary/40 px-2.5 py-1 rounded-full">
                  <Library className="h-3 w-3" /> MINHA JORNADA
                </span>
                {currentStatus && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${currentStatus.tone}`}>
                    {currentStatus.label}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-2 leading-tight">{data.produto?.title}</h1>
              <p className="text-sm text-muted-foreground mb-4">{data.produto?.publisher} · {data.produto?.category}</p>

              {/* Stats da jornada */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Stat icon={<Clock className="h-4 w-4" />} label="Jogadas" value={`${hours}h`} />
                <Stat icon={<Calendar className="h-4 w-4" />} label="Na biblioteca há" value={`${daysOwned}d`} />
                <Stat icon={<Star className="h-4 w-4 text-yellow-500" />} label="Minha nota" value={personalRating ? `${personalRating}★` : '—'} />
                <Stat icon={<Camera className="h-4 w-4" />} label="Screenshots" value={String(screenshots.length)} />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna esquerda — minha jornada editável */}
          <section className="lg:col-span-1 space-y-5">
            <Panel title="Status atual" icon={<Sparkles className="h-4 w-4 text-primary" />}>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-background border border-border rounded-md p-2 text-sm">
                {STATUS_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            </Panel>

            <Panel title="Tempo de jogo" icon={<Clock className="h-4 w-4 text-primary" />}>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} value={hours} onChange={e => setHours(Number(e.target.value))} className="text-center" />
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
            </Panel>

            <Panel title="Linha do tempo" icon={<Calendar className="h-4 w-4 text-primary" />}>
              <label className="text-xs text-muted-foreground">Comecei em</label>
              <Input type="date" value={startedAt} onChange={e => setStartedAt(e.target.value)} className="mb-3" />
              <label className="text-xs text-muted-foreground">Completei em</label>
              <Input type="date" value={completedAt} onChange={e => setCompletedAt(e.target.value)} />
            </Panel>

            <Panel title="Minha nota pessoal" icon={<Star className="h-4 w-4 text-yellow-500" />}>
              <HalfStarRating value={personalRating} onChange={setPersonalRating} />
              <p className="text-xs text-muted-foreground mt-2">Visível só para você</p>
            </Panel>

            <Panel title="Como me sinto sobre" icon={<Sparkles className="h-4 w-4 text-accent" />}>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map(m => (
                  <button key={m} type="button" onClick={() => toggleMood(m)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${moodTags.includes(m) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Diário privado" icon={<MessageSquare className="h-4 w-4 text-accent" />}>
              <p className="text-xs text-muted-foreground mb-2">Só você lê</p>
              <Textarea value={note} onChange={e => setNote(e.target.value)} rows={5} placeholder="Anotações, dicas, momentos memoráveis..." />
            </Panel>

            <Button className="w-full" disabled={submitting} onClick={save}>
              <Save className="h-4 w-4 mr-2" /> Salvar jornada
            </Button>
          </section>

          {/* Coluna direita — galeria + social */}
          <section className="lg:col-span-2 space-y-6">
            {/* Screenshots pessoais */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Meus momentos</h3>
              {screenshots.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                  {screenshots.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeScreenshot(i)}
                        className="absolute top-1 right-1 bg-background/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">Sem screenshots ainda. Cole uma URL abaixo para começar sua coleção.</p>
              )}
              <div className="flex gap-2">
                <Input placeholder="https://..." value={newScreenshotUrl} onChange={e => setNewScreenshotUrl(e.target.value)} />
                <Button variant="outline" size="sm" onClick={addScreenshot}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            {reviews.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Minhas avaliações públicas</h3>
                {reviews.map(r => (
                  <div key={r.id} className="text-sm mb-2 last:mb-0">
                    <span className="font-bold text-yellow-500">{r.rating} ★</span>
                    {r.comment && <span className="text-muted-foreground ml-2">— {r.comment}</span>}
                  </div>
                ))}
              </div>
            )}

            {friendsActivity.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Amigos que também jogam</h3>
                <ul className="space-y-2">
                  {friendsActivity.map((a, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <Link to={`/amigo/${a.user_id}`} className="hover:text-primary font-medium">{a.profiles?.display_name || 'Usuário'}</Link>
                      <span className="text-muted-foreground text-xs">— {a.status === 'jogando' ? 'jogando agora' : a.status === 'zerado' ? 'zerou' : 'na lista'}</span>
                      {a.hours_played > 0 && <span className="text-xs text-muted-foreground">· {a.hours_played}h</span>}
                    </li>
                  ))}
                </ul>
                <Link to={`/jogo/${productId}/social`} className="text-xs text-primary hover:underline mt-3 inline-block">Ver hub social →</Link>
              </div>
            )}

            {posts.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-accent" /> Meus posts no fórum</h3>
                {posts.map(p => (
                  <div key={p.id} className="text-sm text-muted-foreground mb-2 last:mb-0 line-clamp-2">{p.content}</div>
                ))}
              </div>
            )}

            {reviews.length === 0 && posts.length === 0 && friendsActivity.length === 0 && screenshots.length === 0 && (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p>Sua jornada com este jogo está começando. Adicione screenshots, marque seu humor e escreva no diário.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card/60 backdrop-blur border border-border/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wide mb-1">{icon}{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">{icon} {title}</h3>
      {children}
    </div>
  );
}

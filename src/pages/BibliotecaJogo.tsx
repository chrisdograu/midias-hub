import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Library, Loader2, Star, Trophy, MessageSquare, Users, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { v: 'quero_jogar', label: 'Quero jogar' },
  { v: 'jogando', label: 'Jogando atualmente' },
  { v: 'pausado', label: 'Pausado' },
  { v: 'zerado', label: 'Completado' },
  { v: 'abandonado', label: 'Abandonado' },
];

export default function BibliotecaJogo() {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('quero_jogar');
  const [note, setNote] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
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
          .select('user_id, status, acquired_at, profiles!inner(display_name, avatar_url, is_private)')
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

  const save = guard(async () => {
    const { error } = await supabase.from('biblioteca_usuario')
      .update({ status, personal_note: note } as any)
      .eq('user_id', user.id).eq('product_id', productId!);
    if (error) toast.error(error.message); else toast.success('Salvo');
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link to="/biblioteca" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar à biblioteca
        </Link>

        {/* Hero "dentro do jogo" */}
        <div className="relative rounded-xl overflow-hidden mb-8 border border-primary/30">
          {data.produto?.image_url && (
            <>
              <img src={data.produto.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </>
          )}
          <div className="relative p-8 flex items-end gap-6 min-h-[280px]">
            {data.produto?.image_url && (
              <img src={data.produto.image_url} alt={data.produto.title} className="w-40 aspect-[3/4] object-cover rounded-lg shadow-2xl border border-border" />
            )}
            <div className="flex-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-primary/20 text-primary border border-primary/40 px-2 py-1 rounded mb-2">
                <Library className="h-3 w-3" /> NA SUA BIBLIOTECA
              </span>
              <h1 className="text-4xl font-display font-bold mb-1">{data.produto?.title}</h1>
              <p className="text-sm text-muted-foreground">{data.produto?.publisher} · {data.produto?.category}</p>
              <p className="text-xs text-muted-foreground mt-2">Adquirido em {new Date(data.acquired_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Painel de status + nota */}
          <section className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-semibold mb-3">Status</h3>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-background border border-border rounded-md p-2 text-sm mb-2">
                {STATUS_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
              {data.status_updated_at && <p className="text-xs text-muted-foreground">Atualizado em {new Date(data.status_updated_at).toLocaleDateString('pt-BR')}</p>}
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-semibold mb-3">Anotação pessoal</h3>
              <p className="text-xs text-muted-foreground mb-2">Privada — só você vê</p>
              <Textarea value={note} onChange={e => setNote(e.target.value)} rows={6} placeholder="Suas anotações sobre esse jogo..." />
            </div>

            <Button className="w-full" disabled={submitting} onClick={save}>
              <Save className="h-4 w-4 mr-2" /> Salvar alterações
            </Button>
          </section>

          {/* Conteúdo da plataforma */}
          <section className="lg:col-span-2 space-y-6">
            {reviews.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Suas avaliações</h3>
                {reviews.map(r => (
                  <div key={r.id} className="text-sm mb-2 last:mb-0">
                    <span className="font-bold text-yellow-500">{r.rating} ★</span>
                    {r.comment && <span className="text-muted-foreground ml-2">— {r.comment}</span>}
                  </div>
                ))}
              </div>
            )}

            {tournaments.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Torneios deste jogo</h3>
                {tournaments.map(t => <p key={t.id} className="text-sm">{t.title}</p>)}
              </div>
            )}

            {friendsActivity.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Amigos com esse jogo</h3>
                <ul className="space-y-2">
                  {friendsActivity.map((a, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <Link to={`/perfil/${a.user_id}`} className="hover:text-primary">{a.profiles?.display_name || 'Usuário'}</Link>
                      <span className="text-muted-foreground text-xs">— {a.status === 'jogando' ? 'jogando' : a.status === 'zerado' ? 'zerou' : 'na lista'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {posts.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-accent" /> Seus posts no fórum</h3>
                {posts.map(p => (
                  <div key={p.id} className="text-sm text-muted-foreground mb-2 last:mb-0 line-clamp-2">{p.content}</div>
                ))}
              </div>
            )}

            {reviews.length === 0 && posts.length === 0 && friendsActivity.length === 0 && (
              <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
                <p>Sem atividade ainda. Escreva uma review, participe do fórum ou converse com amigos para preencher esta página.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

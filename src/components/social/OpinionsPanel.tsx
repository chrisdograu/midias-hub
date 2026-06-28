// Painel de Opiniões — conversas privadas par-a-par persistentes.
// Cada resposta cria/abre uma conversa permanente vinculada à opinião.
// Terceiros só veem o contador "X pessoas responderam".
// Rota canônica da conversa: /perfil/:userId/jogo/:productId/opniao/:opinionId/conversa/:convId
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, MoreHorizontal, Loader2, ArrowRight } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import SpoilerGuard from "@/components/spoiler/SpoilerGuard";
import SpoilerComposerControls from "@/components/spoiler/SpoilerComposerControls";

interface Opinion {
  id: string; user_id: string; product_id: string; text: string; images: string[];
  likes_count: number; replies_count: number; created_at: string;
  is_spoiler?: boolean | null;
  spoiler_achievement_name?: string | null;
  author?: { display_name: string | null; avatar_url: string | null };
  liked_by_me?: boolean;
}

export function OpinionsPanel({ productId }: { productId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [posting, setPosting] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [spoilerAch, setSpoilerAch] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("game_opinions")
      .select("*, author:profiles!user_id(display_name, avatar_url)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (user && data?.length) {
      const ids = data.map((o: any) => o.id);
      const { data: likes } = await supabase
        .from("game_opinion_likes").select("opinion_id").in("opinion_id", ids).eq("user_id", user.id);
      const liked = new Set((likes ?? []).map((l: any) => l.opinion_id));
      setOpinions(data.map((o: any) => ({ ...o, liked_by_me: liked.has(o.id) })));
    } else {
      setOpinions((data as any) ?? []);
    }
    setLoading(false);
  }, [productId, user]);

  useEffect(() => { void load(); }, [load]);

  const publish = async () => {
    if (!user || !newText.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("game_opinions").insert({
      user_id: user.id, product_id: productId, text: newText.trim(),
      is_spoiler: isSpoiler, spoiler_achievement_name: spoilerAch,
    } as any);
    setPosting(false);
    if (error) { toast.error("Erro ao publicar"); return; }
    setNewText(""); setIsSpoiler(false); setSpoilerAch(null); void load();
  };

  const toggleLike = async (op: Opinion) => {
    if (!user) return;
    if (op.liked_by_me) {
      await supabase.from("game_opinion_likes").delete().match({ opinion_id: op.id, user_id: user.id });
    } else {
      await supabase.from("game_opinion_likes").insert({ opinion_id: op.id, user_id: user.id });
    }
    void load();
  };

  // Abrir conversa privada vinculada à opinião. Cria a conversa se não existir.
  const openConversation = async (op: Opinion) => {
    if (!user) { toast.error("Entre para responder"); return; }
    setOpeningId(op.id);
    try {
      const isAuthor = op.user_id === user.id;
      // Autor: tem várias conversas. Mostrar painel (redireciona para /conversas-opinioes filtrada).
      if (isAuthor) {
        navigate(`/conversas-opinioes?opinion=${op.id}`);
        return;
      }
      // Responder: garante conversa (opinion_id, responder_id=user.id)
      let { data: conv } = await supabase
        .from("opinion_conversations")
        .select("id")
        .eq("opinion_id", op.id)
        .eq("responder_id", user.id)
        .maybeSingle();
      if (!conv) {
        const ins = await supabase
          .from("opinion_conversations")
          .insert({ opinion_id: op.id, author_id: op.user_id, responder_id: user.id })
          .select("id").single();
        if (ins.error) { toast.error("Não foi possível abrir a conversa"); return; }
        conv = ins.data;
      }
      navigate(`/perfil/${op.user_id}/jogo/${op.product_id}/opniao/${op.id}/conversa/${conv!.id}`);
    } finally {
      setOpeningId(null);
    }
  };

  const muteUser = async (uid: string) => {
    if (!user) return;
    await supabase.from("opinion_mutes").insert({ user_id: user.id, target_user_id: uid, kind: "opinion_user" });
    toast.success("Opiniões deste usuário silenciadas");
    void load();
  };
  const muteGame = async () => {
    if (!user) return;
    await supabase.from("opinion_mutes").insert({ user_id: user.id, target_product_id: productId, kind: "opinion_game" });
    toast.success("Opiniões deste jogo silenciadas");
  };

  if (!user) return <p className="text-muted-foreground text-sm">Entre para ver opiniões.</p>;

  return (
    <section className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <Textarea
          value={newText} onChange={e => setNewText(e.target.value)}
          placeholder="Compartilhe uma opinião curta sobre este jogo… (respostas viram conversas privadas)"
          rows={3} maxLength={2000}
        />
        <SpoilerComposerControls
          isSpoiler={isSpoiler} onIsSpoilerChange={setIsSpoiler}
          achievementName={spoilerAch} onAchievementNameChange={setSpoilerAch}
          productId={productId}
        />
        <div className="flex justify-end">
          <Button onClick={publish} disabled={posting || !newText.trim()}>
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : opinions.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">Ainda não há opiniões.</p>
      ) : (
        <ul className="space-y-3">
          {opinions.map(op => (
            <li key={op.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
                  {op.author?.avatar_url
                    ? <img src={op.author.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-sm">{(op.author?.display_name || "?")[0]}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/perfil/${op.user_id}`} className="font-semibold text-sm hover:text-primary">
                      {op.author?.display_name || "Amigo"}
                    </Link>
                    <span className="text-xs text-muted-foreground">{new Date(op.created_at).toLocaleString("pt-BR")}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Ações">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(op.text); toast.success("Texto copiado"); }}>
                          Copiar texto
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={muteGame}>Silenciar opiniões deste jogo</DropdownMenuItem>
                        {op.user_id !== user.id && (
                          <DropdownMenuItem onClick={() => muteUser(op.user_id)}>Silenciar opiniões deste usuário</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toast("Denúncia registrada")}>Denunciar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <SpoilerGuard
                    isSpoiler={!!op.is_spoiler}
                    achievementName={op.spoiler_achievement_name}
                    productId={op.product_id}
                  >
                    <p className="text-sm whitespace-pre-wrap">{op.text}</p>
                    {op.images?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {op.images.map((src, i) => <img key={i} src={src} alt="" className="h-24 rounded-lg object-cover" />)}
                      </div>
                    )}
                  </SpoilerGuard>

                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <button onClick={() => toggleLike(op)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
                      <Heart className={`h-4 w-4 ${op.liked_by_me ? "fill-current text-primary" : ""}`} /> {op.likes_count}
                    </button>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MessageSquare className="h-4 w-4" /> {op.replies_count} {op.replies_count === 1 ? 'pessoa respondeu' : 'pessoas responderam'}
                    </span>
                    <Button size="sm" variant="ghost" className="ml-auto" disabled={openingId === op.id}
                      onClick={() => openConversation(op)}>
                      {openingId === op.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <>
                        {op.user_id === user.id ? 'Ver conversas' : 'Responder em privado'} <ArrowRight className="h-3 w-3 ml-1" />
                      </>}
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

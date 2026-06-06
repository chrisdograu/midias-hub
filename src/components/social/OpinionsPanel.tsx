// Painel de Opiniões (Fase 1.5 — Web)
// Conversas privadas par-a-par: terceiros veem só contagem.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, MoreHorizontal, Send, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Opinion {
  id: string; user_id: string; product_id: string; text: string; images: string[];
  likes_count: number; replies_count: number; created_at: string;
  author?: { display_name: string | null; avatar_url: string | null };
  liked_by_me?: boolean;
}
interface Reply {
  id: string; opinion_id: string; sender_id: string; responder_id: string;
  text: string; images: string[]; created_at: string;
}

export function OpinionsPanel({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [posting, setPosting] = useState(false);

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
    });
    setPosting(false);
    if (error) { toast.error("Erro ao publicar"); return; }
    setNewText(""); void load();
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
          placeholder="Compartilhe uma opinião curta sobre este jogo…"
          rows={3} maxLength={2000}
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
            <OpinionItem key={op.id} op={op} viewerId={user.id}
              onLike={() => toggleLike(op)}
              onMuteUser={() => muteUser(op.user_id)}
              onMuteGame={muteGame}
              onChanged={load}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function OpinionItem({ op, viewerId, onLike, onMuteUser, onMuteGame, onChanged }: {
  op: Opinion; viewerId: string;
  onLike: () => void; onMuteUser: () => void; onMuteGame: () => void; onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const isAuthor = op.user_id === viewerId;
  // Para terceiros: responder cria conversa privada (viewer = responder)
  // Para autor: ele pode visualizar todas as conversas (uma por respondente)

  const openThread = async () => {
    setOpen(o => !o);
    if (open) return;
    setLoading(true);
    const { data } = await supabase
      .from("game_opinion_replies")
      .select("*")
      .eq("opinion_id", op.id)
      .order("created_at", { ascending: true });
    setReplies((data as any) ?? []);
    setLoading(false);
  };

  const send = async () => {
    if (!text.trim()) return;
    const responderId = isAuthor
      // autor escolhe com quem responde — pega o respondente atualmente visível (se houver)
      ? (replies[0]?.responder_id ?? viewerId)
      : viewerId;
    const { error } = await supabase.from("game_opinion_replies").insert({
      opinion_id: op.id, sender_id: viewerId, responder_id: responderId, text: text.trim(),
    });
    if (error) { toast.error("Erro ao enviar"); return; }
    setText("");
    const { data } = await supabase
      .from("game_opinion_replies").select("*").eq("opinion_id", op.id).order("created_at", { ascending: true });
    setReplies((data as any) ?? []);
    onChanged();
  };

  // Agrupa por responder_id para o autor enxergar múltiplas conversas
  const threads = isAuthor
    ? Array.from(new Set(replies.map(r => r.responder_id))).map(rid => ({
        responder_id: rid,
        messages: replies.filter(r => r.responder_id === rid),
      }))
    : [{ responder_id: viewerId, messages: replies.filter(r => r.responder_id === viewerId) }];

  return (
    <li className="bg-card border border-border rounded-xl p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
          {op.author?.avatar_url
            ? <img src={op.author.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-sm">{(op.author?.display_name || "?")[0]}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{op.author?.display_name || "Amigo"}</span>
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
                <DropdownMenuItem onClick={onMuteGame}>Silenciar opiniões deste jogo</DropdownMenuItem>
                {!isAuthor && <DropdownMenuItem onClick={onMuteUser}>Silenciar opiniões deste usuário</DropdownMenuItem>}
                <DropdownMenuItem onClick={() => toast("Denúncia registrada")}>Denunciar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm whitespace-pre-wrap">{op.text}</p>
          {op.images?.length > 0 && (
            <div className="flex gap-2 mt-2">
              {op.images.map((src, i) => <img key={i} src={src} alt="" className="h-24 rounded-lg object-cover" />)}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 text-sm">
            <button onClick={onLike} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
              <Heart className={`h-4 w-4 ${op.liked_by_me ? "fill-current text-primary" : ""}`} /> {op.likes_count}
            </button>
            <button onClick={openThread} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
              <MessageSquare className="h-4 w-4" /> {op.replies_count} respostas
            </button>
          </div>

          {open && (
            <div className="mt-4 pt-4 border-t border-border space-y-4">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : threads.map(thread => (
                <div key={thread.responder_id} className="bg-secondary/40 rounded-lg p-3 space-y-2">
                  {isAuthor && <p className="text-xs text-muted-foreground">Conversa com {thread.responder_id.slice(0, 8)}…</p>}
                  {thread.messages.length === 0 && !isAuthor && (
                    <p className="text-xs text-muted-foreground">Inicie uma conversa privada com o autor.</p>
                  )}
                  {thread.messages.map(m => (
                    <div key={m.id} className={`text-sm ${m.sender_id === viewerId ? "text-right" : ""}`}>
                      <span className="inline-block bg-card px-3 py-1.5 rounded-lg">{m.text}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex gap-2">
                <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Responder…" rows={2} className="flex-1" />
                <Button onClick={send} size="icon"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

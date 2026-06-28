// Painel de Screenshots (Fase 1.5 — Web). Só permite curtir; sem respostas.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Heart, MoreHorizontal, Loader2, Upload } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import SpoilerGuard from "@/components/spoiler/SpoilerGuard";
import SpoilerComposerControls from "@/components/spoiler/SpoilerComposerControls";

interface Shot {
  id: string; user_id: string; product_id: string; caption: string | null;
  images: string[]; likes_count: number; created_at: string;
  is_spoiler?: boolean | null;
  spoiler_achievement_name?: string | null;
  author?: { display_name: string | null; avatar_url: string | null };
  liked_by_me?: boolean;
}

export function ScreenshotsPanel({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [spoilerAch, setSpoilerAch] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("game_screenshots")
      .select("*, author:profiles!user_id(display_name, avatar_url)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (user && data?.length) {
      const ids = data.map((s: any) => s.id);
      const { data: likes } = await supabase
        .from("game_screenshot_likes").select("screenshot_id").in("screenshot_id", ids).eq("user_id", user.id);
      const liked = new Set((likes ?? []).map((l: any) => l.screenshot_id));
      setShots(data.map((s: any) => ({ ...s, liked_by_me: liked.has(s.id) })));
    } else {
      setShots((data as any) ?? []);
    }
    setLoading(false);
  }, [productId, user]);

  useEffect(() => { void load(); }, [load]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length || !user) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 10)) {
      const path = `screenshots/${user.id}/${Date.now()}-${f.name}`;
      const { error } = await supabase.storage.from("product-images").upload(path, f);
      if (error) { toast.error("Erro no upload"); continue; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    if (urls.length) {
      const { error } = await supabase.from("game_screenshots").insert({
        user_id: user.id, product_id: productId, caption: caption.trim() || null, images: urls,
        is_spoiler: isSpoiler, spoiler_achievement_name: spoilerAch,
      } as any);
      if (error) toast.error("Erro ao publicar");
      else { setCaption(""); setIsSpoiler(false); setSpoilerAch(null); void load(); }
    }
    setUploading(false);
  };

  const toggleLike = async (s: Shot) => {
    if (!user) return;
    if (s.liked_by_me) await supabase.from("game_screenshot_likes").delete().match({ screenshot_id: s.id, user_id: user.id });
    else await supabase.from("game_screenshot_likes").insert({ screenshot_id: s.id, user_id: user.id });
    void load();
  };

  if (!user) return <p className="text-muted-foreground text-sm">Entre para ver screenshots.</p>;

  return (
    <section className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <input
          type="text" value={caption} onChange={e => setCaption(e.target.value)}
          maxLength={500} placeholder="Legenda (opcional)…"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
        />
        <SpoilerComposerControls
          isSpoiler={isSpoiler} onIsSpoilerChange={setIsSpoiler}
          achievementName={spoilerAch} onAchievementNameChange={setSpoilerAch}
          productId={productId}
        />
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Enviar screenshot(s)
          <input type="file" accept="image/*" multiple className="hidden" onChange={e => onFiles(e.target.files)} disabled={uploading} />
        </label>
      </div>

      {loading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        : shots.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">Sem screenshots ainda.</p>
        : <ul className="grid sm:grid-cols-2 gap-4">
            {shots.map(s => (
              <li key={s.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <SpoilerGuard
                  isSpoiler={!!s.is_spoiler}
                  achievementName={s.spoiler_achievement_name}
                  productId={productId}
                >
                  <div className="grid grid-cols-2 gap-0.5">
                    {s.images.slice(0, 4).map((src, i) => <img key={i} src={src} alt="" className="w-full h-32 object-cover" />)}
                  </div>
                </SpoilerGuard>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{s.author?.display_name || "Amigo"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="ml-auto text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { if (s.caption) navigator.clipboard.writeText(s.caption); toast.success("Copiado"); }}>Copiar descrição</DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => { await supabase.from("opinion_mutes").insert({ user_id: user.id, target_product_id: productId, kind: "screenshot_game" }); toast.success("Silenciado"); }}>Silenciar screenshots deste jogo</DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => { await supabase.from("opinion_mutes").insert({ user_id: user.id, target_user_id: s.user_id, kind: "screenshot_user" }); toast.success("Silenciado"); }}>Silenciar screenshots deste usuário</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast("Denúncia registrada")}>Denunciar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {s.caption && <p className="text-sm">{s.caption}</p>}
                  <button onClick={() => toggleLike(s)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                    <Heart className={`h-4 w-4 ${s.liked_by_me ? "fill-current text-primary" : ""}`} /> {s.likes_count}
                  </button>
                </div>
              </li>
            ))}
          </ul>}
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, ThumbsUp, MessageSquare, Send, Image as ImageIcon, Sticker } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MForumTag, MobileBadge } from '@/mobile/lib/badge';
import { timeAgo } from '@/mobile/lib/time';
import { toast } from 'sonner';
import { useLoginGate } from '@/components/LoginGate';
import { ItemActionsMenu } from '@/components/ItemActionsMenu';
import { GifPicker } from '@/components/GifPicker';
import SpoilerGuard from '@/components/spoiler/SpoilerGuard';

const IMG_RE = /\[img:(https?:\/\/[^\]\s]+)\]/;
function parseContent(raw: string): { text: string; image: string | null } {
  const m = raw.match(IMG_RE);
  if (!m) return { text: raw, image: null };
  return { text: raw.replace(IMG_RE, '').trim(), image: m[1] };
}

interface Reply {
  id: string; content: string; created_at: string; user_id: string; likes_count: number;
  author: string; reply_to_user?: string | null; iLiked: boolean;
}
interface Post { id: string; content: string; created_at: string; likes_count: number; user_id: string; product_id: string; author: string; product: string; iLiked: boolean }

export default function MForumPost() {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requireAuth, gate } = useLoginGate();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; user: string } | null>(null);
  const [sortBy, setSortBy] = useState<'top' | 'recent'>('top');
  const [submitting, setSubmitting] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sendAttachment = async (url: string) => {
    if (!user || !postId) return;
    const prefix = replyTo ? `@${replyTo.user} ` : '';
    const content = `${prefix}[img:${url}] ${text.trim()}`.slice(0, 1000);
    const { error } = await supabase.from('forum_replies').insert({ user_id: user.id, post_id: postId, content });
    if (error) { toast.error(error.message); return; }
    setText(''); setReplyTo(null); load();
  };
  const uploadImage = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return; }
    const path = `forum/${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error } = await supabase.storage.from('chat-images').upload(path, file);
    if (error) { toast.error('Erro ao enviar'); return; }
    const { data: pub } = supabase.storage.from('chat-images').getPublicUrl(path);
    sendAttachment(pub.publicUrl);
  };

  const load = async () => {
    if (!postId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: p } = await supabase.from('forum_posts').select('id, content, created_at, likes_count, user_id, product_id').eq('id', postId).maybeSingle();
    if (!p) { setLoading(false); return; }
    const { data: rs } = await supabase.from('forum_replies').select('id, content, created_at, user_id, likes_count').eq('post_id', postId).order('created_at');
    const userIds = new Set<string>([p.user_id]); rs?.forEach((r: any) => userIds.add(r.user_id));
    const replyIds = (rs || []).map((r: any) => r.id);
    const [{ data: profiles }, { data: prod }, { data: postLikes }, { data: replyLikes }] = await Promise.all([
      supabase.from('profiles').select('id, display_name').in('id', [...userIds]),
      supabase.from('produtos').select('title').eq('id', p.product_id).maybeSingle(),
      user ? supabase.from('forum_post_likes').select('post_id').eq('post_id', postId).eq('user_id', user.id) : Promise.resolve({ data: [] }),
      user && replyIds.length ? supabase.from('forum_reply_likes').select('reply_id').in('reply_id', replyIds).eq('user_id', user.id) : Promise.resolve({ data: [] }),
    ]);
    const pm = new Map((profiles || []).map((x: any) => [x.id, x.display_name || 'Usuário']));
    const myReplyLikes = new Set((replyLikes || []).map((l: any) => l.reply_id));
    setPost({
      id: p.id, content: p.content, created_at: p.created_at || '', likes_count: p.likes_count,
      user_id: p.user_id, product_id: p.product_id, author: pm.get(p.user_id) || 'Usuário',
      product: prod?.title || 'Jogo', iLiked: (postLikes || []).length > 0,
    });
    setReplies((rs || []).map((r: any) => {
      const m = r.content.match(/^@(\S+)\s/);
      return {
        id: r.id, content: r.content, created_at: r.created_at || '', user_id: r.user_id,
        likes_count: r.likes_count, author: pm.get(r.user_id) || 'Usuário',
        reply_to_user: m ? m[1] : null, iLiked: myReplyLikes.has(r.id),
      };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, [postId, user?.id]);

  const submitReply = async () => {
    if (!requireAuth()) return;
    if (!text.trim() || !postId || submitting || !user) return;
    // anti-duplicação: evita mesmo conteúdo do mesmo user em <3s
    const last = replies[replies.length - 1];
    const prefix = replyTo ? `@${replyTo.user} ` : '';
    const content = (prefix + text.trim()).slice(0, 1000);
    if (last && last.user_id === user.id && last.content === content && Date.now() - +new Date(last.created_at) < 3000) {
      toast.info('Comentário duplicado ignorado');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('forum_replies').insert({ user_id: user.id, post_id: postId, content });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Comentário publicado');
    setText(''); setReplyTo(null); load();
  };

  const deleteReply = async (r: Reply) => {
    if (!user || r.user_id !== user.id) return;
    if (!confirm('Excluir este comentário?')) return;
    const { error } = await supabase.from('forum_replies').delete().eq('id', r.id);
    if (error) { toast.error('Erro ao excluir'); return; }
    setReplies(prev => prev.filter(x => x.id !== r.id));
  };

  const deletePost = async () => {
    if (!post || !user || post.user_id !== user.id) return;
    const { error } = await supabase.from('forum_posts').delete().eq('id', post.id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Post excluído');
    navigate('/m/forum');
  };

  const togglePostLike = async () => {
    if (!user || !post) { toast.error('Entre para curtir'); return; }
    setPost({ ...post, iLiked: !post.iLiked, likes_count: post.likes_count + (post.iLiked ? -1 : 1) });
    if (post.iLiked) {
      await supabase.from('forum_post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      const { error } = await supabase.from('forum_post_likes').insert({ post_id: post.id, user_id: user.id });
      if (error && !/duplicate/i.test(error.message)) toast.error('Erro ao curtir');
    }
  };

  const toggleReplyLike = async (r: Reply) => {
    if (!user) { toast.error('Entre para curtir'); return; }
    setReplies(prev => prev.map(x => x.id === r.id ? { ...x, iLiked: !x.iLiked, likes_count: x.likes_count + (x.iLiked ? -1 : 1) } : x));
    if (r.iLiked) {
      await supabase.from('forum_reply_likes').delete().eq('reply_id', r.id).eq('user_id', user.id);
    } else {
      await supabase.from('forum_reply_likes').insert({ reply_id: r.id, user_id: user.id });
    }
  };

  const editPost = () => {
    toast.info('Edição de post será disponibilizada na próxima etapa do fórum.');
  };

  const canDeletePost = !!user && !!post && user.id === post.user_id;
  const canReportPost = !!post && (!user || user.id !== post.user_id);

  const sortedReplies = [...replies].sort((a, b) => sortBy === 'top' ? b.likes_count - a.likes_count : +new Date(a.created_at) - +new Date(b.created_at));
  const topReply = replies.length > 0 ? [...replies].sort((a, b) => b.likes_count - a.likes_count)[0] : null;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!post) return <div className="p-6 text-center text-muted-foreground">Post não encontrado.</div>;

  return (
    <div className="pb-32">
      <button onClick={() => navigate(-1)} className="px-4 py-3 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</button>

      <div className="px-4 space-y-3">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Link to={`/m/forum/${post.product_id}`}><MForumTag name={post.product.toLowerCase().replace(/\s+/g, '').slice(0, 14)} /></Link>
            <span className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</span>
          </div>
          <Link to={`/profile/${post.user_id}`} className="inline-flex items-center gap-2 text-sm font-semibold hover:text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {post.author?.[0]?.toUpperCase() || '?'}
            </span>
            <span>{post.author}</span>
          </Link>
          <p className="text-base mt-2 whitespace-pre-wrap">{post.content}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <button onClick={togglePostLike} className={`flex items-center gap-1 hover:text-primary transition-colors ${post.iLiked ? 'text-primary' : ''}`}>
              <ThumbsUp className={`h-3.5 w-3.5 ${post.iLiked ? 'fill-current' : ''}`} />{post.likes_count}
            </button>
            <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{replies.length}</span>
            <div className="ml-auto">
              <ItemActionsMenu
                copyText={post.content}
                shareUrl={`/m/forum/post/${post.id}`}
                canEdit={canDeletePost}
                onEdit={editPost}
                canDelete={canDeletePost}
                onDelete={deletePost}
                deleteConfirm="Excluir este post?"
                reportType={canReportPost ? 'forum_post' : undefined}
                reportTargetId={post.id}
                reportLabel="post"
              />
            </div>
          </div>
        </div>

        {topReply && topReply.likes_count > post.likes_count && (
          <div className="glass border border-accent/40 rounded-xl p-3">
            <MobileBadge tone="accent">🔥 Comentário mais popular que o post</MobileBadge>
            <p className="text-sm mt-2"><Link to={`/profile/${topReply.user_id}`} className="font-bold hover:text-primary">{topReply.author}</Link>: {topReply.content}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setSortBy('top')} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${sortBy === 'top' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>Mais curtidos</button>
          <button onClick={() => setSortBy('recent')} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${sortBy === 'recent' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>Recentes</button>
        </div>

        <div className="space-y-2">
          {sortedReplies.length === 0 ? <p className="text-center py-6 text-sm text-muted-foreground">Seja o primeiro a comentar.</p> :
            sortedReplies.map(r => (
              (() => {
                const canDeleteReply = !!user && user.id === r.user_id;
                const canReportReply = !user || user.id !== r.user_id;
                return (
              <div key={r.id} className="glass rounded-xl p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Link to={`/profile/${r.user_id}`} className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold hover:text-primary">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                      {r.author?.[0]?.toUpperCase() || '?'}
                    </span>
                    <span className="truncate">{r.author}</span>
                  </Link>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                </div>
                {(() => {
                  const parsed = parseContent(r.content.replace(/^@\S+\s/, ''));
                  return (
                    <>
                      {parsed.text && <p className="text-sm">{r.reply_to_user && <span className="text-accent font-semibold">@{r.reply_to_user} </span>}{parsed.text}</p>}
                      {parsed.image && <img src={parsed.image} alt="" className="mt-1.5 rounded-lg max-h-60 object-cover" loading="lazy" />}
                    </>
                  );
                })()}
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <button onClick={() => toggleReplyLike(r)} className={`flex items-center gap-1 hover:text-primary transition-colors ${r.iLiked ? 'text-primary' : ''}`}>
                    <ThumbsUp className={`h-3 w-3 ${r.iLiked ? 'fill-current' : ''}`} />{r.likes_count}
                  </button>
                  {user && <button onClick={() => setReplyTo({ id: r.id, user: r.author })} className="hover:text-foreground">Responder</button>}
                  <div className="ml-auto">
                    <ItemActionsMenu
                      copyText={r.content.replace(/^@\S+\s/, '')}
                      canDelete={canDeleteReply}
                      onDelete={() => deleteReply(r)}
                      deleteConfirm="Excluir este comentário?"
                      reportType={canReportReply ? 'comentario_forum' : undefined}
                      reportTargetId={r.id}
                      reportLabel="comentário"
                      iconClassName="h-3.5 w-3.5"
                    />
                  </div>
                </div>
              </div>
                );
              })()
            ))}
        </div>
      </div>

      <div className="fixed bottom-[68px] inset-x-0 backdrop-blur-xl bg-background/90 border-t border-border/50 px-3 py-2">
        {!user ? (
          <div className="text-center py-1">
            <Link to="/m/auth" className="text-xs font-semibold text-primary">Entre para comentar</Link>
          </div>
        ) : (
          <>
            {replyTo && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 mb-1">
                <span>Respondendo a <b className="text-accent">@{replyTo.user}</b></span>
                <button onClick={() => setReplyTo(null)} className="text-destructive">cancelar</button>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <input ref={fileRef} type="file" accept="image/*,image/gif" hidden onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              <button onClick={() => fileRef.current?.click()} className="p-2 rounded-full bg-secondary text-muted-foreground" title="Imagem"><ImageIcon className="h-4 w-4" /></button>
              <button onClick={() => setGifOpen(true)} className="p-2 rounded-full bg-secondary text-muted-foreground" title="GIF"><Sticker className="h-4 w-4" /></button>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Adicione um comentário..." maxLength={1000}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), submitReply())}
                className="flex-1 px-3 py-2.5 bg-card border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <button onClick={submitReply} disabled={!text.trim() || submitting} className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground flex items-center justify-center disabled:opacity-50">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}
      </div>
      {gate}
      {gifOpen && <GifPicker onSelect={(url) => { setGifOpen(false); sendAttachment(url); }} onClose={() => setGifOpen(false)} />}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, ThumbsUp, ThumbsDown, MessageSquare, Send, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MForumTag, MobileBadge } from '@/mobile/lib/badge';
import { timeAgo } from '@/mobile/lib/time';
import { toast } from 'sonner';

interface Reply {
  id: string; content: string; created_at: string; user_id: string; likes_count: number;
  author: string; reply_to_user?: string | null;
}
interface Post { id: string; content: string; created_at: string; likes_count: number; user_id: string; product_id: string; author: string; product: string }

export default function MForumPost() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; user: string } | null>(null);
  const [sortBy, setSortBy] = useState<'top' | 'recent'>('top');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: p } = await supabase.from('forum_posts').select('*').eq('id', id).maybeSingle();
    if (!p) { setLoading(false); return; }
    const { data: rs } = await supabase.from('forum_replies').select('*').eq('post_id', id).order('created_at');
    const userIds = new Set<string>([p.user_id]); rs?.forEach(r => userIds.add(r.user_id));
    const [{ data: profiles }, { data: prod }] = await Promise.all([
      supabase.from('profiles').select('id, display_name').in('id', [...userIds]),
      supabase.from('produtos').select('title').eq('id', p.product_id).maybeSingle(),
    ]);
    const pm = new Map((profiles || []).map(x => [x.id, x.display_name || 'Usuário']));
    setPost({ id: p.id, content: p.content, created_at: p.created_at || '', likes_count: p.likes_count, user_id: p.user_id, product_id: p.product_id, author: pm.get(p.user_id) || 'Usuário', product: prod?.title || 'Jogo' });
    setReplies((rs || []).map(r => {
      // Detect "@username " prefix as reply target
      const m = r.content.match(/^@(\S+)\s/);
      return { id: r.id, content: r.content, created_at: r.created_at || '', user_id: r.user_id, likes_count: r.likes_count, author: pm.get(r.user_id) || 'Usuário', reply_to_user: m ? m[1] : null };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const submitReply = async () => {
    if (!user || !text.trim() || !id) return;
    const prefix = replyTo ? `@${replyTo.user} ` : '';
    const content = (prefix + text.trim()).slice(0, 1000);
    const { error } = await supabase.from('forum_replies').insert({ user_id: user.id, post_id: id, content });
    if (error) { toast.error('Erro ao responder'); return; }
    setText(''); setReplyTo(null); load();
  };

  // Highlight: find top reply (by likes + replies-to it isn't tracked, use likes only)
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
          <p className="text-sm font-semibold">{post.author}</p>
          <p className="text-base mt-2 whitespace-pre-wrap">{post.content}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-primary"><ThumbsUp className="h-3.5 w-3.5" />{post.likes_count}</button>
            <button className="flex items-center gap-1 hover:text-destructive"><ThumbsDown className="h-3.5 w-3.5" /></button>
            <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{replies.length}</span>
          </div>
        </div>

        {topReply && topReply.likes_count > post.likes_count && (
          <div className="glass border border-accent/40 rounded-xl p-3">
            <MobileBadge tone="accent">🔥 Comentário mais popular que o post</MobileBadge>
            <p className="text-sm mt-2"><b>{topReply.author}</b>: {topReply.content}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setSortBy('top')} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${sortBy === 'top' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>Mais curtidos</button>
          <button onClick={() => setSortBy('recent')} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${sortBy === 'recent' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>Recentes</button>
        </div>

        <div className="space-y-2">
          {sortedReplies.length === 0 ? <p className="text-center py-6 text-sm text-muted-foreground">Seja o primeiro a comentar.</p> :
            sortedReplies.map(r => (
              <div key={r.id} className="glass rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{r.author}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                </div>
                <p className="text-sm">
                  {r.reply_to_user && <span className="text-accent font-semibold">@{r.reply_to_user} </span>}
                  {r.content.replace(/^@\S+\s/, '')}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-primary"><ThumbsUp className="h-3 w-3" />{r.likes_count}</button>
                  {user && <button onClick={() => setReplyTo({ id: r.id, user: r.author })} className="hover:text-foreground">Responder</button>}
                </div>
              </div>
            ))}
        </div>
      </div>

      {user && (
        <div className="fixed bottom-[68px] inset-x-0 backdrop-blur-xl bg-background/90 border-t border-border/50 px-3 py-2">
          {replyTo && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 mb-1">
              <span>Respondendo a <b className="text-accent">@{replyTo.user}</b></span>
              <button onClick={() => setReplyTo(null)} className="text-destructive">cancelar</button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Adicione um comentário..." maxLength={1000}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), submitReply())}
              className="flex-1 px-3 py-2.5 bg-card border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button onClick={submitReply} disabled={!text.trim()} className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground flex items-center justify-center disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

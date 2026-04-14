import { useState, useEffect } from 'react';
import { MessageCircle, ThumbsUp, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ForumPost {
  id: string; user_name: string; product_name: string; content: string;
  likes_count: number; replies_count: number; created_at: string;
}

export default function ForumAdmin() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase.from('forum_posts').select('*').order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(p => p.user_id))];
    const prodIds = [...new Set(data.map(p => p.product_id))];

    const [{ data: profiles }, { data: prods }, { data: replies }] = await Promise.all([
      supabase.from('profiles').select('id, display_name').in('id', userIds),
      supabase.from('produtos').select('id, title').in('id', prodIds),
      supabase.from('forum_replies').select('post_id'),
    ]);

    const profileMap = new Map<string, string>(profiles?.map(p => [p.id, p.display_name || 'Usuário']) || []);
    const prodMap = new Map<string, string>(prods?.map(p => [p.id, p.title])) || []);
    const replyCount = new Map<string, number>();
    replies?.forEach(r => replyCount.set(r.post_id, (replyCount.get(r.post_id) || 0) + 1));

    setPosts(data.map(p => ({
      id: p.id, user_name: profileMap.get(p.user_id) || 'Usuário',
      product_name: prodMap.get(p.product_id) || 'Produto', content: p.content,
      likes_count: p.likes_count, replies_count: replyCount.get(p.id) || 0,
      created_at: p.created_at || '',
    })));
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from('forum_replies').delete().eq('post_id', id);
    await supabase.from('forum_posts').delete().eq('id', id);
    toast({ title: 'Post removido' }); fetchPosts();
  };

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary" /> Fórum</h1><p className="text-muted-foreground text-sm">Gestão de posts e discussões</p></div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Posts', value: posts.length, icon: MessageCircle, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Total de Respostas', value: posts.reduce((s, p) => s + p.replies_count, 0), icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Total de Curtidas', value: posts.reduce((s, p) => s + p.likes_count, 0), icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="border-border">
              <TableHead>Usuário</TableHead><TableHead>Produto</TableHead><TableHead className="max-w-[300px]">Conteúdo</TableHead>
              <TableHead className="text-center">Curtidas</TableHead><TableHead className="text-center">Respostas</TableHead>
              <TableHead>Data</TableHead><TableHead className="text-center w-20">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum post</TableCell></TableRow>
              ) : posts.map(p => (
                <TableRow key={p.id} className="border-border hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{p.user_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.product_name}</TableCell>
                  <TableCell className="text-sm max-w-[300px] truncate">{p.content}</TableCell>
                  <TableCell className="text-center text-sm">{p.likes_count}</TableCell>
                  <TableCell className="text-center text-sm">{p.replies_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { MessageCircle, ThumbsUp, Trash2, Loader2, ArrowLeft, Search, Gamepad2, User, Lock, Unlock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ForumPost {
  id: string;
  user_id: string;
  product_id: string;
  user_name: string;
  product_name: string;
  content: string;
  likes_count: number;
  replies_count: number;
  created_at: string;
  is_locked: boolean;
}

export default function ForumAdmin() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'games' | 'game-posts' | 'user-search'>('games');
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);
  const [userQuery, setUserQuery] = useState('');
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
    const profileMap = new Map<string, string>((profiles || []).map(p => [p.id, p.display_name || 'Usuário']));
    const prodMap = new Map<string, string>((prods || []).map(p => [p.id, p.title]));
    const replyCount = new Map<string, number>();
    replies?.forEach(r => replyCount.set(r.post_id, (replyCount.get(r.post_id) || 0) + 1));
    setPosts(data.map(p => ({
      id: p.id,
      user_id: p.user_id,
      product_id: p.product_id,
      user_name: profileMap.get(p.user_id) || 'Usuário',
      product_name: prodMap.get(p.product_id) || 'Produto',
      content: p.content,
      likes_count: p.likes_count,
      replies_count: replyCount.get(p.id) || 0,
      created_at: p.created_at || '',
    })));
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from('forum_replies').delete().eq('post_id', id);
    await supabase.from('forum_posts').delete().eq('id', id);
    toast({ title: 'Post removido' });
    fetchPosts();
  };

  // Group posts by game
  const games = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number; lastAt: string }>();
    posts.forEach(p => {
      const ex = map.get(p.product_id);
      if (!ex) map.set(p.product_id, { id: p.product_id, name: p.product_name, count: 1, lastAt: p.created_at });
      else { ex.count++; if (p.created_at > ex.lastAt) ex.lastAt = p.created_at; }
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [posts]);

  const gamePosts = useMemo(() => selectedProduct ? posts.filter(p => p.product_id === selectedProduct.id) : [], [posts, selectedProduct]);

  const userResults = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return [];
    return posts.filter(p => p.user_name.toLowerCase().includes(q));
  }, [posts, userQuery]);

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary" /> Fórum</h1>
        <p className="text-muted-foreground text-sm">Gestão de posts agrupados por jogo</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Jogos com posts', value: games.length, icon: Gamepad2, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Total de Posts', value: posts.length, icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
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

      {/* Tabs */}
      <div className="flex gap-2">
        <Button variant={view === 'games' ? 'default' : 'outline'} size="sm" onClick={() => { setView('games'); setSelectedProduct(null); }}>
          <Gamepad2 className="h-4 w-4 mr-1" /> Por jogo
        </Button>
        <Button variant={view === 'user-search' ? 'default' : 'outline'} size="sm" onClick={() => { setView('user-search'); setSelectedProduct(null); }}>
          <User className="h-4 w-4 mr-1" /> Buscar por usuário
        </Button>
      </div>

      {/* GAMES list */}
      {view === 'games' && !selectedProduct && (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="border-border">
                <TableHead>Jogo</TableHead><TableHead className="text-center">Posts</TableHead>
                <TableHead>Última atividade</TableHead><TableHead className="w-32 text-center">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {games.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum post</TableCell></TableRow>
                ) : games.map(g => (
                  <TableRow key={g.id} className="border-border hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedProduct({ id: g.id, name: g.name }); setView('game-posts'); }}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-center"><Badge variant="secondary">{g.count}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{g.lastAt ? new Date(g.lastAt).toLocaleDateString('pt-BR') : '—'}</TableCell>
                    <TableCell className="text-center"><Button size="sm" variant="ghost" className="h-7 text-xs">Ver posts</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* GAME posts */}
      {view === 'game-posts' && selectedProduct && (
        <>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(null); setView('games'); }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h2 className="text-lg font-semibold">Posts em: {selectedProduct.name}</h2>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="border-border">
                  <TableHead>Usuário</TableHead><TableHead>Conteúdo</TableHead>
                  <TableHead className="text-center">Curtidas</TableHead><TableHead className="text-center">Respostas</TableHead>
                  <TableHead>Data</TableHead><TableHead className="text-center w-20">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {gamePosts.map(p => (
                    <TableRow key={p.id} className="border-border hover:bg-muted/30 align-top">
                      <TableCell className="text-sm font-medium align-top">{p.user_name}</TableCell>
                      <TableCell className="text-sm align-top"><div className="whitespace-pre-wrap break-words max-w-[480px]">{p.content}</div></TableCell>
                      <TableCell className="text-center text-sm align-top">{p.likes_count}</TableCell>
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
        </>
      )}

      {/* USER search */}
      {view === 'user-search' && (
        <>
          <Card className="border-border/50">
            <CardContent className="py-3 px-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar usuário por nome..." value={userQuery} onChange={e => setUserQuery(e.target.value)} />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="border-border">
                  <TableHead>Usuário</TableHead><TableHead>Jogo (fórum)</TableHead><TableHead>Conteúdo</TableHead>
                  <TableHead>Data</TableHead><TableHead className="text-center w-20">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {userQuery.trim() === '' ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Digite o nome de um usuário</TableCell></TableRow>
                  ) : userResults.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum post encontrado</TableCell></TableRow>
                  ) : userResults.map(p => (
                    <TableRow key={p.id} className="border-border hover:bg-muted/30 align-top">
                      <TableCell className="text-sm font-medium align-top">{p.user_name}</TableCell>
                      <TableCell className="text-sm align-top">{p.product_name}</TableCell>
                      <TableCell className="text-sm align-top"><div className="whitespace-pre-wrap break-words max-w-[380px]">{p.content}</div></TableCell>
                      <TableCell className="text-sm text-muted-foreground align-top">{p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                      <TableCell className="text-center align-top">
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

import { MessageCircle, ThumbsUp, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const mockForumPosts = [
  { id: '1', user: 'João Mendes', product: 'The Legend of Zelda: TOTK', content: 'Alguém sabe como resolver o puzzle do templo de fogo?', likes: 12, replies: 5, created_at: '2025-04-03 14:30', reported: false },
  { id: '2', user: 'Fernanda Lima', product: 'God of War Ragnarök', content: 'Dicas para derrotar o Odin no modo difícil', likes: 24, replies: 8, created_at: '2025-04-02 09:15', reported: false },
  { id: '3', user: 'Lucas Rocha', product: 'Elden Ring', content: 'Melhor build para mago no late game', likes: 18, replies: 12, created_at: '2025-04-01 16:45', reported: false },
  { id: '4', user: 'user_troll99', product: 'Xbox Game Pass', content: 'Conteúdo impróprio removido pelo moderador...', likes: 0, replies: 1, created_at: '2025-03-30 22:10', reported: true },
  { id: '5', user: 'Beatriz Alves', product: 'Nintendo Switch OLED', content: 'Vale a pena trocar do Switch normal pro OLED?', likes: 31, replies: 15, created_at: '2025-03-28 11:20', reported: false },
  { id: '6', user: 'spam_bot_x', product: 'PS5 Slim Digital', content: 'COMPRE AGORA www.golpe.com DESCONTO 90%', likes: 0, replies: 0, created_at: '2025-03-27 03:45', reported: true },
];

export default function ForumAdmin() {
  const posts = mockForumPosts.filter(p => !p.reported);
  const reported = mockForumPosts.filter(p => p.reported);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" /> Fórum
        </h1>
        <p className="text-muted-foreground text-sm">Marketplace Mobile - Gestão de posts e discussões</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><MessageCircle className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{mockForumPosts.length}</p><p className="text-xs text-muted-foreground">Total de Posts</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10"><AlertTriangle className="h-5 w-5 text-yellow-400" /></div>
            <div><p className="text-2xl font-bold">{reported.length}</p><p className="text-xs text-muted-foreground">Denunciados</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><ThumbsUp className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-2xl font-bold">{mockForumPosts.reduce((s, p) => s + p.likes, 0)}</p><p className="text-xs text-muted-foreground">Total de Curtidas</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos"><MessageCircle className="h-4 w-4 mr-1" />Todos os Posts</TabsTrigger>
          <TabsTrigger value="denunciados">
            <AlertTriangle className="h-4 w-4 mr-1" />Denunciados
            {reported.length > 0 && <Badge className="ml-1 bg-destructive/20 text-destructive text-[10px] px-1.5">{reported.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Usuário</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="max-w-[300px]">Conteúdo</TableHead>
                    <TableHead className="text-center">Curtidas</TableHead>
                    <TableHead className="text-center">Respostas</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-center w-28">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map(p => (
                    <TableRow key={p.id} className="border-border hover:bg-muted/30">
                      <TableCell className="text-sm font-medium">{p.user}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.product}</TableCell>
                      <TableCell className="text-sm max-w-[300px] truncate">{p.content}</TableCell>
                      <TableCell className="text-center text-sm">{p.likes}</TableCell>
                      <TableCell className="text-center text-sm">{p.replies}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.created_at}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button variant="ghost" size="sm" className="text-xs h-7"><Eye className="h-3 w-3 mr-1" />Ver</Button>
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="denunciados" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Usuário</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="max-w-[300px]">Conteúdo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-center w-40">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reported.map(p => (
                    <TableRow key={p.id} className="border-border hover:bg-muted/30">
                      <TableCell className="text-sm font-medium">{p.user}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.product}</TableCell>
                      <TableCell className="text-sm max-w-[300px] truncate">{p.content}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.created_at}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button variant="ghost" size="sm" className="text-xs h-7"><Eye className="h-3 w-3 mr-1" />Ver</Button>
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive"><Trash2 className="h-3 w-3 mr-1" />Remover</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

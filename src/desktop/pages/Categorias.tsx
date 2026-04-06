import { useState } from 'react';
import { Tags, Plus, Edit, Trash2, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mockCategorias } from '../mockData';

export default function Categorias() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Tags className="h-6 w-6 text-primary" /> Categorias</h1>
          <p className="text-muted-foreground text-sm">{mockCategorias.length} categorias</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Nova Categoria</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Categoria</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome da categoria" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição da categoria" rows={2} /></div>
              <div className="space-y-2"><Label>URL da Imagem</Label><Input placeholder="https://..." /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-primary text-primary-foreground" onClick={() => setDialogOpen(false)}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mockCategorias.map((c) => (
          <Card key={c.id} className="border-border/50 group hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-muted">
                <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-semibold text-sm">{c.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>
              <div className="flex items-center justify-between mt-3">
                <Badge variant="outline" className="gap-1 text-xs"><Package className="h-3 w-3" />{c.produtos_count} produtos</Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ShoppingCart, Plus, Search, Receipt, CreditCard, Banknote, QrCode, DollarSign, X, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { mockProdutos, mockVendasPresenciais } from '../mockData';

interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
}

export default function Vendas() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', title: 'The Legend of Zelda: TOTK', price: 299.90, qty: 1 },
    { id: '5', title: 'Headset HyperX Cloud III', price: 599.90, qty: 1 },
  ]);
  const [desconto, setDesconto] = useState('10');
  const [paymentMethod, setPaymentMethod] = useState('pix');

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const descontoValue = (subtotal * Number(desconto)) / 100;
  const total = subtotal - descontoValue;

  const addToCart = (p: typeof mockProdutos[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, title: p.title, price: p.price, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = Math.max(1, i.qty + delta);
      return { ...i, qty: newQty };
    }));
  };

  const filteredProducts = mockProdutos.filter(p =>
    p.is_active && p.stock > 0 && p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="h-6 w-6 text-primary" /> Vendas Presenciais</h1>
        <p className="text-muted-foreground text-sm">Ponto de Venda (PDV)</p>
      </div>

      <Tabs defaultValue="nova">
        <TabsList>
          <TabsTrigger value="nova"><Plus className="h-4 w-4 mr-1" />Nova Venda</TabsTrigger>
          <TabsTrigger value="historico"><Receipt className="h-4 w-4 mr-1" />Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="nova" className="mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Product Search */}
            <div className="xl:col-span-3 space-y-4">
              <Card className="border-border/50">
                <CardContent className="py-3 px-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar produto para adicionar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {search && (
                <Card className="border-border/50">
                  <CardContent className="p-2">
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredProducts.map(p => (
                        <button
                          key={p.id}
                          className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 text-left"
                          onClick={() => { addToCart(p); setSearch(''); }}
                        >
                          <div className="flex items-center gap-3">
                            <img src={p.image_url} alt="" className="w-8 h-8 rounded" />
                            <div>
                              <p className="text-sm font-medium">{p.title}</p>
                              <p className="text-xs text-muted-foreground">{p.platform} · Est: {p.stock}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-primary">R$ {p.price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cart Items */}
              <Card className="border-border/50">
                <CardHeader className="pb-2"><CardTitle className="text-base">Itens da Venda</CardTitle></CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Nenhum produto adicionado</p>
                  ) : (
                    <div className="space-y-2">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">R$ {item.price.toFixed(2)} un.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                            <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                            <span className="w-24 text-right text-sm font-semibold">R$ {(item.price * item.qty).toFixed(2)}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.id)}><X className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="xl:col-span-2 space-y-4">
              <Card className="border-border/50">
                <CardHeader className="pb-2"><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cliente</label>
                    <Select defaultValue="anonimo">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anonimo">Venda Anônima</SelectItem>
                        <SelectItem value="1">João Mendes</SelectItem>
                        <SelectItem value="2">Fernanda Lima</SelectItem>
                        <SelectItem value="4">Beatriz Alves</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Desconto (%)</label>
                    <Input type="number" value={desconto} onChange={(e) => setDesconto(e.target.value)} min="0" max="100" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Forma de Pagamento</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'pix', label: 'PIX', icon: QrCode },
                        { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                        { value: 'credito', label: 'Crédito', icon: CreditCard },
                        { value: 'debito', label: 'Débito', icon: CreditCard },
                      ].map(pm => (
                        <Button
                          key={pm.value}
                          variant={paymentMethod === pm.value ? 'default' : 'outline'}
                          className={paymentMethod === pm.value ? 'bg-primary text-primary-foreground' : ''}
                          onClick={() => setPaymentMethod(pm.value)}
                          size="sm"
                        >
                          <pm.icon className="h-4 w-4 mr-1" />{pm.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-yellow-400"><span>Desconto ({desconto}%)</span><span>-R$ {descontoValue.toFixed(2)}</span></div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold pt-1"><span>Total</span><span className="text-primary">R$ {total.toFixed(2)}</span></div>
                  </div>

                  <Button className="w-full bg-primary text-primary-foreground font-semibold" size="lg" disabled={cart.length === 0}>
                    <DollarSign className="h-5 w-5 mr-2" /> Finalizar Venda
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead className="text-center">Itens</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockVendasPresenciais.map(v => (
                    <TableRow key={v.id} className="border-border hover:bg-muted/30">
                      <TableCell className="font-mono text-sm text-primary">{v.id}</TableCell>
                      <TableCell className="text-sm">{v.cliente}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.funcionario}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{v.items}</Badge></TableCell>
                      <TableCell className="text-right text-sm">R$ {v.subtotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm text-yellow-400">{v.desconto > 0 ? `-R$ ${v.desconto.toFixed(2)}` : '-'}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">R$ {v.total.toFixed(2)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{v.payment_method}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.created_at}</TableCell>
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

import {
  DollarSign, ShoppingCart, AlertTriangle, Users, Package,
  ClipboardList, TrendingUp, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockDashboardStats, mockProdutos, mockPedidosOnline, statusLabels, statusColors } from '../mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const stats = [
  { label: 'Faturamento Hoje', value: `R$ ${mockDashboardStats.faturamentoHoje.toFixed(2)}`, icon: DollarSign, trend: '+12%', up: true, color: 'text-green-400' },
  { label: 'Vendas Hoje', value: mockDashboardStats.vendasHoje.toString(), icon: ShoppingCart, trend: '+3', up: true, color: 'text-primary' },
  { label: 'Pedidos Pendentes', value: mockDashboardStats.pedidosPendentes.toString(), icon: ClipboardList, trend: '2 novos', up: false, color: 'text-yellow-400' },
  { label: 'Estoque Baixo', value: mockDashboardStats.estoqueBaixo.toString(), icon: AlertTriangle, trend: '3 produtos', up: false, color: 'text-red-400' },
  { label: 'Faturamento Mês', value: `R$ ${mockDashboardStats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, trend: '+18%', up: true, color: 'text-accent' },
  { label: 'Total Clientes', value: mockDashboardStats.totalClientes.toString(), icon: Users, trend: '+8', up: true, color: 'text-blue-400' },
];

const alertProducts = mockProdutos.filter(p => p.stock <= p.stock_alert_threshold);

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral do sistema</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className={`text-[10px] font-medium flex items-center gap-0.5 ${stat.up ? 'text-green-400' : 'text-yellow-400'}`}>
                  {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.trend}
                </span>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="xl:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Vendas da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockDashboardStats.vendasSemana}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                <XAxis dataKey="dia" tick={{ fill: 'hsl(215 15% 55%)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(215 15% 55%)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 8, color: 'hsl(210 20% 92%)' }}
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
                <Legend />
                <Bar dataKey="presencial" name="Presencial" fill="hsl(170 80% 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="online" name="Online" fill="hsl(270 60% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockDashboardStats.topProdutos.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${(p.vendas / mockDashboardStats.topProdutos[0].vendas) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary">{p.vendas}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Stock Alerts */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" /> Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <img src={p.image_url} alt={p.title} className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.platform}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={p.stock === 0 ? 'border-red-500/50 text-red-400' : 'border-yellow-500/50 text-yellow-400'}>
                      {p.stock === 0 ? 'Sem estoque' : `${p.stock} un.`}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Mín: {p.stock_alert_threshold}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Online Orders */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockPedidosOnline.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{p.id}</p>
                    <p className="text-xs text-muted-foreground">{p.cliente} · {p.items} {p.items === 1 ? 'item' : 'itens'}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge>
                    <span className="text-sm font-semibold">R$ {p.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { BarChart3, Calendar, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockDashboardStats, mockProdutos, mockFuncionarios } from '../mockData';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const chartColors = {
  primary: 'hsl(170 80% 50%)',
  accent: 'hsl(270 60% 55%)',
  green: 'hsl(142 72% 45%)',
  yellow: 'hsl(45 93% 58%)',
  red: 'hsl(0 72% 51%)',
  blue: 'hsl(217 91% 60%)',
};

const faturamentoMensal = [
  { mes: 'Jan', presencial: 32000, online: 18000 },
  { mes: 'Fev', presencial: 28000, online: 21000 },
  { mes: 'Mar', presencial: 35000, online: 24000 },
  { mes: 'Abr', presencial: 42000, online: 28000 },
];

const categoriaVendas = [
  { name: 'Jogos Digitais', value: 35 },
  { name: 'Jogos Físicos', value: 25 },
  { name: 'Consoles', value: 15 },
  { name: 'Acessórios', value: 15 },
  { name: 'Assinaturas', value: 10 },
];

const pieColors = [chartColors.primary, chartColors.accent, chartColors.blue, chartColors.yellow, chartColors.green];

const vendasFuncionario = [
  { name: 'Ana Oliveira', vendas: 45, faturamento: 18500 },
  { name: 'Pedro Santos', vendas: 32, faturamento: 12800 },
  { name: 'Carlos Silva', vendas: 12, faturamento: 8200 },
];

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('mes');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Relatórios</h1>
          <p className="text-muted-foreground text-sm">Análise de vendas e desempenho</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-40"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="semana">Última Semana</SelectItem>
            <SelectItem value="mes">Último Mês</SelectItem>
            <SelectItem value="trimestre">Último Trimestre</SelectItem>
            <SelectItem value="ano">Último Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Faturamento Total', value: 'R$ 70.580,00', icon: DollarSign, color: 'text-green-400' },
          { label: 'Total de Vendas', value: '186', icon: TrendingUp, color: 'text-primary' },
          { label: 'Ticket Médio', value: 'R$ 379,46', icon: Package, color: 'text-accent' },
          { label: 'Clientes Ativos', value: '142', icon: Users, color: 'text-blue-400' },
        ].map(kpi => (
          <Card key={kpi.label} className="border-border/50">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
              <div><p className="text-xl font-bold">{kpi.value}</p><p className="text-xs text-muted-foreground">{kpi.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="faturamento">
        <TabsList>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="funcionarios">Por Funcionário</TabsTrigger>
          <TabsTrigger value="comparativo">Presencial vs Online</TabsTrigger>
        </TabsList>

        <TabsContent value="faturamento" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">Faturamento Mensal</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={faturamentoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                  <XAxis dataKey="mes" tick={{ fill: 'hsl(215 15% 55%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(215 15% 55%)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 8, color: 'hsl(210 20% 92%)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="presencial" name="Presencial" stroke={chartColors.primary} strokeWidth={2} dot={{ fill: chartColors.primary }} />
                  <Line type="monotone" dataKey="online" name="Online" stroke={chartColors.accent} strokeWidth={2} dot={{ fill: chartColors.accent }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos" className="mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-base">Vendas por Categoria</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoriaVendas} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {categoriaVendas.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 8, color: 'hsl(210 20% 92%)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-base">Top 5 Produtos</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockDashboardStats.topProdutos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                    <XAxis type="number" tick={{ fill: 'hsl(215 15% 55%)', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'hsl(215 15% 55%)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 8, color: 'hsl(210 20% 92%)' }} />
                    <Bar dataKey="vendas" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funcionarios" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">Vendas por Funcionário</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Funcionário</TableHead>
                    <TableHead className="text-center">Vendas</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendasFuncionario.map(f => (
                    <TableRow key={f.name} className="border-border">
                      <TableCell className="font-medium text-sm">{f.name}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{f.vendas}</Badge></TableCell>
                      <TableCell className="text-right text-sm font-semibold text-primary">R$ {f.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">R$ {(f.faturamento / f.vendas).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparativo" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">Presencial vs Online (Semanal)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={mockDashboardStats.vendasSemana}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                  <XAxis dataKey="dia" tick={{ fill: 'hsl(215 15% 55%)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(215 15% 55%)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 8, color: 'hsl(210 20% 92%)' }} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="presencial" name="Presencial" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="online" name="Online" fill={chartColors.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

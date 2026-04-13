import { useState, useEffect } from 'react';
import { UserCog, Plus, Search, Shield, User, MoreHorizontal, Edit, Trash2, ToggleLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { POSITION_LABELS, type EmployeePosition } from '@/hooks/useDesktopAuth';

interface Employee {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'atendente';
  position: EmployeePosition | null;
  is_active: boolean;
  created_at: string;
}

const POSITION_OPTIONS: { value: EmployeePosition; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'moderador', label: 'Moderador' },
  { value: 'atendente_marketplace', label: 'Atendente Marketplace' },
  { value: 'estoquista', label: 'Estoquista' },
  { value: 'atendente', label: 'Atendente' },
];

export default function Funcionarios() {
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'atendente'>('atendente');
  const [formPosition, setFormPosition] = useState<EmployeePosition>('atendente');

  const fetchEmployees = async () => {
    setLoading(true);
    // Get all staff user_roles
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('id, user_id, role, position')
      .in('role', ['admin', 'atendente']);

    if (error || !roles) {
      setLoading(false);
      return;
    }

    // Get profiles for these users
    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, phone, created_at')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const emps: Employee[] = roles.map(r => {
      const profile = profileMap.get(r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        display_name: profile?.display_name || 'Sem nome',
        email: '',
        phone: profile?.phone || null,
        role: r.role as 'admin' | 'atendente',
        position: r.position as EmployeePosition | null,
        is_active: true,
        created_at: profile?.created_at || new Date().toISOString(),
      };
    });

    setEmployees(emps);
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormRole('atendente');
    setFormPosition('atendente');
    setSelectedEmployee(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormName(emp.display_name);
    setFormEmail(emp.email);
    setFormPhone(emp.phone || '');
    setFormPassword('');
    setFormRole(emp.role);
    setFormPosition(emp.position || 'atendente');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (selectedEmployee) {
      // Edit mode: update profile + role
      setSaving(true);
      await supabase
        .from('profiles')
        .update({ display_name: formName, phone: formPhone || null })
        .eq('id', selectedEmployee.user_id);

      const roleValue = formPosition === 'admin' ? 'admin' : 'atendente';
      await supabase
        .from('user_roles')
        .update({ role: roleValue as any, position: formPosition as any })
        .eq('id', selectedEmployee.id);

      toast({ title: 'Funcionário atualizado com sucesso!' });
      setSaving(false);
      setDialogOpen(false);
      fetchEmployees();
    } else {
      // Create mode: use edge function to create user
      if (!formEmail || !formPassword || formPassword.length < 6) {
        toast({ title: 'Preencha email e senha (mín. 6 caracteres)', variant: 'destructive' });
        return;
      }
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('manage-employee', {
        body: {
          action: 'create',
          email: formEmail,
          password: formPassword,
          display_name: formName,
          phone: formPhone || null,
          role: formPosition === 'admin' ? 'admin' : 'atendente',
          position: formPosition,
        },
      });

      if (error || data?.error) {
        toast({ title: data?.error || error?.message || 'Erro ao criar funcionário', variant: 'destructive' });
      } else {
        toast({ title: 'Funcionário criado com sucesso!' });
        setDialogOpen(false);
        fetchEmployees();
      }
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    setSaving(true);

    const { error } = await supabase.functions.invoke('manage-employee', {
      body: { action: 'delete', user_id: selectedEmployee.user_id },
    });

    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    } else {
      toast({ title: 'Funcionário excluído' });
      fetchEmployees();
    }
    setSaving(false);
    setDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleToggleActive = async (emp: Employee) => {
    // For now, toggle by changing role to 'user' (deactivate) or back to 'atendente' (activate)
    const isCurrentlyActive = emp.role === 'admin' || emp.role === 'atendente';
    if (isCurrentlyActive) {
      // Deactivate: change role to user
      await supabase.from('user_roles').update({ role: 'user' as any, position: null }).eq('id', emp.id);
      toast({ title: `${emp.display_name} desativado` });
    } else {
      await supabase.from('user_roles').update({ role: 'atendente' as any, position: emp.position as any }).eq('id', emp.id);
      toast({ title: `${emp.display_name} reativado` });
    }
    fetchEmployees();
  };

  const filtered = employees.filter(f =>
    f.display_name.toLowerCase().includes(search.toLowerCase())
  );

  const getPositionLabel = (pos: EmployeePosition | null, role: string) => {
    if (pos) return POSITION_LABELS[pos] || pos;
    return role === 'admin' ? 'Administrador' : 'Atendente';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><UserCog className="h-6 w-6 text-primary" /> Funcionários</h1>
          <p className="text-muted-foreground text-sm">{employees.length} funcionários cadastrados</p>
        </div>
        <Button className="bg-primary text-primary-foreground" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Novo Funcionário
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="py-3 px-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar funcionário..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-center w-16">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum funcionário encontrado
                    </TableCell>
                  </TableRow>
                ) : filtered.map((f) => (
                  <TableRow key={f.id} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {f.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{f.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={f.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}>
                        {f.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                        {getPositionLabel(f.position, f.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{f.phone || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(f.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(f)}>
                            <Edit className="h-4 w-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(f)}>
                            <ToggleLeft className="h-4 w-4 mr-2" />Desativar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedEmployee(f); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEmployee ? 'Editar Funcionário' : 'Cadastrar Funcionário'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input placeholder="Nome" value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            {!selectedEmployee && (
              <>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="email@midias.com" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Senha Inicial</Label>
                  <Input type="password" placeholder="••••••••" value={formPassword} onChange={e => setFormPassword(e.target.value)} />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="(11) 99999-0000" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select value={formPosition} onValueChange={(v) => setFormPosition(v as EmployeePosition)}>
                <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                <SelectContent>
                  {POSITION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button className="bg-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedEmployee?.display_name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

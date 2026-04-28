import { useEffect, useState } from 'react';
import { Loader2, Save, Sun, Moon, Bell, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import BlockedUsersTab from '@/components/perfil/BlockedUsersTab';

export default function MConfig() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    display_name: '', username: '', bio: '', phone: '', cpf: '',
    push_notifications: true, email_notifications: false, is_private: false,
  });
  const [saving, setSaving] = useState(false);
  const [certifying, setCertifying] = useState(false);
  const [hasCert, setHasCert] = useState<'none' | 'pending' | 'active'>('none');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('certificados').select('status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      ]);
      if (p) setForm({
        display_name: p.display_name || '', username: p.username || '', bio: p.bio || '',
        phone: p.phone || '', cpf: p.cpf || '',
        push_notifications: p.push_notifications, email_notifications: p.email_notifications, is_private: p.is_private,
      });
      const last = c?.[0]?.status;
      setHasCert(last === 'ativo' ? 'active' : last === 'pendente' ? 'pending' : 'none');
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id);
    if (error) toast.error('Erro ao salvar'); else toast.success('Configurações salvas');
    setSaving(false);
  };

  const requestCert = async () => {
    if (!user) return;
    if (!form.cpf || !form.phone) { toast.error('Preencha CPF e telefone primeiro'); return; }
    setCertifying(true);
    await supabase.from('profiles').update({ cpf: form.cpf, phone: form.phone }).eq('id', user.id);
    const { error } = await supabase.from('certificados').insert({ user_id: user.id, status: 'pendente' });
    if (error) toast.error('Erro ao solicitar'); else { toast.success('Solicitação enviada para análise'); setHasCert('pending'); }
    setCertifying(false);
  };

  if (!user) return <div className="p-6 text-center text-muted-foreground">Entre para acessar configurações.</div>;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="font-display text-xl font-bold gradient-text">Configurações</h1>

      <Section title="👤 Conta">
        <Field label="Nome de exibição" value={form.display_name} onChange={v => setForm({ ...form, display_name: v })} />
        <Field label="@username" value={form.username} onChange={v => setForm({ ...form, username: v.toLowerCase().replace(/\s/g, '') })} />
        <Field label="Bio" value={form.bio} onChange={v => setForm({ ...form, bio: v })} multiline />
        <Field label="Telefone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
        <Field label="CPF (apenas para vendedor protegido)" value={form.cpf} onChange={v => setForm({ ...form, cpf: v })} />
      </Section>

      <Section title="🛡️ Vendedor protegido">
        <p className="text-xs text-muted-foreground">
          Anúncios "protegidos pela loja" exigem verificação de identidade. Sem certificação você ainda pode anunciar, mas a loja não responde por reembolsos em caso de problema.
        </p>
        {hasCert === 'active' ? (
          <div className="flex items-center gap-2 text-success text-sm font-semibold"><ShieldCheck className="h-4 w-4" />Você é vendedor verificado</div>
        ) : hasCert === 'pending' ? (
          <div className="text-sm text-warning">⏳ Solicitação em análise pelos moderadores</div>
        ) : (
          <button onClick={requestCert} disabled={certifying} className="w-full py-2.5 rounded-lg bg-success text-white text-sm font-semibold disabled:opacity-50">
            {certifying ? 'Enviando...' : 'Solicitar certificação'}
          </button>
        )}
      </Section>

      <Section title="🔔 Notificações">
        <Toggle label="Notificações push" checked={form.push_notifications} onChange={v => setForm({ ...form, push_notifications: v })} />
        <Toggle label="Notificações por e-mail" checked={form.email_notifications} onChange={v => setForm({ ...form, email_notifications: v })} />
      </Section>

      <Section title="🎨 Aparência">
        <button onClick={toggleTheme} className="w-full py-2.5 rounded-lg bg-card border border-border text-sm font-semibold flex items-center justify-center gap-2">
          {theme === 'dark' ? <><Moon className="h-4 w-4" />Modo escuro ativo</> : <><Sun className="h-4 w-4" />Modo claro ativo</>}
        </button>
      </Section>

      <Section title="🔒 Privacidade">
        <Toggle label="Perfil privado (oculta biblioteca)" checked={form.is_private} onChange={v => setForm({ ...form, is_private: v })} />
      </Section>

      <Section title="🚫 Usuários bloqueados">
        <BlockedUsersTab />
      </Section>

      <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar alterações
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} maxLength={500} rows={3} className="w-full mt-1 p-2.5 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
        : <input value={value} onChange={e => onChange(e.target.value)} maxLength={120} className="w-full mt-1 p-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />}
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="w-full flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{label}</span>
      <span className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-secondary'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

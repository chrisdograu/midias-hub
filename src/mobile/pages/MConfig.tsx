import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Save, Sun, Moon, Camera, User, ShieldOff, ChevronRight, Store, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { TUTORIALS } from '@/components/tutorial/TutorialContext';
import MPreferencesSection from '@/mobile/components/MPreferencesSection';

export default function MConfig() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    display_name: '', username: '', bio: '', seller_bio: '', phone: '', cpf: '',
    push_notifications: true, email_notifications: false, is_private: false,
    require_follow_approval: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      // RPC segura: retorna perfil completo do próprio usuário (inclui CPF/telefone/preferências).
      const { data: rpcData } = await (supabase as any).rpc('get_my_profile');
      const p = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (cancel) return;
      if (p) {
        setForm({
          display_name: p.display_name || '', username: p.username || '', bio: p.bio || '',
          seller_bio: (p as any).seller_bio || '',
          phone: p.phone || '', cpf: p.cpf || '',
          push_notifications: p.push_notifications, email_notifications: p.email_notifications,
          is_private: p.is_private,
          require_follow_approval: !!(p as any).require_follow_approval,
        });
        setAvatarUrl(p.avatar_url || null);
      }
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [user?.id]);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 3MB'); return; }
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { toast.error('Erro ao enviar imagem'); setUploadingAvatar(false); return; }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error } = await supabase.from('profiles').update({ avatar_url: pub.publicUrl }).eq('id', user.id);
    if (error) toast.error('Erro ao salvar avatar');
    else { setAvatarUrl(pub.publicUrl); toast.success('Foto atualizada ✨'); }
    setUploadingAvatar(false);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update(form as any).eq('id', user.id);
    if (error) toast.error('Erro ao salvar'); else toast.success('Configurações salvas');
    setSaving(false);
  };


  if (!user) return <div className="p-6 text-center text-muted-foreground">Entre para acessar configurações.</div>;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="font-display text-xl font-bold gradient-text">Configurações</h1>

      <div className="flex flex-col items-center gap-3 py-2">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground font-bold text-2xl ring-2 ring-primary/40">
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : (form.display_name?.[0]?.toUpperCase() || <User className="h-10 w-10" />)}
          </div>
          <button
            onClick={() => avatarRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg disabled:opacity-50"
          >
            {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={avatarRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
        </div>
        <p className="text-[11px] text-muted-foreground">Toque na câmera para mudar a foto</p>
      </div>

      <Section title="👤 Conta">
        <Field label="Nome de exibição" value={form.display_name} onChange={v => setForm({ ...form, display_name: v })} />
        <Field label="@username" value={form.username} onChange={v => setForm({ ...form, username: v.toLowerCase().replace(/\s/g, '') })} />
        <Field label="Bio pessoal" value={form.bio} onChange={v => setForm({ ...form, bio: v })} multiline />
        <Field label="Telefone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
        <Field label="CPF (apenas para vendedor protegido)" value={form.cpf} onChange={v => setForm({ ...form, cpf: v })} />
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
        <Toggle
          label="Aprovar manualmente quem quer me seguir"
          checked={form.require_follow_approval}
          onChange={v => setForm({ ...form, require_follow_approval: v })}
        />
        <p className="text-[11px] text-muted-foreground -mt-1">
          Quando ativo, novos seguidores ficam pendentes em <strong>Amigos → Solicitações</strong> até você aprovar ou recusar (igual no Instagram).
        </p>
      </Section>

      <Link
        to="/m/config/bloqueados"
        className="glass rounded-2xl p-4 flex items-center gap-3 hover:border-primary/40 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center">
          <ShieldOff className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Usuários bloqueados</p>
          <p className="text-[11px] text-muted-foreground">Veja e gerencie sua lista de bloqueios em uma página separada</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <Section title={<span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-accent" />Tutoriais práticos</span>}>
        <p className="text-[11px] text-muted-foreground -mt-1">Cada tutorial abre um playground interativo passo-a-passo e termina com um link direto para a página real.</p>
        <Link to="/m/tutoriais" className="flex items-center gap-2 p-3 rounded-lg bg-card border border-primary/40 hover:bg-primary/5 transition-colors">
          <span className="text-xl">🎓</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Abrir tutoriais mobile</p>
            <p className="text-[10px] text-muted-foreground">{TUTORIALS.filter(t => t.area === 'mobile').length} guias interativos</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </Section>

      <Link to="/m/vendedor" className="glass rounded-2xl p-4 flex items-center gap-3 hover:border-accent/40 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
          <Store className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Perfil $vendedor</p>
          <p className="text-[11px] text-muted-foreground">Crie, edite e gerencie sua loja no marketplace</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>


      <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar alterações
      </button>
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
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
      <span className="text-sm text-foreground text-left flex-1 pr-3">{label}</span>
      <span className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-secondary'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

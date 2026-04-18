import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { User, Save, Loader2, Camera, Lock, Bell, Eye, EyeOff, Shield, UserX, Star } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BlockedUsersTab from '@/components/perfil/BlockedUsersTab';
import MyReviewsTab from '@/components/perfil/MyReviewsTab';

export default function Perfil() {
  const { user, profile, updatePassword } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (user && !loaded) {
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setPhone(data.phone || '');
        setCpf(data.cpf || '');
        setAvatarUrl(data.avatar_url || '');
        setIsPrivate(data.is_private || false);
        setPushNotifications(data.push_notifications ?? true);
        setEmailNotifications(data.email_notifications ?? false);
      }
      setLoaded(true);
    });
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 2MB'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) { toast.error('Erro ao enviar imagem'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(publicUrl);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    toast.success('Avatar atualizado!');
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName,
      username: username || null,
      phone: phone || null,
      cpf: cpf || null,
      is_private: isPrivate,
      push_notifications: pushNotifications,
      email_notifications: emailNotifications,
    }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar perfil'); return; }
    toast.success('Perfil atualizado!');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('A senha deve ter no mínimo 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem'); return; }
    setSavingPassword(true);
    const result = await updatePassword(newPassword);
    setSavingPassword(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success('Senha alterada com sucesso!');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordSection(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-6">Minha Conta</h1>

        {/* Avatar & Info */}
        <div className="bg-card border border-border rounded-xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-border">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-primary" />
                )}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{displayName || 'Usuário'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Nome de exibição</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="@seuusuario"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Telefone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-0000"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">CPF</label>
                <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">E-mail</label>
              <input value={user?.email || ''} disabled
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-sm text-muted-foreground" />
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Alterações
            </button>
          </form>
        </div>

        {/* Privacidade */}
        <div className="bg-card border border-border rounded-xl p-6 mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" /> Privacidade
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Perfil privado</p>
              <p className="text-xs text-muted-foreground">Sua biblioteca e perfil não ficam visíveis para outros usuários</p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
        </div>

        {/* Notificações */}
        <div className="bg-card border border-border rounded-xl p-6 mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-primary" /> Notificações
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Notificações push</p>
                <p className="text-xs text-muted-foreground">Receber alertas no navegador/app</p>
              </div>
              <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Notificações por e-mail</p>
                <p className="text-xs text-muted-foreground">Receber resumos e alertas por e-mail</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
          </div>
        </div>

        {/* Alterar Senha */}
        <div className="bg-card border border-border rounded-xl p-6 mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-primary" /> Segurança
          </h2>
          {!showPasswordSection ? (
            <button onClick={() => setShowPasswordSection(true)}
              className="text-sm text-primary hover:underline">
              Alterar senha
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <label className="text-sm text-muted-foreground mb-1 block">Nova senha</label>
                <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Confirmar nova senha</label>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleChangePassword} disabled={savingPassword || !newPassword}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                  {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                  Alterar Senha
                </button>
                <button onClick={() => { setShowPasswordSection(false); setNewPassword(''); setConfirmPassword(''); }}
                  className="px-4 py-2 bg-secondary text-foreground text-sm rounded-lg hover:bg-muted">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

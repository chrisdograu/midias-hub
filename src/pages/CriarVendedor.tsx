import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Store, Loader2, Camera, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

/**
 * Página de criação/edição do perfil vendedor ($).
 * Acessada via /vendedor/criar (criar) ou /vendedor/editar (editar próprio).
 */
export default function CriarVendedor({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [existing, setExisting] = useState<any>(null);

  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('seller_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setExisting(data);
        setHandle(data.handle);
        setDisplayName(data.display_name);
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        setIsPrivate(data.is_private);
        if (mode === 'create') {
          // Já tem — manda para edição
          navigate(`/vendedor/${data.handle}`, { replace: true });
          return;
        }
      }
      setLoading(false);
    })();
  }, [user?.id, mode]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 2MB'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/seller.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error('Erro ao enviar imagem'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(publicUrl + `?t=${Date.now()}`);
    setUploading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!/^[a-zA-Z0-9_.-]{2,32}$/.test(handle)) {
      toast.error('Handle inválido (2-32 caracteres, letras/números/._-)'); return;
    }
    if (!displayName.trim()) { toast.error('Informe um nome de vendedor'); return; }
    setSaving(true);
    const payload = {
      user_id: user.id,
      handle: handle.toLowerCase(),
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      avatar_url: avatarUrl || null,
      is_private: isPrivate,
    };
    const { error } = existing
      ? await supabase.from('seller_profiles').update(payload).eq('user_id', user.id)
      : await supabase.from('seller_profiles').insert(payload);
    setSaving(false);
    if (error) {
      if (error.code === '23505') toast.error('Este $handle já está em uso');
      else toast.error('Erro ao salvar perfil vendedor');
      return;
    }
    toast.success(existing ? 'Perfil vendedor atualizado!' : 'Perfil vendedor criado! 🎉');
    navigate(`/vendedor/${payload.handle}`);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <Store className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">
              {existing ? 'Editar $vendedor' : 'Criar $vendedor'}
            </h1>
            <p className="text-sm text-muted-foreground">Perfil exclusivo para o marketplace, separado do seu @usuario.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5 bg-card border border-border rounded-xl p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border-2 border-border">
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <Store className="h-9 w-9 text-accent" />}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
            </div>
            <div className="text-xs text-muted-foreground">
              Pode ser uma foto totalmente diferente do seu @perfil pessoal.
            </div>
          </div>

          {/* Handle */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Handle do vendedor</label>
            <div className="flex items-center bg-secondary border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-accent/50">
              <span className="px-3 text-accent font-bold">$</span>
              <input
                value={handle}
                onChange={e => setHandle(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ''))}
                placeholder="suaLoja"
                disabled={!!existing}
                className="flex-1 py-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">2-32 caracteres. Pode ser igual ou diferente do seu @usuario.</p>
          </div>

          {/* Nome */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Nome de exibição</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Ex: Loja do João"
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Bio / descrição</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Conte sobre sua loja..."
              rows={3}
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
            />
          </div>

          {/* Privacidade */}
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <div>
              <p className="text-sm font-medium text-foreground">Perfil vendedor privado</p>
              <p className="text-xs text-muted-foreground">Quem chegar via anúncio ainda consegue ver. Independente da privacidade do @usuario.</p>
            </div>
            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="h-4 w-4 accent-accent" />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-accent text-accent-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {existing ? 'Salvar alterações' : 'Criar perfil vendedor'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

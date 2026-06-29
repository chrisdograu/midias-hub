// Configuração do perfil $vendedor + onboarding para quem ainda não criou.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Loader2, Save, ExternalLink, ShieldCheck, Plus, ArrowLeft, Eye, EyeOff, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function VendedorConfig() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [cert, setCert] = useState<'none'|'pending'|'active'>('none');
  const [activeAds, setActiveAds] = useState(0);
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileCpf, setProfileCpf] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [certifying, setCertifying] = useState(false);
  const [sellerBio, setSellerBio] = useState('');
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationMessage, setVacationMessage] = useState('');


  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: sp }, { data: c }, { count }, { data: prof }] = await Promise.all([
        supabase.from('seller_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('certificados').select('status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('anuncios').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'active'),
        supabase.from('profiles').select('cpf,phone,seller_bio').eq('id', user.id).maybeSingle(),
      ]);
      setSeller(sp);
      if (sp) {
        setBio(sp.bio || ''); setDisplayName(sp.display_name); setAvatarUrl(sp.avatar_url || '');
        setIsPrivate(sp.is_private);
        setVacationMode(!!(sp as any).vacation_mode);
        setVacationMessage((sp as any).vacation_message || '');
      }
      if (prof) {
        setProfileCpf((prof as any).cpf || '');
        setProfilePhone((prof as any).phone || '');
        setSellerBio((prof as any).seller_bio || '');
      }
      const last = c?.[0]?.status;
      setCert(last === 'ativo' ? 'active' : last === 'pendente' ? 'pending' : 'none');
      setActiveAds(count || 0);
      setLoading(false);
    })();
  }, [user?.id]);

  const requestCert = async () => {
    if (!user) return;
    if (!profileCpf || !profilePhone) { toast.error('Preencha CPF e telefone abaixo primeiro'); return; }
    setCertifying(true);
    await supabase.from('profiles').update({ cpf: profileCpf, phone: profilePhone }).eq('id', user.id);
    const { error } = await supabase.from('certificados').insert({ user_id: user.id, status: 'pendente' });
    if (error) toast.error('Erro ao solicitar'); else { toast.success('Solicitação enviada para análise'); setCert('pending'); }
    setCertifying(false);
  };

  const save = async () => {
    if (!user || !seller) return;
    setSaving(true);
    const [{ error }, { error: pErr }] = await Promise.all([
      supabase.from('seller_profiles').update({
        display_name: displayName.trim(), bio: bio.trim() || null,
        avatar_url: avatarUrl || null, is_private: isPrivate,
        vacation_mode: vacationMode,
        vacation_message: vacationMessage.trim() || null,
      } as any).eq('user_id', user.id),
      supabase.from('profiles').update({
        seller_bio: sellerBio.trim() || null,
        cpf: profileCpf || null, phone: profilePhone || null,
      } as any).eq('id', user.id),
    ]);
    setSaving(false);
    if (error || pErr) return toast.error('Erro ao salvar');
    toast.success('Perfil $vendedor atualizado');
  };

  if (!user) return <div className="p-6 text-center text-muted-foreground">Entre para gerenciar seu perfil $vendedor.</div>;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  // Onboarding — usuário não tem perfil $vendedor
  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/perfil" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4"><ArrowLeft className="h-4 w-4" /> Perfil</Link>
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent/15 flex items-center justify-center">
            <Store className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold">Vire um $vendedor</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Para vender no marketplace você precisa de um <b>perfil $vendedor</b> separado do seu @usuario.
            Isso permite usar um nome de loja diferente, ter bio comercial e métricas próprias de reputação.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            {[
              { i: '🛒', t: '$handle único', d: 'Ex: $sualoja, separado do seu @user pessoal.' },
              { i: '🛡️', t: 'Reputação isolada', d: 'Avaliações de comprador não afetam @user.' },
              { i: '💬', t: 'Conversas próprias', d: 'Chat de marketplace separado do chat social.' },
            ].map(b => (
              <div key={b.t} className="p-3 rounded-lg bg-secondary/40">
                <p className="text-xl mb-1">{b.i}</p>
                <p className="text-sm font-semibold">{b.t}</p>
                <p className="text-[11px] text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/vendedor/criar')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold">
            <Plus className="h-4 w-4" /> Criar meu $vendedor
          </button>
          <p className="text-[11px] text-muted-foreground">Você pode desativá-lo a qualquer momento sem perder seu @user.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <Link to="/perfil" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Perfil</Link>

      <header className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center overflow-hidden">
          {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <Store className="h-7 w-7 text-accent" />}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">Config $vendedor</h1>
          <p className="text-sm text-muted-foreground">
            <Link to={`/vendedor/${seller.handle}`} className="text-accent hover:underline">${seller.handle}</Link> · {activeAds} anúncio(s) ativo(s)
          </p>
        </div>
        <Link to={`/vendedor/${seller.handle}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-xs font-semibold">
          <ExternalLink className="h-3 w-3" /> Ver pública
        </Link>
      </header>

      {/* Status */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-[10px] uppercase text-muted-foreground">Anúncios ativos</p>
          <p className="text-2xl font-bold mt-1">{activeAds}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-[10px] uppercase text-muted-foreground">Certificado</p>
          <p className="text-sm font-semibold mt-2 flex items-center gap-1.5">
            {cert === 'active' ? <><ShieldCheck className="h-4 w-4 text-success" /> Ativo</>
              : cert === 'pending' ? <span className="text-warning">⏳ Em análise</span>
              : <span className="text-muted-foreground">— Sem certificado</span>}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-[10px] uppercase text-muted-foreground">Visibilidade</p>
          <p className="text-sm font-semibold mt-2 flex items-center gap-1.5">
            {isPrivate ? <><EyeOff className="h-4 w-4" /> Privado</> : <><Eye className="h-4 w-4" /> Público</>}
          </p>
        </div>
      </section>

      {/* Edição */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-bold">Dados do $vendedor</h2>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">$handle</label>
          <p className="mt-1 text-sm font-mono">${seller.handle} <span className="text-muted-foreground text-xs">(não editável)</span></p>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Nome de exibição</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={60}
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Bio comercial</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={500}
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Bio de vendedor (exibida no modo Vendedor)</label>
          <textarea value={sellerBio} onChange={e => setSellerBio(e.target.value)} rows={3} maxLength={500}
            placeholder="Descreva sua loja, formas de troca, garantias etc."
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
        </div>
        <label className="flex items-center justify-between p-3 bg-muted/40 rounded-lg cursor-pointer">
          <span className="text-sm">Perfil $vendedor privado <span className="text-[11px] text-muted-foreground">(quem chega via anúncio ainda vê)</span></span>
          <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="h-4 w-4 accent-accent" />
        </label>
      </section>

      {/* Certificação — junto com a loja */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Vendedor protegido (certificação)</h2>
        <p className="text-xs text-muted-foreground">
          Anúncios "protegidos pela loja" exigem verificação de identidade. Sem certificação você ainda pode anunciar, mas a loja não responde por reembolsos.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">CPF</label>
            <input value={profileCpf} onChange={e => setProfileCpf(e.target.value)} maxLength={14}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Telefone</label>
            <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} maxLength={20}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" />
          </div>
        </div>
        {cert === 'active' ? (
          <div className="flex items-center gap-2 text-success text-sm font-semibold"><ShieldCheck className="h-4 w-4" /> Você é vendedor verificado</div>
        ) : cert === 'pending' ? (
          <div className="text-sm text-warning">⏳ Solicitação em análise pelos moderadores</div>
        ) : (
          <button onClick={requestCert} disabled={certifying}
            className="w-full py-2.5 rounded-lg bg-success text-white text-sm font-semibold disabled:opacity-50">
            {certifying ? 'Enviando...' : 'Solicitar certificação'}
          </button>
        )}

        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar tudo
        </button>
      </section>

      <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-bold">Atalhos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Link to="/vendedor/editar" className="p-3 rounded-lg bg-secondary text-sm font-semibold text-center">Editar avatar/handle</Link>
          <Link to="/m/marketplace/novo" className="p-3 rounded-lg bg-secondary text-sm font-semibold text-center">+ Novo anúncio</Link>
          <Link to={`/vendedor/${seller.handle}`} className="p-3 rounded-lg bg-secondary text-sm font-semibold text-center">Minha página pública</Link>
        </div>
      </section>
    </div>
  );
}

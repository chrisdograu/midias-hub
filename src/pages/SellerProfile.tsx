import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Store, Star, ShoppingBag, Repeat, Calendar, MessageCircle, UserPlus, Ban, Flag, Edit, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import SellerProfileSwitcher from '@/components/seller/SellerProfileSwitcher';

type Seller = {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_private: boolean;
  rating: number;
  total_sales: number;
  total_trades: number;
  first_listing_at: string | null;
  created_at: string;
  vacation_mode?: boolean | null;
  vacation_message?: string | null;
};

export default function SellerProfile() {
  const { handle } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [personal, setPersonal] = useState<{ display_name: string | null } | null>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [arrivedViaAd, setArrivedViaAd] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!handle) return;
    (async () => {
      setLoading(true);
      const { data: s } = await supabase
        .from('seller_profiles')
        .select('*')
        .ilike('handle', handle)
        .maybeSingle();
      if (!s) { setLoading(false); return; }
      const sellerData = s as Seller;
      setSeller(sellerData);

      // Bloqueio (scope=seller) — sempre prevalece
      if (user) {
        const { data: blk } = await supabase
          .from('blocked_users')
          .select('id')
          .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${sellerData.user_id}),and(blocker_id.eq.${sellerData.user_id},blocked_id.eq.${user.id})`)
          .eq('scope', 'seller')
          .maybeSingle();
        if (blk) { setBlocked(true); setLoading(false); return; }
      }

      // Anúncios do vendedor
      const { data: a } = await supabase
        .from('anuncios')
        .select('id, title, price, status, created_at, fotos_anuncio(image_url, position)')
        .eq('seller_id', sellerData.user_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(24);
      setAds((a || []) as any);
      setArrivedViaAd((a || []).length > 0);

      // Nome pessoal só para switcher
      const { data: prof } = await supabase.from('profiles').select('display_name').eq('id', sellerData.user_id).maybeSingle();
      setPersonal(prof as any);

      setLoading(false);
    })();
  }, [handle, user?.id]);

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>;
  }
  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Perfil vendedor não encontrado.</p>
        <Link to="/" className="text-primary hover:underline text-sm">Voltar ao início</Link>
      </div>
    );
  }

  const isOwn = user?.id === seller.user_id;
  const showPrivateView = seller.is_private && !arrivedViaAd && !isOwn;
  const monthLabel = seller.first_listing_at
    ? new Date(seller.first_listing_at).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    : null;

  if (blocked) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Ban className="h-12 w-12 text-destructive mx-auto mb-3" />
        <p className="text-foreground font-semibold">Perfil indisponível</p>
        <p className="text-sm text-muted-foreground">Há um bloqueio ativo entre vocês.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <SellerProfileSwitcher
        userId={seller.user_id}
        personalHandle={personal?.display_name}
        sellerHandle={seller.handle}
        hasSeller={true}
        isOwn={isOwn}
      />

      {/* Cabeçalho marketplace-style */}
      <motion.section
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 mb-5"
      >
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-24 h-24 rounded-xl bg-accent/15 border-2 border-accent/30 overflow-hidden flex items-center justify-center shrink-0">
            {seller.avatar_url
              ? <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
              : <Store className="h-10 w-10 text-accent" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-accent font-bold text-xl">$</span>
              <h1 className="text-2xl font-display font-bold truncate">{seller.display_name}</h1>
              {seller.is_private && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wide bg-muted text-muted-foreground px-2 py-0.5 rounded">
                  <Lock className="h-3 w-3" /> privado
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">${seller.handle}</p>
            {seller.bio && !showPrivateView && (
              <p className="text-sm text-foreground mt-2 line-clamp-3">{seller.bio}</p>
            )}

            {/* Metas */}
            {!showPrivateView && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <Metric icon={Star} label="Avaliação" value={Number(seller.rating).toFixed(1)} accent />
                <Metric icon={ShoppingBag} label="Vendas" value={String(seller.total_sales)} />
                <Metric icon={Repeat} label="Trocas" value={String(seller.total_trades)} />
                {monthLabel && <Metric icon={Calendar} label="Vende desde" value={monthLabel} />}
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[160px]">
            {isOwn ? (
              <Link to="/vendedor/editar" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90">
                <Edit className="h-4 w-4" /> Editar
              </Link>
            ) : user ? (
              <>
                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90">
                  <MessageCircle className="h-4 w-4" /> Mensagem
                </button>
                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">
                  <UserPlus className="h-4 w-4" /> Seguir
                </button>
                <div className="flex gap-2">
                  <button className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40">
                    <Ban className="h-3.5 w-3.5" /> Bloquear
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">
                    <Flag className="h-3.5 w-3.5" /> Denunciar
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => navigate('/auth')} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold">
                Entrar para interagir
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {showPrivateView ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold">Este perfil de vendedor é privado</p>
          <p className="text-sm text-muted-foreground mt-1">Você só consegue ver o $vendedor ao acessá-lo por um anúncio publicado.</p>
        </div>
      ) : (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-accent" /> Anúncios ativos ({ads.length})
          </h2>
          {ads.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
              Nenhum anúncio ativo no momento.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {ads.map(a => {
                const photo = (a.fotos_anuncio || []).sort((x: any, y: any) => x.position - y.position)[0];
                return (
                  <Link key={a.id} to={`/m/marketplace/${a.id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:border-accent/40 transition-colors">
                    <div className="aspect-square bg-muted">
                      {photo ? <img src={photo.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground" /></div>}
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-medium line-clamp-1">{a.title}</p>
                      <p className="text-base font-bold text-accent mt-0.5">R$ {Number(a.price).toFixed(2)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-muted/40 rounded-lg p-2.5">
      <div className={`flex items-center gap-1 text-[11px] uppercase tracking-wide ${accent ? 'text-accent' : 'text-muted-foreground'}`}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="text-base font-bold text-foreground mt-0.5 truncate capitalize">{value}</p>
    </div>
  );
}

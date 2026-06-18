import { lazy } from "react";
import { Route, useLocation, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

const Catalogo = lazy(() => import("@/pages/Catalogo"));
const Ofertas = lazy(() => import("@/pages/Ofertas"));
const GameDetail = lazy(() => import("@/pages/GameDetail"));
const Carrinho = lazy(() => import("@/pages/Carrinho"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Auth = lazy(() => import("@/pages/Auth"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Pedidos = lazy(() => import("@/pages/Pedidos"));
const Favoritos = lazy(() => import("@/pages/Favoritos"));
const Perfil = lazy(() => import("@/pages/Perfil"));
const TimelineGamer = lazy(() => import("@/pages/TimelineGamer"));
const Biblioteca = lazy(() => import("@/pages/Biblioteca"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Contato = lazy(() => import("@/pages/Contato"));
const TermosDeUso = lazy(() => import("@/pages/TermosDeUso"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const CheckoutSucesso = lazy(() => import("@/pages/CheckoutSucesso"));
const EmAlta = lazy(() => import("@/pages/EmAlta"));
const ParaVoce = lazy(() => import("@/pages/ParaVoce"));
const Social = lazy(() => import("@/pages/SocialLibrary"));
const Torneios = lazy(() => import("@/pages/Torneios"));
const TournamentEvent = lazy(() => import("@/pages/torneios/TournamentEvent"));
const TournamentMatch = lazy(() => import("@/pages/torneios/TournamentMatch"));
const TournamentGroup = lazy(() => import("@/pages/torneios/TournamentGroup"));
const BundleDetail = lazy(() => import("@/pages/BundleDetail"));
const BibliotecaJogo = lazy(() => import("@/pages/BibliotecaJogo"));
const GameSocialHub = lazy(() => import("@/pages/GameSocialHub"));
const ReviewCompletaEditor = lazy(() => import("@/pages/ReviewCompletaEditor"));
const FriendProfile = lazy(() => import("@/pages/FriendProfile"));
const SellerProfile = lazy(() => import("@/pages/SellerProfile"));
const CriarVendedor = lazy(() => import("@/pages/CriarVendedor"));
const BuscaGlobal = lazy(() => import("@/pages/BuscaGlobal"));
const OpinionsConversations = lazy(() => import("@/pages/OpinionsConversations"));
const OpinionConversation = lazy(() => import("@/pages/OpinionConversation"));
const Tutoriais = lazy(() => import("@/pages/Tutoriais"));
const Tutorial = lazy(() => import("@/pages/Tutorial"));
const PrivacidadeCentral = lazy(() => import("@/pages/PrivacidadeCentral"));
const VendedorConfig = lazy(() => import("@/pages/VendedorConfig"));

const shell = (el: React.ReactNode) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">{el}</main>
    <Footer />
  </div>
);

const entries: { path: string; el: React.ReactNode }[] = [
  { path: '/', el: <Index /> },
  { path: '/catalogo', el: <Catalogo /> },
  { path: '/ofertas', el: <Ofertas /> },
  { path: '/em-alta', el: <EmAlta /> },
  { path: '/pra-voce', el: <ParaVoce /> },
  { path: '/social', el: <Social /> },
  { path: '/torneios', el: <Torneios /> },
  { path: '/torneios/:id', el: <TournamentEvent /> },
  { path: '/torneios/:id/partida/:matchId', el: <TournamentMatch /> },
  { path: '/torneios/:id/grupo', el: <ProtectedRoute><TournamentGroup /></ProtectedRoute> },
  { path: '/jogo/:id', el: <GameDetail /> },
  { path: '/jogo/:id/social', el: <ProtectedRoute><GameSocialHub /></ProtectedRoute> },
  { path: '/jogo/:id/review-completa', el: <ProtectedRoute><ReviewCompletaEditor /></ProtectedRoute> },
  { path: '/jogo/:productId/review-completa', el: <ProtectedRoute><ReviewCompletaEditor /></ProtectedRoute> },
  { path: '/busca', el: <BuscaGlobal /> },
  { path: '/conversas-opinioes', el: <ProtectedRoute><OpinionsConversations /></ProtectedRoute> },
  { path: '/perfil/:userId/jogo/:productId/opniao/:opinionId/conversa/:convId', el: <ProtectedRoute><OpinionConversation /></ProtectedRoute> },
  { path: '/amigo/:userId', el: <ProtectedRoute><FriendProfile /></ProtectedRoute> },
  { path: '/bundle/:id', el: <BundleDetail /> },
  { path: '/biblioteca/:productId', el: <ProtectedRoute><BibliotecaJogo /></ProtectedRoute> },
  { path: '/carrinho', el: <Carrinho /> },
  { path: '/checkout', el: <ProtectedRoute><Checkout /></ProtectedRoute> },
  { path: '/checkout/sucesso', el: <ProtectedRoute><CheckoutSucesso /></ProtectedRoute> },
  { path: '/auth', el: <Auth /> },
  { path: '/reset-password', el: <ResetPassword /> },
  { path: '/pedidos', el: <ProtectedRoute><Pedidos /></ProtectedRoute> },
  { path: '/favoritos', el: <ProtectedRoute><Favoritos /></ProtectedRoute> },
  { path: '/perfil', el: <ProtectedRoute><Perfil /></ProtectedRoute> },
  { path: '/perfil/timeline', el: <ProtectedRoute><TimelineGamer /></ProtectedRoute> },
  { path: '/perfil/:userId', el: <PublicProfile /> },
  { path: '/profile/:userId', el: <PublicProfile /> },
  { path: '/vendedor/criar', el: <ProtectedRoute><CriarVendedor mode="create" /></ProtectedRoute> },
  { path: '/vendedor/editar', el: <ProtectedRoute><CriarVendedor mode="edit" /></ProtectedRoute> },
  { path: '/vendedor/:handle', el: <SellerProfile /> },
  { path: '/biblioteca', el: <ProtectedRoute><Biblioteca /></ProtectedRoute> },
  { path: '/faq', el: <FAQ /> },
  { path: '/contato', el: <Contato /> },
  { path: '/termos', el: <TermosDeUso /> },
  { path: '/tutoriais', el: <Tutoriais /> },
  { path: '/tutorial/:key', el: <Tutorial /> },
  { path: '/privacidade', el: <ProtectedRoute><PrivacidadeCentral /></ProtectedRoute> },
  { path: '/vendedor', el: <ProtectedRoute><VendedorConfig /></ProtectedRoute> },
];

function GlobalCatchAll() {
  const location = useLocation();
  if (location.pathname.startsWith('/m')) return <Navigate to="/m" replace />;
  return shell(<NotFound />);
}

export const webRoutes = (
  <>
    {entries.map(r => (
      <Route key={r.path} path={r.path} element={shell(r.el)} />
    ))}
    <Route path="*" element={<GlobalCatchAll />} />
  </>
);

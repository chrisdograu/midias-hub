import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cartStore";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import MobileLayout from "./mobile/MobileLayout";
import MAuth from "./mobile/pages/MAuth";
import MHome from "./mobile/pages/MHome";
import MMarketplace from "./mobile/pages/MMarketplace";
import MMarketplaceItem from "./mobile/pages/MMarketplaceItem";
import MNewAd from "./mobile/pages/MNewAd";
import MForum from "./mobile/pages/MForum";
import MForumGame from "./mobile/pages/MForumGame";
import MForumPost from "./mobile/pages/MForumPost";
import MChat from "./mobile/pages/MChat";
import MChatThread from "./mobile/pages/MChatThread";
import MProfile from "./mobile/pages/MProfile";
import MConfig from "./mobile/pages/MConfig";
import MBlockedUsers from "./mobile/pages/MBlockedUsers";
import MReview from "./mobile/pages/MReview";
import MFavoritos from "./mobile/pages/MFavoritos";
import MFriends from "./mobile/pages/MFriends";
import MGroups from "./mobile/pages/MGroups";
import MGroupNew from "./mobile/pages/MGroupNew";
import MGroupChat from "./mobile/pages/MGroupChat";
import MGroupInfo from "./mobile/pages/MGroupInfo";
import MChatInfo from "./mobile/pages/MChatInfo";
import MTournamentGroup from "./mobile/pages/MTournamentGroup";
import MTutoriais from "./mobile/pages/MTutoriais";
import MTutorial from "./mobile/pages/MTutorial";
import MForumComunidade from "./mobile/pages/MForumComunidade";

import MNotFound from "./mobile/pages/MNotFound";
import NotFound from "./pages/NotFound";

// Web pages — lazy
const Catalogo = lazy(() => import("./pages/Catalogo"));
const Ofertas = lazy(() => import("./pages/Ofertas"));
const GameDetail = lazy(() => import("./pages/GameDetail"));
const Carrinho = lazy(() => import("./pages/Carrinho"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
const Favoritos = lazy(() => import("./pages/Favoritos"));
const Perfil = lazy(() => import("./pages/Perfil"));
const TimelineGamer = lazy(() => import("./pages/TimelineGamer"));
const Biblioteca = lazy(() => import("./pages/Biblioteca"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contato = lazy(() => import("./pages/Contato"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const CheckoutSucesso = lazy(() => import("./pages/CheckoutSucesso"));

// Desktop Backoffice — lazy
import { DesktopAuthProvider } from "./hooks/useDesktopAuth";
const DesktopLayout = lazy(() => import("./desktop/DesktopLayout"));
const DesktopLogin = lazy(() => import("./desktop/DesktopLogin"));
const Dashboard = lazy(() => import("./desktop/pages/Dashboard"));
const DesktopProdutos = lazy(() => import("./desktop/pages/Produtos"));
const Funcionarios = lazy(() => import("./desktop/pages/Funcionarios"));
const Clientes = lazy(() => import("./desktop/pages/Clientes"));
const Fornecedores = lazy(() => import("./desktop/pages/Fornecedores"));
const Categorias = lazy(() => import("./desktop/pages/Categorias"));
const Cupons = lazy(() => import("./desktop/pages/Cupons"));
const Estoque = lazy(() => import("./desktop/pages/Estoque"));
const PedidosOnline = lazy(() => import("./desktop/pages/PedidosOnline"));
const Moderacao = lazy(() => import("./desktop/pages/Moderacao"));
const Relatorios = lazy(() => import("./desktop/pages/Relatorios"));
const Certificados = lazy(() => import("./desktop/pages/Certificados"));
const AnunciosAdmin = lazy(() => import("./desktop/pages/AnunciosAdmin"));
const PropostasTroca = lazy(() => import("./desktop/pages/PropostasTroca"));
const MensagensAdmin = lazy(() => import("./desktop/pages/MensagensAdmin"));
const AvaliacoesUsuario = lazy(() => import("./desktop/pages/AvaliacoesUsuario"));
const NotificacoesAdmin = lazy(() => import("./desktop/pages/NotificacoesAdmin"));
const ForumAdmin = lazy(() => import("./desktop/pages/ForumAdmin"));
const SugestoesJogos = lazy(() => import("./desktop/pages/SugestoesJogos"));
const Configuracoes = lazy(() => import("./desktop/pages/Configuracoes"));
const BadgesAdmin = lazy(() => import("./desktop/pages/Badges"));
const Promocoes = lazy(() => import("./desktop/pages/Promocoes"));
const TorneiosAdmin = lazy(() => import("./desktop/pages/Torneios"));
const JogosAdmin = lazy(() => import("./desktop/pages/JogosAdmin"));
const CriarJogo = lazy(() => import("./desktop/pages/CriarJogo"));
const BundlesAdmin = lazy(() => import("./desktop/pages/BundlesAdmin"));
const TrocasArquivadas = lazy(() => import("./desktop/pages/TrocasArquivadas"));
const BibliotecaSocialAdmin = lazy(() => import("./desktop/pages/BibliotecaSocialAdmin"));
const TorneiosEventos = lazy(() => import("./desktop/pages/TorneiosEventos"));
const TorneiosAtuais = lazy(() => import("./desktop/pages/TorneiosAtuais"));
const CriarTorneio = lazy(() => import("./desktop/pages/CriarTorneio"));
const TicketsMobile = lazy(() => import("./desktop/pages/TicketsMobile"));
const TicketsWeb = lazy(() => import("./desktop/pages/TicketsWeb"));
const Denuncias = lazy(() => import("./desktop/pages/Denuncias"));
const NotificacoesEspeciais = lazy(() => import("./desktop/pages/NotificacoesEspeciais"));
const LogsAdministrativos = lazy(() => import("./desktop/pages/LogsAdministrativos"));
const Analytics = lazy(() => import("./desktop/pages/Analytics"));
const XPMobile = lazy(() => import("./desktop/pages/XPMobile"));
const XPWeb = lazy(() => import("./desktop/pages/XPWeb"));
const TitulosAdmin = lazy(() => import("./desktop/pages/TitulosAdmin"));
const RecompensasAdmin = lazy(() => import("./desktop/pages/RecompensasAdmin"));
const IntegracoesAdmin = lazy(() => import("./desktop/pages/IntegracoesAdmin"));
const EmAlta = lazy(() => import("./pages/EmAlta"));
const ParaVoce = lazy(() => import("./pages/ParaVoce"));
const Social = lazy(() => import("./pages/SocialLibrary"));
const Torneios = lazy(() => import("./pages/Torneios"));
const TournamentEvent = lazy(() => import("./pages/torneios/TournamentEvent"));
const TournamentMatch = lazy(() => import("./pages/torneios/TournamentMatch"));
const TournamentGroup = lazy(() => import("./pages/torneios/TournamentGroup"));
const BundleDetail = lazy(() => import("./pages/BundleDetail"));
const BibliotecaJogo = lazy(() => import("./pages/BibliotecaJogo"));
const GameSocialHub = lazy(() => import("./pages/GameSocialHub"));
const ReviewCompletaEditor = lazy(() => import("./pages/ReviewCompletaEditor"));
const FriendProfile = lazy(() => import("./pages/FriendProfile"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const CriarVendedor = lazy(() => import("./pages/CriarVendedor"));
const BuscaGlobal = lazy(() => import("./pages/BuscaGlobal"));
const OpinionsConversations = lazy(() => import("./pages/OpinionsConversations"));
const OpinionConversation = lazy(() => import("./pages/OpinionConversation"));
const Tutoriais = lazy(() => import("./pages/Tutoriais"));
const Tutorial = lazy(() => import("./pages/Tutorial"));
const PrivacidadeCentral = lazy(() => import("./pages/PrivacidadeCentral"));

const VendedorConfig = lazy(() => import("./pages/VendedorConfig"));
import { TutorialProvider } from "@/components/tutorial/TutorialContext";

const PageFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <AuthProvider>
        <TutorialProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Mobile Routes */}
              <Route path="/m/auth" element={<MAuth />} />
              <Route path="/m" element={<MobileLayout><MHome /></MobileLayout>} />
              <Route path="/m/marketplace" element={<MobileLayout><MMarketplace /></MobileLayout>} />
              <Route path="/m/marketplace/novo" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MNewAd /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/marketplace/:id" element={<MobileLayout><MMarketplaceItem /></MobileLayout>} />
              <Route path="/m/forum" element={<MobileLayout><MForum /></MobileLayout>} />
              <Route path="/m/forum/:gameId" element={<MobileLayout><MForumGame /></MobileLayout>} />
              <Route path="/m/forum/jogo/:gameId" element={<MobileLayout><MForumGame /></MobileLayout>} />
              <Route path="/m/forum/post/:postId" element={<MobileLayout><MForumPost /></MobileLayout>} />
              <Route path="/m/review/:productId" element={<MobileLayout><MReview /></MobileLayout>} />
              <Route path="/m/chat" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MChat /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/chat/:conversationId" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MChatThread /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/chat/:conversationId/info" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MChatInfo /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/grupos" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MGroups /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/grupos/novo" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MGroupNew /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/grupos/:id" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MGroupChat /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/grupos/:id/info" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MGroupInfo /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/torneios/:id/grupo" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MTournamentGroup /></ProtectedRoute></MobileLayout>} />

              <Route path="/m/perfil" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MProfile /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/perfil/:userId" element={<MobileLayout><MProfile /></MobileLayout>} />
              <Route path="/m/config" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MConfig /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/config/bloqueados" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MBlockedUsers /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/favoritos" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MFavoritos /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/amigos" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MFriends /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/friends" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MFriends /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/tutoriais" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MTutoriais /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/tutorial/:key" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MTutorial /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/forum-comunidade" element={<MobileLayout><MForumComunidade /></MobileLayout>} />
              <Route path="/m/forum-comunidade/:slug" element={<MobileLayout><MForumComunidade /></MobileLayout>} />
              <Route path="/m/vendedor" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><VendedorConfig /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/*" element={<MobileLayout><MNotFound /></MobileLayout>} />

              {/* Desktop Backoffice Routes */}
              <Route path="/desktop/login" element={<DesktopAuthProvider><DesktopLogin /></DesktopAuthProvider>} />
              <Route path="/desktop" element={<DesktopAuthProvider><DesktopLayout /></DesktopAuthProvider>}>
                <Route index element={<Dashboard />} />
                <Route path="produtos" element={<DesktopProdutos />} />
                <Route path="funcionarios" element={<Funcionarios />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="fornecedores" element={<Fornecedores />} />
                <Route path="categorias" element={<Categorias />} />
                <Route path="cupons" element={<Cupons />} />
                <Route path="estoque" element={<Estoque />} />
                <Route path="pedidos" element={<PedidosOnline />} />
                <Route path="anuncios" element={<AnunciosAdmin />} />
                <Route path="propostas" element={<PropostasTroca />} />
                <Route path="mensagens" element={<MensagensAdmin />} />
                <Route path="avaliacoes-usuario" element={<AvaliacoesUsuario />} />
                <Route path="notificacoes" element={<NotificacoesAdmin />} />
                <Route path="forum" element={<ForumAdmin />} />
                <Route path="sugestoes" element={<SugestoesJogos />} />
                <Route path="moderacao" element={<Moderacao />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="certificados" element={<Certificados />} />
                <Route path="configuracoes" element={<Configuracoes />} />
                <Route path="badges" element={<BadgesAdmin />} />
                <Route path="promocoes" element={<Promocoes />} />
                <Route path="torneios" element={<TorneiosAdmin />} />
                <Route path="torneios/atuais" element={<TorneiosAtuais />} />
                <Route path="torneios/eventos" element={<TorneiosEventos />} />
                <Route path="torneios/novo" element={<CriarTorneio />} />
                <Route path="jogos" element={<JogosAdmin />} />
                <Route path="jogos/novo" element={<CriarJogo />} />
                <Route path="bundles" element={<BundlesAdmin />} />
                <Route path="trocas-arquivadas" element={<TrocasArquivadas />} />
                <Route path="biblioteca-social" element={<BibliotecaSocialAdmin />} />
                <Route path="tickets/mobile" element={<TicketsMobile />} />
                <Route path="tickets/web" element={<TicketsWeb />} />
                <Route path="denuncias" element={<Denuncias />} />
                <Route path="notificacoes/especiais" element={<NotificacoesEspeciais />} />
                <Route path="logs" element={<LogsAdministrativos />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="xp/mobile" element={<XPMobile />} />
                <Route path="xp/web" element={<XPWeb />} />
                <Route path="titulos" element={<TitulosAdmin />} />
                <Route path="recompensas" element={<RecompensasAdmin />} />
                <Route path="integracoes" element={<IntegracoesAdmin />} />
              </Route>

              {/* Web E-commerce Routes */}
              {([
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
              ] as const).map(r => (
                <Route key={r.path} path={r.path} element={
                  <div className="min-h-screen flex flex-col">
                    <Header />
                    <main className="flex-1">{r.el}</main>
                    <Footer />
                  </div>
                } />
              ))}
              <Route path="*" element={<GlobalCatchAll />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
        </TutorialProvider>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

function GlobalCatchAll() {
  const location = useLocation();
  // Se o path está sob /m, sempre manda pra home mobile (evita 404 confuso)
  if (location.pathname.startsWith('/m')) {
    return <Navigate to="/m" replace />;
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1"><NotFound /></main>
      <Footer />
    </div>
  );
}

export default App;

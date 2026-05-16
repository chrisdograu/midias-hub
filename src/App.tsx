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
import MReview from "./mobile/pages/MReview";
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
const EmAlta = lazy(() => import("./pages/EmAlta"));
const ParaVoce = lazy(() => import("./pages/ParaVoce"));
const Social = lazy(() => import("./pages/Social"));
const Torneios = lazy(() => import("./pages/Torneios"));
const BundleDetail = lazy(() => import("./pages/BundleDetail"));
const BibliotecaJogo = lazy(() => import("./pages/BibliotecaJogo"));

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
              <Route path="/m/forum/post/:postId" element={<MobileLayout><MForumPost /></MobileLayout>} />
              <Route path="/m/review/:productId" element={<MobileLayout><MReview /></MobileLayout>} />
              <Route path="/m/chat" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MChat /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/chat/:conversationId" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MChatThread /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/perfil" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MProfile /></ProtectedRoute></MobileLayout>} />
              <Route path="/m/perfil/:userId" element={<MobileLayout><MProfile /></MobileLayout>} />
              <Route path="/m/config" element={<MobileLayout><ProtectedRoute redirectTo="/m/auth"><MConfig /></ProtectedRoute></MobileLayout>} />
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
                { path: '/jogo/:id', el: <GameDetail /> },
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
                { path: '/perfil/:userId', el: <PublicProfile /> },
                { path: '/biblioteca', el: <ProtectedRoute><Biblioteca /></ProtectedRoute> },
                { path: '/faq', el: <FAQ /> },
                { path: '/contato', el: <Contato /> },
                { path: '/termos', el: <TermosDeUso /> },
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

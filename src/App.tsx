import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
const NotFound = lazy(() => import("./pages/NotFound"));

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
const Configuracoes = lazy(() => import("./desktop/pages/Configuracoes"));

// Mobile PWA — lazy
const MobileLayout = lazy(() => import("./mobile/MobileLayout"));
const MAuth = lazy(() => import("./mobile/pages/MAuth"));
const MHome = lazy(() => import("./mobile/pages/MHome"));
const MMarketplace = lazy(() => import("./mobile/pages/MMarketplace"));
const MMarketplaceItem = lazy(() => import("./mobile/pages/MMarketplaceItem"));
const MNewAd = lazy(() => import("./mobile/pages/MNewAd"));
const MForum = lazy(() => import("./mobile/pages/MForum"));
const MForumGame = lazy(() => import("./mobile/pages/MForumGame"));
const MForumPost = lazy(() => import("./mobile/pages/MForumPost"));
const MChat = lazy(() => import("./mobile/pages/MChat"));
const MChatThread = lazy(() => import("./mobile/pages/MChatThread"));
const MProfile = lazy(() => import("./mobile/pages/MProfile"));
const MConfig = lazy(() => import("./mobile/pages/MConfig"));
const MReview = lazy(() => import("./mobile/pages/MReview"));
const MNotFound = lazy(() => import("./mobile/pages/MNotFound"));

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
              {/* Mobile PWA Routes */}
              <Route path="/m/auth" element={<MAuth />} />
              <Route path="/m" element={<MobileLayout />}>
                <Route index element={<MHome />} />
                <Route path="marketplace" element={<MMarketplace />} />
                <Route path="marketplace/novo" element={<ProtectedRoute><MNewAd /></ProtectedRoute>} />
                <Route path="marketplace/:id" element={<MMarketplaceItem />} />
                <Route path="forum" element={<MForum />} />
                <Route path="forum/:gameId" element={<MForumGame />} />
                <Route path="forum/post/:postId" element={<MForumPost />} />
                <Route path="review/:productId" element={<MReview />} />
                <Route path="chat" element={<ProtectedRoute><MChat /></ProtectedRoute>} />
                <Route path="chat/:conversationId" element={<ProtectedRoute><MChatThread /></ProtectedRoute>} />
                <Route path="perfil" element={<ProtectedRoute><MProfile /></ProtectedRoute>} />
                <Route path="perfil/:userId" element={<MProfile />} />
                <Route path="config" element={<ProtectedRoute><MConfig /></ProtectedRoute>} />
                <Route path="*" element={<MNotFound />} />
              </Route>

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
                <Route path="moderacao" element={<Moderacao />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="certificados" element={<Certificados />} />
                <Route path="configuracoes" element={<Configuracoes />} />
              </Route>

              {/* Web E-commerce Routes */}
              {([
                { path: '/', el: <Index /> },
                { path: '/catalogo', el: <Catalogo /> },
                { path: '/ofertas', el: <Ofertas /> },
                { path: '/jogo/:id', el: <GameDetail /> },
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
              <Route path="*" element={
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-1"><NotFound /></main>
                  <Footer />
                </div>
              } />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

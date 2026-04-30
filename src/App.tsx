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
import Index from "./pages/Index";
import Catalogo from "./pages/Catalogo";
import Ofertas from "./pages/Ofertas";
import GameDetail from "./pages/GameDetail";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Pedidos from "./pages/Pedidos";
import Favoritos from "./pages/Favoritos";
import Perfil from "./pages/Perfil";
import Biblioteca from "./pages/Biblioteca";
import FAQ from "./pages/FAQ";
import Contato from "./pages/Contato";
import TermosDeUso from "./pages/TermosDeUso";
import PublicProfile from "./pages/PublicProfile";
import CheckoutSucesso from "./pages/CheckoutSucesso";
import NotFound from "./pages/NotFound";

// Desktop Backoffice
import { DesktopAuthProvider } from "./hooks/useDesktopAuth";
import DesktopLayout from "./desktop/DesktopLayout";
import DesktopLogin from "./desktop/DesktopLogin";
import Dashboard from "./desktop/pages/Dashboard";
import DesktopProdutos from "./desktop/pages/Produtos";
import Funcionarios from "./desktop/pages/Funcionarios";
import Clientes from "./desktop/pages/Clientes";
import Fornecedores from "./desktop/pages/Fornecedores";
import Categorias from "./desktop/pages/Categorias";
import Cupons from "./desktop/pages/Cupons";

import Estoque from "./desktop/pages/Estoque";
import PedidosOnline from "./desktop/pages/PedidosOnline";
import Moderacao from "./desktop/pages/Moderacao";
import Relatorios from "./desktop/pages/Relatorios";
import Certificados from "./desktop/pages/Certificados";
import AnunciosAdmin from "./desktop/pages/AnunciosAdmin";
import PropostasTroca from "./desktop/pages/PropostasTroca";
import MensagensAdmin from "./desktop/pages/MensagensAdmin";
import AvaliacoesUsuario from "./desktop/pages/AvaliacoesUsuario";
import NotificacoesAdmin from "./desktop/pages/NotificacoesAdmin";
import ForumAdmin from "./desktop/pages/ForumAdmin";
import Configuracoes from "./desktop/pages/Configuracoes";

// Mobile PWA
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

              {/* Web E-commerce Routes - explicit list to avoid wildcard collision with /m and /desktop */}
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
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

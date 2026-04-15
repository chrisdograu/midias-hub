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
              <Route path="/" element={
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-1"><Index /></main>
                  <Footer />
                </div>
              } />
              <Route path="/*" element={
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/catalogo" element={<Catalogo />} />
                      <Route path="/ofertas" element={<Ofertas />} />
                      <Route path="/jogo/:id" element={<GameDetail />} />
                      <Route path="/carrinho" element={<Carrinho />} />
                      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                      <Route path="/checkout/sucesso" element={<ProtectedRoute><CheckoutSucesso /></ProtectedRoute>} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/pedidos" element={<ProtectedRoute><Pedidos /></ProtectedRoute>} />
                      <Route path="/favoritos" element={<ProtectedRoute><Favoritos /></ProtectedRoute>} />
                      <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                      <Route path="/perfil/:userId" element={<PublicProfile />} />
                      <Route path="/biblioteca" element={<ProtectedRoute><Biblioteca /></ProtectedRoute>} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/contato" element={<Contato />} />
                      <Route path="/termos" element={<TermosDeUso />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
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

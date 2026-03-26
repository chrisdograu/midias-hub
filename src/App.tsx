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
import MobileNav from "@/components/MobileNav";
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
import ReviewsFeed from "./pages/ReviewsFeed";
import GameReviews from "./pages/GameReviews";
import Marketplace from "./pages/Marketplace";
import AnuncioDetail from "./pages/AnuncioDetail";
import CreateAd from "./pages/CreateAd";
import MeusAnuncios from "./pages/MeusAnuncios";
import Mensagens from "./pages/Mensagens";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";

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
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1 pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/catalogo" element={<Catalogo />} />
                  <Route path="/ofertas" element={<Ofertas />} />
                  <Route path="/jogo/:id" element={<GameDetail />} />
                  <Route path="/carrinho" element={<Carrinho />} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/pedidos" element={<ProtectedRoute><Pedidos /></ProtectedRoute>} />
                  <Route path="/favoritos" element={<ProtectedRoute><Favoritos /></ProtectedRoute>} />
                  <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                  <Route path="/perfil/:userId" element={<PublicProfile />} />
                  <Route path="/biblioteca" element={<ProtectedRoute><Biblioteca /></ProtectedRoute>} />
                  <Route path="/reviews" element={<ReviewsFeed />} />
                  <Route path="/reviews/:id" element={<GameReviews />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/marketplace/:id" element={<AnuncioDetail />} />
                  <Route path="/marketplace/criar" element={<ProtectedRoute><CreateAd /></ProtectedRoute>} />
                  <Route path="/marketplace/meus-anuncios" element={<ProtectedRoute><MeusAnuncios /></ProtectedRoute>} />
                  <Route path="/mensagens" element={<ProtectedRoute><Mensagens /></ProtectedRoute>} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/contato" element={<Contato />} />
                  <Route path="/termos" element={<TermosDeUso />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <MobileNav />
            </div>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

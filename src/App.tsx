import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cartStore";
import { AuthProvider } from "@/hooks/useAuth";
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
import Marketplace from "./pages/Marketplace";
import AnuncioDetail from "./pages/AnuncioDetail";
import Mensagens from "./pages/Mensagens";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
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
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/marketplace/:id" element={<AnuncioDetail />} />
                  <Route path="/mensagens" element={<ProtectedRoute><Mensagens /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

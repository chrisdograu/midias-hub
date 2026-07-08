import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cartStore";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { TutorialProvider } from "@/components/tutorial/TutorialContext";
import { Loader2 } from "lucide-react";
import { mobileRoutes } from "@/routes/MobileRoutes";
import { desktopRoutes } from "@/routes/DesktopRoutes";
import { webRoutes } from "@/routes/WebRoutes";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";

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
                  <QueryErrorBoundary>
                    <Routes>
                      {mobileRoutes}
                      {desktopRoutes}
                      {webRoutes}
                    </Routes>
                  </QueryErrorBoundary>
                </Suspense>
              </BrowserRouter>
            </CartProvider>
          </TutorialProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

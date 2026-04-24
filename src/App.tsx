import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeSettingsProvider } from "@/hooks/useThemeSettings";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import PublicCatalog from "./pages/PublicCatalog.tsx";
import CatalogsList from "./pages/admin/CatalogsList.tsx";
import CatalogDetail from "./pages/admin/CatalogDetail.tsx";
import Reports from "./pages/admin/Reports.tsx";
import SettingsLayout from "./pages/admin/settings/SettingsLayout.tsx";
import SettingsIndex from "./pages/admin/settings/SettingsIndex.tsx";
import WhatsAppSettings from "./pages/admin/settings/WhatsAppSettings.tsx";
import CategoriesSettings from "./pages/admin/settings/CategoriesSettings.tsx";
import BrandingSettings from "./pages/admin/settings/BrandingSettings.tsx";
import ThemeSettings from "./pages/admin/settings/ThemeSettings.tsx";
import FontsSettings from "./pages/admin/settings/FontsSettings.tsx";
import ComingSoon from "./pages/admin/settings/ComingSoon.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeSettingsProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/c/:slug" element={<PublicCatalog />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CatalogsList />} />
              <Route path="catalogs/:id" element={<CatalogDetail />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<SettingsLayout />}>
                <Route index element={<SettingsIndex />} />
                <Route path="whatsapp" element={<WhatsAppSettings />} />
                <Route path="categories" element={<CategoriesSettings />} />
                <Route
                  path="branding"
                  element={<BrandingSettings />}
                />
                <Route
                  path="theme"
                  element={<ThemeSettings />}
                />
                <Route
                  path="fonts"
                  element={<FontsSettings />}
                />
                <Route
                  path="css"
                  element={
                    <ComingSoon
                      title="CSS Customizado"
                      description="Estilos personalizados para a loja."
                    />
                  }
                />
              </Route>
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ThemeSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

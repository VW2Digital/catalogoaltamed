import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeSettingsProvider } from "@/hooks/useThemeSettings";
import { CartProvider } from "@/hooks/useCart";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import PublicCatalog from "./pages/PublicCatalog.tsx";
import Bag from "./pages/Bag.tsx";
import CatalogsList from "./pages/admin/CatalogsList.tsx";
import CatalogDetail from "./pages/admin/CatalogDetail.tsx";
import Reports from "./pages/admin/Reports.tsx";
import TypographyPreview from "./pages/admin/TypographyPreview.tsx";
import SettingsLayout from "./pages/admin/settings/SettingsLayout.tsx";
import SettingsIndex from "./pages/admin/settings/SettingsIndex.tsx";
import WhatsAppSettings from "./pages/admin/settings/WhatsAppSettings.tsx";
import CategoriesSettings from "./pages/admin/settings/CategoriesSettings.tsx";
import BrandsSettings from "./pages/admin/settings/BrandsSettings.tsx";
import BrandingSettings from "./pages/admin/settings/BrandingSettings.tsx";
import ThemeSettings from "./pages/admin/settings/ThemeSettings.tsx";
import FontsSettings from "./pages/admin/settings/FontsSettings.tsx";
import ComingSoon from "./pages/admin/settings/ComingSoon.tsx";
import CustomCodeSettings from "./pages/admin/settings/CustomCodeSettings.tsx";
import { useCustomCodeInjector } from "@/hooks/useCustomCode";
import { useProductTitleCaseInjector } from "@/hooks/useProductTitleCase";
import ProductTitlesSettings from "./pages/admin/settings/ProductTitlesSettings.tsx";
import VendorsSettings from "./pages/admin/settings/VendorsSettings.tsx";

const queryClient = new QueryClient();

const AppInner = () => {
  useCustomCodeInjector();
  useProductTitleCaseInjector();
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/c/:slug" element={<PublicCatalog />} />
      <Route path="/sacola" element={<Bag />} />
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
        <Route path="preview" element={<TypographyPreview />} />
        <Route path="settings" element={<SettingsLayout />}>
          <Route index element={<SettingsIndex />} />
          <Route path="whatsapp" element={<WhatsAppSettings />} />
          <Route path="categories" element={<CategoriesSettings />} />
          <Route path="brands" element={<BrandsSettings />} />
          <Route path="branding" element={<BrandingSettings />} />
          <Route path="theme" element={<ThemeSettings />} />
          <Route path="fonts" element={<FontsSettings />} />
          <Route path="product-titles" element={<ProductTitlesSettings />} />
          <Route path="custom-code" element={<CustomCodeSettings />} />
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
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeSettingsProvider>
            <CartProvider>
              <AppInner />
            </CartProvider>
          </ThemeSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

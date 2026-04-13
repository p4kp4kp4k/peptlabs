import { lazy, Suspense } from "react";
import { useAutoUpdate } from "@/hooks/useAutoUpdate";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useThemeColor";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FacebookPixel } from "@/components/FacebookPixel";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Library = lazy(() => import("./pages/Library"));
const Finder = lazy(() => import("./pages/Finder"));
const Calculator = lazy(() => import("./pages/Calculator"));
const Stacks = lazy(() => import("./pages/Stacks"));
const Interactions = lazy(() => import("./pages/Interactions"));
const BodyMap = lazy(() => import("./pages/BodyMap"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminBilling = lazy(() => import("./pages/AdminBilling"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const PeptideDetail = lazy(() => import("./pages/PeptideDetail"));
const Compare = lazy(() => import("./pages/Compare"));
const HistoryPage = lazy(() => import("./pages/History"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const Billing = lazy(() => import("./pages/Billing"));
const Learn = lazy(() => import("./pages/Learn"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));
const Templates = lazy(() => import("./pages/Templates"));
const StackDetail = lazy(() => import("./pages/StackDetail"));
const Store = lazy(() => import("./pages/Store"));
const ProductDetailStore = lazy(() => import("./pages/ProductDetailStore"));

const queryClient = new QueryClient();

function AutoUpdater() {
  useAutoUpdate();
  return null;
}

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const AppRoute = ({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) => (
  <ProtectedRoute requireAdmin={requireAdmin}>
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <AutoUpdater />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <FacebookPixel />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
            <Route path="/admin-login" element={<Suspense fallback={<PageLoader />}><AdminLogin /></Suspense>} />

            {/* Legacy redirects */}
            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/library" element={<Navigate to="/app/peptides" replace />} />
            <Route path="/finder" element={<Navigate to="/app/finder" replace />} />
            <Route path="/calculator" element={<Navigate to="/app/calculator" replace />} />
            <Route path="/stacks" element={<Navigate to="/app/stacks" replace />} />
            <Route path="/interactions" element={<Navigate to="/app/interactions" replace />} />
            <Route path="/body-map" element={<Navigate to="/app/body-map" replace />} />
            <Route path="/admin" element={<Navigate to="/app/admin" replace />} />

            {/* Protected app routes */}
            <Route path="/app/dashboard" element={<AppRoute><Dashboard /></AppRoute>} />
            <Route path="/app/peptides" element={<AppRoute><Library /></AppRoute>} />
            <Route path="/app/finder" element={<AppRoute><Finder /></AppRoute>} />
            <Route path="/app/compare" element={<AppRoute><Compare /></AppRoute>} />
            <Route path="/app/calculator" element={<AppRoute><Calculator /></AppRoute>} />
            <Route path="/app/stacks" element={<AppRoute><Stacks /></AppRoute>} />
            <Route path="/app/stacks/:stackId" element={<AppRoute><StackDetail /></AppRoute>} />
            <Route path="/app/interactions" element={<AppRoute><Interactions /></AppRoute>} />
            <Route path="/app/body-map" element={<AppRoute><BodyMap /></AppRoute>} />
            <Route path="/app/history" element={<AppRoute><HistoryPage /></AppRoute>} />
            <Route path="/app/settings" element={<AppRoute><SettingsPage /></AppRoute>} />
            <Route path="/app/billing" element={<AppRoute><Billing /></AppRoute>} />
            <Route path="/app/learn" element={<AppRoute><Learn /></AppRoute>} />
            <Route path="/app/learn/:slug" element={<AppRoute><Learn /></AppRoute>} />
            <Route path="/app/admin" element={<AppRoute requireAdmin><Admin /></AppRoute>} />
            <Route path="/app/admin/billing" element={<AppRoute requireAdmin><AdminBilling /></AppRoute>} />
            <Route path="/app/templates" element={<AppRoute><Templates /></AppRoute>} />
            <Route path="/app/store" element={<AppRoute><Store /></AppRoute>} />
            <Route path="/app/store/:productId" element={<AppRoute><ProductDetailStore /></AppRoute>} />
            <Route path="/peptide/:slug" element={<AppRoute><PeptideDetail /></AppRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

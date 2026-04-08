import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useThemeColor";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Finder from "./pages/Finder";
import Calculator from "./pages/Calculator";
import Stacks from "./pages/Stacks";
import StackDetail from "./pages/StackDetail";
import Interactions from "./pages/Interactions";
import BodyMap from "./pages/BodyMap";
import Admin from "./pages/Admin";
import PeptideDetail from "./pages/PeptideDetail";
import Compare from "./pages/Compare";
import HistoryPage from "./pages/History";
import SettingsPage from "./pages/Settings";
import Billing from "./pages/Billing";
import Learn from "./pages/Learn";
import GuideDetail from "./pages/GuideDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoute = ({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) => (
  <ProtectedRoute requireAdmin={requireAdmin}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />

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

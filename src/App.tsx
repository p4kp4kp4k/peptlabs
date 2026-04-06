import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import Library from "./pages/Library";
import Finder from "./pages/Finder";
import Learn from "./pages/Learn";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Calculator from "./pages/Calculator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />

          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/library" element={<AppLayout><Library /></AppLayout>} />
          <Route path="/finder" element={<AppLayout><Finder /></AppLayout>} />
          <Route path="/learn" element={<AppLayout><Learn /></AppLayout>} />
          <Route path="/calculator" element={<AppLayout><Calculator /></AppLayout>} />
          <Route path="/admin" element={<AppLayout><Admin /></AppLayout>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

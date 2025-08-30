import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import MemberManagement from "./pages/MemberManagement";
import PenaltyCatalogManagement from "./pages/PenaltyCatalogManagement";
import PenaltyManagement from "./pages/PenaltyManagement";
import AddPenalty from "./pages/AddPenalty";
import PublicDashboard from "./pages/PublicDashboard";
import IframePenaltyList from "./pages/IframePenaltyList";
import { EventManagement } from "./pages/EventManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/members" element={<MemberManagement />} />
            <Route path="/admin/penalty-catalog" element={<PenaltyCatalogManagement />} />
            <Route path="/admin/penalties" element={<PenaltyManagement />} />
            <Route path="/add-penalty" element={<AddPenalty />} />
            <Route path="/dashboard" element={<PublicDashboard />} />
            <Route path="/iframe/penalties" element={<IframePenaltyList />} />
            <Route path="/events" element={<EventManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

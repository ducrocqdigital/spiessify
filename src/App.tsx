import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import UserManagement from "./pages/UserManagement";
import Auth from "./pages/Auth";

import AdminDashboard from "./pages/AdminDashboard";
import MemberManagement from "./pages/MemberManagement";
import PenaltyCatalogManagement from "./pages/PenaltyCatalogManagement";
import PenaltyManagement from "./pages/PenaltyManagement";
import AddPenalty from "./pages/AddPenalty";
import PublicDashboard from "./pages/PublicDashboard";
import IframePenaltyList from "./pages/IframePenaltyList";
import { EventManagement } from "./pages/EventManagement";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<PublicDashboard />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin-login" element={<Navigate to="/auth" replace />} />
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="chargierte">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/members" element={
                <ProtectedRoute requiredRole="chargierte">
                  <MemberManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/penalty-catalog" element={
                <ProtectedRoute requiredRole="chargierte">
                  <PenaltyCatalogManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/penalties" element={
                <ProtectedRoute requiredRole="chargierte">
                  <PenaltyManagement />
                </ProtectedRoute>
              } />
              <Route path="/add-penalty" element={
                <ProtectedRoute requiredRole="chargierte">
                  <AddPenalty />
                </ProtectedRoute>
              } />
              
              <Route path="/iframe/penalties" element={<IframePenaltyList />} />
              <Route path="/events" element={
                <ProtectedRoute requiredRole="oberadmin">
                  <EventManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="oberadmin">
                  <UserManagement />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

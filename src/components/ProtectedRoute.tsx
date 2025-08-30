import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'oberadmin' | 'chargierte';
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isOberadmin, isChargierte, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !isAuthenticated) {
      navigate(`/auth?returnTo=${encodeURIComponent(location.pathname)}`, { replace: true });
      return;
    }

    if (requiredRole === 'oberadmin' && !isOberadmin) {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (requiredRole === 'chargierte' && !isChargierte && !isOberadmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [
    isAuthenticated, 
    isOberadmin, 
    isChargierte, 
    loading, 
    navigate, 
    location.pathname, 
    requiredRole, 
    requireAuth
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requiredRole === 'oberadmin' && !isOberadmin) {
    return null;
  }

  if (requiredRole === 'chargierte' && !isChargierte && !isOberadmin) {
    return null;
  }

  return <>{children}</>;
}
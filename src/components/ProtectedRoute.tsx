import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: 'ambulance' | 'hospital';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      // Redirect to appropriate login page if not authenticated
      navigate(requiredRole === 'ambulance' ? '/ambulance-login' : '/hospital-login');
    } else if (currentUser.role !== requiredRole) {
      // Redirect to home if authenticated but wrong role
      navigate('/');
    }
  }, [currentUser, requiredRole, navigate]);

  // Only render children if user is authenticated with correct role
  return currentUser?.role === requiredRole ? <>{children}</> : null;
};

export default ProtectedRoute;

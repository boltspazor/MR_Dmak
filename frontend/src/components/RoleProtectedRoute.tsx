import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [],
  fallbackPath = '/dashboard'
}) => {
  const { user, isAuthenticated, canAccess, userRole } = useAuth();
  const location = useLocation();

  // First check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has access to the current page
  if (!canAccess(location.pathname)) {
    // Redirect to appropriate fallback based on user role
    let redirectPath = fallbackPath;
    
    // Super admin can access everything, so redirect to dashboard
    if (userRole === 'super_admin') {
      redirectPath = '/dashboard';
    }
    // Admin/Marketing manager can access most things except super admin
    else if (userRole === 'admin') {
      redirectPath = '/dashboard';
    }
    // Regular users have very limited access
    else {
      redirectPath = '/dashboard';
    }

    return <Navigate to={redirectPath} replace />;
  }

  // If specific roles are required, check them
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;

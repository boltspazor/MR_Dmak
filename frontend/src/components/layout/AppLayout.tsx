import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CollapsibleSidebar from '../CollapsibleSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, activePage = 'dashboard' }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleSidebarNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <CollapsibleSidebar
      activePage={activePage}
      onNavigate={handleSidebarNavigation}
      onLogout={handleLogout}
      userName={user?.name || "User"}
      userRole={user?.role || "Super Admin"}
    >
      {children}
    </CollapsibleSidebar>
  );
};

export default AppLayout;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SimpleMRTool from './pages/SimpleMRTool';
import MedicalReps from './pages/SimpleMRTool';
import Campaigns from './pages/Campaigns';
import Templates from './pages/Templates';
import SuperAdmin from './pages/SuperAdmin';
import CampaignWizard from './pages/CampaignWizard';
import ConsentFormPage from './pages/ConsentFormPage';

// Component to determine active page from route
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  const getActivePage = (pathname: string) => {
    switch (pathname) {
      case '/campaign-wizard': return 'campaign-wizard';
      case '/dashboard': return 'dashboard';
      case '/mrs': return 'dmak';
      case '/campaigns': return 'campaigns';
      case '/templates': return 'templates';
      case '/super-admin': return 'super-admin';
      case '/simple-tool': return 'dmak';
      case '/dmak': return 'dmak';
      case '/consent-form': return 'consent-form';
      default: return 'dashboard';
    }
  };

  return (
    <AppLayout activePage={getActivePage(location.pathname)}>
      {children}
    </AppLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public routes accessible to all authenticated users */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <Dashboard />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/consent-form"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <ConsentFormPage />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simple-tool"
              element={
                <ProtectedRoute>
                  <RouteWrapper>
                    <SimpleMRTool />
                  </RouteWrapper>
                </ProtectedRoute>
              }
            />
            
            {/* Admin+ routes (Admin, Marketing Manager, Super Admin) */}
            <Route
              path="/campaign-wizard"
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'marketing_manager', 'super_admin']}>
                  <RouteWrapper>
                    <CampaignWizard />
                  </RouteWrapper>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/campaigns"
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'marketing_manager', 'super_admin']}>
                  <RouteWrapper>
                    <Campaigns />
                  </RouteWrapper>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <RoleProtectedRoute requiredRoles={['admin', 'marketing_manager', 'super_admin']}>
                  <RouteWrapper>
                    <Templates />
                  </RouteWrapper>
                </RoleProtectedRoute>
              }
            />
            
            {/* Marketing Manager+ routes (Marketing Manager, Super Admin) */}
            <Route
              path="/dmak"
              element={
                <RoleProtectedRoute requiredRoles={['marketing_manager', 'super_admin']}>
                  <RouteWrapper>
                    <SimpleMRTool />
                  </RouteWrapper>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/mrs"
              element={
                <RoleProtectedRoute requiredRoles={['marketing_manager', 'super_admin']}>
                  <RouteWrapper>
                    <MedicalReps />
                  </RouteWrapper>
                </RoleProtectedRoute>
              }
            />
            
            {/* Super Admin only routes */}
            <Route
              path="/super-admin"
              element={
                <RoleProtectedRoute requiredRoles={['super_admin']}>
                  <RouteWrapper>
                    <SuperAdmin />
                  </RouteWrapper>
                </RoleProtectedRoute>
              }
            />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
        </Router>
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
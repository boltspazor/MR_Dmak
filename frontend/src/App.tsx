import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import MRs from './pages/MRs';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import NotificationToast from './components/common/NotificationToast';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="groups" element={<Groups />} />
        <Route path="mrs" element={<MRs />} />
        <Route path="messages" element={<Messages />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="App">
            <AppRoutes />
            <NotificationToast />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

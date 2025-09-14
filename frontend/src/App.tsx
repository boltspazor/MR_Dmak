import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SimpleMRTool from './pages/SimpleMRTool';
import MedicalReps from './pages/MedicalReps';
import Campaigns from './pages/Campaigns';
import Templates from './pages/Templates';
import SuperAdmin from './pages/SuperAdmin';
import WhatsAppManagement from './pages/WhatsAppManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mrs"
              element={
                <ProtectedRoute>
                  <MedicalReps />
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns"
              element={
                <ProtectedRoute>
                  <Campaigns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <Templates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute>
                  <SuperAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simple-tool"
              element={
                <ProtectedRoute>
                  <SimpleMRTool />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dmak"
              element={
                <ProtectedRoute>
                  <SimpleMRTool />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dmat"
              element={
                <ProtectedRoute>
                  <WhatsAppManagement />
                </ProtectedRoute>
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
    </AuthProvider>
  );
}

export default App;
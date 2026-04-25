import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/index';
import { Dashboard } from './pages/Dashboard';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Playground } from './pages/Playground';
import { SettingsPage } from './pages/Settings';
import { SuperAdminPage } from './pages/SuperAdmin';
import { AllBusinessesPage } from './pages/Admin';
import { LoginPage } from './pages/Login';
import { BillingPage } from './pages/Billing';
import { HelpPage } from './pages/Help';
import { BusinessProvider } from './context/BusinessContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Guard for Private Routes
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// Guard for Login/Signup ONLY (redirect if already logged in)
const AuthPageGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) {
    return isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Home - NO REDIRECT */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Login/Signup - Protected from already-logged-in users */}
      <Route path="/login" element={<AuthPageGuard><LoginPage mode="login" /></AuthPageGuard>} />
      <Route path="/signup" element={<AuthPageGuard><LoginPage mode="signup" /></AuthPageGuard>} />

      {/* 3. Private Pages - Shared Layout */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/knowledge" element={<ProtectedRoute><Layout><KnowledgeBase /></Layout></ProtectedRoute>} />
      <Route path="/playground" element={<ProtectedRoute><Layout><Playground /></Layout></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><Layout><BillingPage /></Layout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Layout><HelpPage /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
      
      {/* 4. Admin Specific */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><Layout><SuperAdminPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/businesses" element={<ProtectedRoute adminOnly><Layout><AllBusinessesPage /></Layout></ProtectedRoute>} />

      {/* 5. Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <BusinessProvider>
          <AppRoutes />
        </BusinessProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

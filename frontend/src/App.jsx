import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/Dashboard/DashboardPage';
import LeadsPage from './pages/Leads/LeadsPage';
import LeadDetailPage from './pages/Leads/LeadDetailPage';
import KnowledgeBasePage from './pages/KnowledgeBase/KnowledgeBasePage';
import SalesScriptsPage from './pages/Scripts/SalesScriptsPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import TelegramIntegrationPage from './pages/Settings/TelegramIntegrationPage';
import WhatsAppIntegrationPage from './pages/Settings/WhatsAppIntegrationPage';
import ZaloIntegrationPage from './pages/Settings/ZaloIntegrationPage';
import AlibabaIntegrationPage from './pages/Settings/AlibabaIntegrationPage';
import ProfilePage from './pages/Profile/ProfilePage';
import UserManagementPage from './pages/Users/UserManagementPage';
import ShiftSchedulePage from './pages/Users/ShiftSchedulePage';
import LoginPage from './pages/Auth/LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/knowledge" element={<KnowledgeBasePage />} />
        <Route path="/scripts" element={<SalesScriptsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/telegram" element={<TelegramIntegrationPage />} />
        <Route path="/settings/whatsapp" element={<WhatsAppIntegrationPage />} />
        <Route path="/settings/zalo" element={<ZaloIntegrationPage />} />
        <Route path="/settings/alibaba" element={<AlibabaIntegrationPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/shifts" element={<ShiftSchedulePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111729',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;

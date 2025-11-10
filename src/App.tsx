
import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { AppSidebar } from './features/navigation/AppSidebar';
import { AppHeader } from './features/navigation/AppHeader';
import { Dashboard } from './features/dashboard/Dashboard';
import { ClientList } from './features/clients/ClientList';
import { ClientProfile } from './features/clients/ClientProfile';
import { MenuBuilder } from './features/menu/MenuBuilder';
import { LabTests } from './features/labs/LabTests';
import { EventsPage } from './features/events/EventsPage';
import { BillingPage } from './features/billing/BillingPage';
import { TelegramFlow } from './features/telegram/TelegramFlow';
import type { AppRoute } from './features/navigation/useAppNavigation';
import LoginPage from './features/auth/LoginPage';
import { getToken } from './api/auth';

const AppShell: React.FC = () => {
  const navigate = useNavigate();

  const handleRouteChange = (route: AppRoute) => {
    switch (route) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'clients':
        navigate('/clients');
        break;
      case 'client-profile':
        navigate('/clients'); // профиль теперь завязан на :id, переход из списка
        break;
      case 'menu':
        navigate('/menu');
        break;
      case 'labs':
        navigate('/labs');
        break;
      case 'events':
        navigate('/events');
        break;
      case 'billing':
        navigate('/billing');
        break;
      case 'telegram':
        navigate('/telegram');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const Sidebar = (
    <AppSidebar
      // activeRoute вычисляем по location.pathname
      activeRoute={
          window.location.pathname.startsWith('/clients')
            ? 'clients'
            : window.location.pathname.startsWith('/dashboard')
            ? 'dashboard'
            : window.location.pathname.startsWith('/menu')
            ? 'menu'
            : window.location.pathname.startsWith('/labs')
            ? 'labs'
            : window.location.pathname.startsWith('/events')
            ? 'events'
            : window.location.pathname.startsWith('/billing')
            ? 'billing'
            : window.location.pathname.startsWith('/telegram')
            ? 'telegram'
            : 'dashboard'
        }
      onRouteChange={handleRouteChange}
    />
  );

  const Header = (
    <AppHeader
      onRouteChange={handleRouteChange}
    />
  );

  const ClientProfileByRoute: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    if (!id) {
      return <Navigate to="/clients" replace />;
    }
    return (
      <ClientProfile
        clientId={id}
        onBackToList={() => navigate('/clients')}
      />
    );
  };

  const isAuthenticated = (): boolean => {
    return !!getToken();
  };

  const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <div className="AppRoot">
      <Layout sidebar={Sidebar} header={Header}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard onSelectClient={(id) => navigate(`/clients/${id}`)} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <ClientList onSelectClient={(id) => navigate(`/clients/${id}`)} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute>
                <ClientProfileByRoute />
              </ProtectedRoute>
            }
          />

          <Route
            path="/menu"
            element={
              <ProtectedRoute>
                <MenuBuilder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/labs"
            element={
              <ProtectedRoute>
                <LabTests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/telegram"
            element={
              <ProtectedRoute>
                <TelegramFlow />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              isAuthenticated() ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;

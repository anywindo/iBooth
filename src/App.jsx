import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingScreen from './screens/LandingScreen.jsx';
import EditorScreen from './screens/EditorScreen.jsx';
import BoothScreen from './screens/BoothScreen.jsx';
import PreviewScreen from './screens/PreviewScreen.jsx';
import CatalogScreen from './screens/CatalogScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import ResetPasswordScreen from './screens/ResetPasswordScreen.jsx';
import AuthScreen from './screens/AuthScreen.jsx';
import Toast from './components/Toast.jsx';
import { CookieConsent } from './components/CookieConsent.jsx';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children, redirectTo = '/catalog' }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  return children;
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    // Supabase's onAuthStateChange will automatically fire INITIAL_SESSION
    // which updates authStore and sets isLoading to false.
    // However, if Supabase is completely non-responsive, we forcefully unlock the UI.
    const failsafe = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        console.warn('Supabase INITIAL_SESSION timed out. Force unlocking UI.');
        useAuthStore.setState({ isLoading: false });
      }
    }, 5000);
    
    return () => clearTimeout(failsafe);
  }, []);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>Loading iBooth...</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingScreen navigate={navigate} />} />
        <Route 
          path="/editor" 
          element={
            <ProtectedRoute>
              <EditorScreen navigate={navigate} />
            </ProtectedRoute>
          } 
        />
        <Route path="/catalog" element={<CatalogScreen navigate={navigate} />} />
        <Route path="/booth" element={<BoothScreen navigate={navigate} />} />
        <Route path="/booth/:templateId" element={<BoothScreen navigate={navigate} />} />
        <Route path="/preview" element={<PreviewScreen navigate={navigate} />} />
        <Route path="/preview/:sessionId" element={<PreviewScreen navigate={navigate} />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute redirectTo="/">
              <ProfileScreen navigate={navigate} />
            </ProtectedRoute>
          } 
        />
        <Route path="/auth" element={<AuthScreen navigate={navigate} />} />
        <Route path="/reset-password" element={<ResetPasswordScreen navigate={navigate} />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <CookieConsent />
      <Toast />
    </BrowserRouter>
  );
}

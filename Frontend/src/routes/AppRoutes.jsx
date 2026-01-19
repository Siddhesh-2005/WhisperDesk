import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { lazy, Suspense } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy load pages for faster initial load
const LandingPage = lazy(() => import('../pages/LandingPage'));
const HomePage = lazy(() => import('../pages/HomePage'));
const MagicLinkCallback = lazy(() => import('../pages/MagicLinkCallback'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
    <div className="text-center">
      <p className="font-black text-2xl uppercase">Loading...</p>
    </div>
  </div>
);

function AppRoutes() {
  const { user } = useSelector((state) => state.auth);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/home" replace /> : <LandingPage />}
        />

        {/* Magic link callback - handles token exchange */}
        <Route path="/auth/callback" element={<MagicLinkCallback />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;

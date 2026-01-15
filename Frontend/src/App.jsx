import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { getUser } from './store/slices/authSlice';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Always try to get user from backend (cookie-based auth)
      // This handles both: returning users and magic link redirects
      try {
        await dispatch(getUser()).unwrap();
      } catch {
        // User not authenticated - that's fine
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [dispatch]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="text-center">
          <p className="font-black text-2xl uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

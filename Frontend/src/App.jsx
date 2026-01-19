import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { getUser } from './store/slices/authSlice';
import './App.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check auth in background without blocking render
    dispatch(getUser()).catch(() => {
      // User not authenticated - that's fine
    });
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

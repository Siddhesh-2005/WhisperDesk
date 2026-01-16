import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import axiosInstance from '../config/axios.config';

// Module-level flag to prevent duplicate requests across re-mounts
let isProcessingToken = false;

function MagicLinkCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No magic token provided');
      setIsLoading(false);
      return;
    }

    // Prevent duplicate requests
    if (isProcessingToken) {
      console.log('Already processing token, skipping...');
      return;
    }

    isProcessingToken = true;

    const handleMagicLink = async () => {
      try {
        const response = await axiosInstance.get('/users/login', {
          params: { magictoken: token }
        });
        
        if (response.data?.data?.user) {
          // Store user in localStorage and Redux
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
          dispatch(setUser(response.data.data.user));
          // Reset flag before navigation
          isProcessingToken = false;
          navigate('/home', { replace: true });
        } else {
          setError('Login failed - no user data');
          setIsLoading(false);
          isProcessingToken = false;
        }
      } catch (err) {
        console.error('Magic link error:', err);
        const errorMessage = err.response?.data?.message || 'Invalid or expired magic link';
        
        // If token was already used, it means first request succeeded - redirect to home
        if (errorMessage.includes('already used')) {
          console.log('Token already used (first request likely succeeded), redirecting...');
          isProcessingToken = false;
          navigate('/home', { replace: true });
          return;
        }
        
        // Only show error for actual failures
        setError(errorMessage);
        setIsLoading(false);
        isProcessingToken = false;
      }
    };

    handleMagicLink();

    // Cleanup on unmount
    return () => {
      // Don't reset if navigating to home (successful login)
    };
  }, [searchParams, navigate, dispatch]);

  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="text-center">
          <p className="font-black text-2xl uppercase">Logging you in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="border-4 border-black bg-white p-8 shadow-[8px_8px_0_black] text-center">
          <p className="font-black text-2xl uppercase mb-4 text-red-600">Login Failed</p>
          <p className="mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-[#ff4d00] text-white border-4 border-black font-black uppercase shadow-[6px_6px_0_black]"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return null;
}

export default MagicLinkCallback;

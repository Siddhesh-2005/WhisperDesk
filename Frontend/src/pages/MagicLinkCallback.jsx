import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { handleOAuthCallback } from '../store/slices/authSlice';

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate requests
    if (isProcessingRef.current) {
      return;
    }

    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setIsLoading(false);
      return;
    }

    if (!success) {
      setError('Invalid callback - no success parameter');
      setIsLoading(false);
      return;
    }

    isProcessingRef.current = true;

    const handleCallback = async () => {
      try {
        const result = await dispatch(handleOAuthCallback()).unwrap();
        
        if (result) {
          // Successfully authenticated, redirect to home
          navigate('/home', { replace: true });
        } else {
          setError('Authentication failed - no user data');
          setIsLoading(false);
        }
      } catch (err) {
        const errorMessage = err || 'Authentication failed';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    handleCallback();

    return () => {};
  }, [searchParams, navigate, dispatch]);

  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sand)]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto"></div>
          <p className="font-black text-2xl uppercase text-[var(--ink)]">Authenticating...</p>
          <p className="text-[var(--ink)]/70">Setting up your anonymous profile</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sand)] p-6">
        <div className="border-4 border-black bg-white p-8 shadow-[12px_12px_0_#0f172a] text-center max-w-md rounded-2xl">
          <span className="inline-block text-6xl mb-4">⚠️</span>
          <p className="font-black text-2xl uppercase mb-4 text-red-600">Authentication Failed</p>
          <p className="mb-6 text-[var(--ink)]/80">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-[var(--accent)] text-[var(--ink)] border-4 border-black font-black uppercase shadow-[8px_8px_0_#0f172a] rounded-xl hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0_#0f172a] transition-transform"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return null;
}

export default OAuthCallback;


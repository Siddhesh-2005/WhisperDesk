import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import axiosInstance from '../config/axios.config';

function MagicLinkCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleMagicLink = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('No magic token provided');
        return;
      }

      try {
        const response = await axiosInstance.get(`/users/login?magictoken=${token}`);
        
        if (response.data?.data?.user) {
          // Store user in localStorage and Redux
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
          dispatch(setUser(response.data.data.user));
          navigate('/home', { replace: true });
        } else {
          setError('Login failed - no user data');
        }
      } catch (err) {
        console.error('Magic link error:', err);
        setError(err.response?.data?.message || 'Invalid or expired magic link');
      }
    };

    handleMagicLink();
  }, [searchParams, navigate, dispatch]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
      <div className="text-center">
        <p className="font-black text-2xl uppercase">Logging you in...</p>
      </div>
    </div>
  );
}

export default MagicLinkCallback;

import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

function Navbar({ onCreateClick }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
  };

  return (
    <nav className="border-b-[6px] border-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-black text-white grid place-items-center font-black text-lg">
            WD
          </div>
          <div>
            <p className="font-black uppercase tracking-widest text-sm">WhisperDesk</p>
            <p className="text-xs text-gray-600">Anonymous. Raw. Unfiltered.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onCreateClick}
            className="px-6 py-2 border-4 border-black bg-[#ff4d00] text-white font-black uppercase tracking-wide shadow-[6px_6px_0_black] hover:shadow-[4px_4px_0_black] transition-all"
          >
            New Post
          </button>

          <div className="flex items-center gap-3 pl-4 border-l-4 border-black">
            <div className="text-right">
              <p className="font-bold text-sm">{user?.username || 'Anon'}</p>
              {/* <p className="text-xs text-gray-600">{user?.email || 'guest'}</p> */}
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 border-3 border-black bg-red-300 font-bold text-sm uppercase shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

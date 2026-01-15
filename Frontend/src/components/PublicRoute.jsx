import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    // If already logged in, redirect to dashboard/home
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default PublicRoute;

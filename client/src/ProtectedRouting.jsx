import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useSelector((state) => state.auth);

  // 1. Show a loading spinner while Redux is busy with any auth thunk
  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  // 2. If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. If authenticated but the 'user' object hasn't been saved to state yet
  // This is the most common place where admin logins fail. 
  // We return null (blank screen) or a small spinner while the user data arrives.
  if (isAuthenticated && !user) {
    return null; 
  }

  // 4. Admin Guard: If route is admin-only, check if is_staff is true
  if (adminOnly && !user?.is_staff) {
    return <Navigate to="/" replace />;
  }

  // 5. Authorized: Render the requested page
  return <Outlet />;
};

export default ProtectedRoute;
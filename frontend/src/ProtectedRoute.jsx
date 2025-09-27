import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  if (loading) return null; // or a loading spinner

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
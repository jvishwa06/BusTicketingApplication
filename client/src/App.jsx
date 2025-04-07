import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Profile from './components/auth/Profile';
import SearchBus from './pages/user/SearchBus';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/login" />;
  }

  return children;
};

const App = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }
  
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/search-bus" /> : <Navigate to="/login" />} />
      <Route path="/register" element={user ? <Navigate to="/search-bus" /> : <Register />} />
      <Route path="/login" element={user ? <Navigate to="/search-bus" /> : <Login />} />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/search-bus" element={
        <ProtectedRoute>
          <SearchBus />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default App;
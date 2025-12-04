import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');

      if(!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8080/api/auth/me', {
        headers: {
          'Authorization' : `Bearer ${token}`
        }
      });

      if(response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
      else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
        console.error('Auth check failed:', error);
    } finally {
        setLoading(false);
    }
  }

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  const updateUser = (updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }

  const value = {
    user,
    loading,
    checkAuth,
    updateUser,
    isAuthenticated: !!user,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
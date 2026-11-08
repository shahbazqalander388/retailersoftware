import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // Attempt backend authentication
      const res = await api.post('/auth/login', {
        email: cleanEmail,
        password: cleanPassword,
      });

      if (res.data?.success) {
        const userData = res.data.user;
        setUser(userData);
        localStorage.setItem('apex_user', JSON.stringify(userData));
        setLoading(false);
        return { success: true };
      }
    } catch (err) {
      // Fallback local check for exact requested credentials in case of offline/network issues
      if (
        cleanEmail === 'syedshahbaz2004@gmail.com' &&
        cleanPassword === 'retailer123'
      ) {
        const fallbackUser = {
          email: 'syedshahbaz2004@gmail.com',
          name: 'Shahbaz Qalander',
          role: 'Store Admin & Owner',
          terminal: 'Cashier Terminal #1',
        };
        setUser(fallbackUser);
        localStorage.setItem('apex_user', JSON.stringify(fallbackUser));
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      const errorMsg =
        err.response?.data?.message ||
        'Ghalat email ya password! Please dobara check karein.';
      return { success: false, message: errorMsg };
    }

    setLoading(false);
    return { success: false, message: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('apex_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

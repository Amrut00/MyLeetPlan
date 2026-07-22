import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  getToken,
  setToken,
  clearToken,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate the session on load: if a token exists, verify it and load the user
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await getCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch {
        clearToken();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, []);

  // React to 401s emitted by the axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: loggedInUser } = await loginUser(email, password);
    setToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const { token, user: newUser } = await registerUser(email, password, name);
    setToken(token);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI, TokenManager } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => TokenManager.getUser());
  const [loading, setLoading] = useState(true);

  const isAuthenticated = useMemo(() => !!TokenManager.getAccessToken(), []);

  const setUser = (u) => {
    setUserState(u || null);
    if (u) TokenManager.setUser(u);
    else TokenManager.setUser(null);
  };

  const bootstrap = async () => {
    try {
      const token = TokenManager.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Validate token with backend (and optionally fetch current user)
      const verifyRes = await authAPI.verifyToken(token);
      const verifyData = verifyRes?.data;

      if (!verifyData?.success) {
        TokenManager.clearTokens();
        setUser(null);
        setLoading(false);
        return;
      }

      // Prefer backend-provided user from /auth/me (more reliable than token payload)
      const meRes = await authAPI.getCurrentUser();
      const meData = meRes?.data;

      if (meData?.success && meData?.data) {
        setUser(meData.data);
      } else {
        // If /auth/me isn't implemented, at least keep auth state
        setUser(TokenManager.getUser());
      }
    } catch (err) {
      TokenManager.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    const data = res?.data;

    if (!data?.success) {
      throw new Error(data?.error || data?.message || 'Login failed');
    }

    const accessToken = data?.data?.accessToken;
    const refreshToken = data?.data?.refreshToken;
    const userData = data?.data?.user;

    if (accessToken) TokenManager.setAccessToken(accessToken);
    if (refreshToken) TokenManager.setRefreshToken(refreshToken);
    if (userData) setUser(userData);

    return data;
  };

  const logout = async () => {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) await authAPI.logout(refreshToken);
    } catch {
      // ignore
    } finally {
      TokenManager.clearTokens();
      setUser(null);
      window.location.href = '/login';
    }
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      isAuthenticated: !!TokenManager.getAccessToken(),
      login,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

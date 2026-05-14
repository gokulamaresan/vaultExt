import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@state/zustand/authStore';

/**
 * useAuth Hook
 * Provides authentication state and methods to React components
 * 
 * Usage:
 * const { user, isAuthenticated, login, logout, isLoading, error } = useAuth();
 */

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    isCheckingAuth,
    error,
    checkAuth,
    login,
    logout,
    refreshAuth,
    getToken,
  } = useAuthStore();



  // Auto-refresh token before expiry
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const tokenRefreshInterval = setInterval(async () => {
      const result = await refreshAuth();
      if (!result.success) {
        // Token refresh failed, logout
        logout();
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(tokenRefreshInterval);
  }, [isAuthenticated, token, refreshAuth, logout]);

  const handleLogin = useCallback(
    async (email, password) => {
      return await login(email, password);
    },
    [login]
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    isCheckingAuth,
    error,

    // Methods
    checkAuth,
    login: handleLogin,
    logout: handleLogout,
    getToken,
    refreshAuth,
  };
};

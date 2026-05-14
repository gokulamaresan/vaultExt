import { create } from 'zustand';
import AuthService from '../../services/auth-service';
import StorageManager from '../../storage/storage-manager';

/**
 * Authentication Store
 * Manages user authentication state globally
 * 
 * Features:
 * - User login/logout
 * - Token management
 * - Session persistence
 * - Auto-authentication check
 */

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  /**
   * Check if user is already authenticated
   * Called on app initialization
   */
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const isValid = await AuthService.isAuthenticated();
      
      if (isValid) {
        const token = await StorageManager.getJWTToken();
        const user = await StorageManager.getUserData();
        
        set({
          token,
          user,
          isAuthenticated: true,
          isCheckingAuth: false,
          error: null,
        });
      } else {
        set({ isCheckingAuth: false, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ isCheckingAuth: false, error: error.message });
    }
  },

  /**
   * Login user with email and password
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.login(email, password);
      
      if (response.success) {
        const { user, token } = response.data;
        
        // Save to storage
        await StorageManager.saveJWTToken(token);
        await StorageManager.saveUserData(user);

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return { success: true };
      } else {
        set({
          isLoading: false,
          error: response.error || 'Login failed',
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Logout user and clear all data
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await AuthService.logout();
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state anyway
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /**
   * Refresh authentication token
   */
  refreshAuth: async () => {
    try {
      const refreshed = await AuthService.refreshToken();
      
      if (refreshed) {
        set({
          token: refreshed.token,
          user: refreshed.user,
          error: null,
        });
        
        // Save updated token
        await StorageManager.saveJWTToken(refreshed.token);
        await StorageManager.saveUserData(refreshed.user);

        return { success: true };
      } else {
        // Refresh failed
        get().logout();
        return { success: false, error: 'Token refresh failed' };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      get().logout();
      return { success: false, error: error.message };
    }
  },

  /**
   * Get current auth token
   */
  getToken: () => {
    const { token } = get();
    return token;
  },

  /**
   * Check if user is authenticated
   */
  isAuth: () => {
    return get().isAuthenticated;
  },
}));

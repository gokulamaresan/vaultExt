import { create } from 'zustand';
import CredentialsService from '../../services/credentials-service';

/**
 * Credentials Store
 * Manages password vault and credentials state globally
 * 
 * Features:
 * - Store credentials list
 * - Search functionality
 * - Filtering
 * - CRUD operations
 * - Sync with backend
 */

export const useCredentialsStore = create((set, get) => ({
  // State
  credentials: [],
  filteredCredentials: [],
  isLoading: false,
  isSyncing: false,
  error: null,
  searchQuery: '',
  selectedDomain: null,
  lastSyncTime: null,

  // Actions
  setCredentials: (credentials) => {
    set({
      credentials,
      filteredCredentials: credentials,
      lastSyncTime: Date.now(),
    });
  },

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDomain: (domain) => set({ selectedDomain: domain }),

  /**
   * Fetch all credentials from API
   */
  fetchCredentials: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await CredentialsService.fetchCredentials();

      if (response.success) {
        set({
          credentials: response.data || [],
          filteredCredentials: response.data || [],
          isLoading: false,
          lastSyncTime: Date.now(),
          error: null,
        });
        return { success: true };
      } else {
        set({
          isLoading: false,
          error: response.error || 'Failed to fetch credentials',
        });
        return { success: false };
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
      return { success: false };
    }
  },

  /**
   * Search credentials
   */
  searchCredentials: (query) => {
    const { credentials } = get();

    if (!query) {
      set({ searchQuery: '', filteredCredentials: credentials });
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = credentials.filter((cred) => {
      return (
        cred.name?.toLowerCase().includes(queryLower) ||
        cred.domain?.toLowerCase().includes(queryLower) ||
        cred.username?.toLowerCase().includes(queryLower)
      );
    });

    set({
      searchQuery: query,
      filteredCredentials: filtered,
    });
  },

  /**
   * Filter credentials by domain
   */
  filterByDomain: (domain) => {
    const { credentials } = get();

    if (!domain) {
      set({ selectedDomain: null, filteredCredentials: credentials });
      return;
    }

    const filtered = credentials.filter((cred) => cred.domain === domain);

    set({
      selectedDomain: domain,
      filteredCredentials: filtered,
    });
  },

  /**
   * Get credentials for specific domain
   */
  getCredentialsByDomain: (domain) => {
    const { credentials } = get();
    return credentials.filter((cred) => cred.domain === domain);
  },

  /**
   * Create new credential
   */
  createCredential: async (credentialData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await CredentialsService.createCredential(credentialData);

      if (response.success) {
        const newCredential = response.data;
        const { credentials } = get();

        set({
          credentials: [...credentials, newCredential],
          filteredCredentials: [...credentials, newCredential],
          isLoading: false,
          error: null,
        });

        return { success: true, credential: newCredential };
      } else {
        set({
          isLoading: false,
          error: response.error || 'Failed to create credential',
        });
        return { success: false };
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
      return { success: false };
    }
  },

  /**
   * Update credential
   */
  updateCredential: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await CredentialsService.updateCredential(id, updates);

      if (response.success) {
        const updatedCredential = response.data;
        const { credentials } = get();

        const updated = credentials.map((cred) =>
          cred.id === id ? updatedCredential : cred
        );

        set({
          credentials: updated,
          filteredCredentials: updated,
          isLoading: false,
          error: null,
        });

        return { success: true };
      } else {
        set({
          isLoading: false,
          error: response.error || 'Failed to update credential',
        });
        return { success: false };
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
      return { success: false };
    }
  },

  /**
   * Delete credential
   */
  deleteCredential: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await CredentialsService.deleteCredential(id);

      if (response.success) {
        const { credentials } = get();
        const filtered = credentials.filter((cred) => cred.id !== id);

        set({
          credentials: filtered,
          filteredCredentials: filtered,
          isLoading: false,
          error: null,
        });

        return { success: true };
      } else {
        set({
          isLoading: false,
          error: response.error || 'Failed to delete credential',
        });
        return { success: false };
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });
      return { success: false };
    }
  },

  /**
   * Sync vault with backend
   */
  syncVault: async () => {
    set({ isSyncing: true, error: null });
    try {
      const response = await CredentialsService.syncVault();

      if (response.success) {
        set({
          credentials: response.data || [],
          filteredCredentials: response.data || [],
          isSyncing: false,
          lastSyncTime: Date.now(),
          error: null,
        });
        return { success: true };
      } else {
        set({
          isSyncing: false,
          error: response.error || 'Sync failed',
        });
        return { success: false };
      }
    } catch (error) {
      set({
        isSyncing: false,
        error: error.message,
      });
      return { success: false };
    }
  },

  /**
   * Check if vault needs sync
   */
  needsSync: () => {
    const { lastSyncTime } = get();
    if (!lastSyncTime) return true;

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return lastSyncTime < oneHourAgo;
  },
}));

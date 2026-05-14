import { useEffect, useCallback } from 'react';
import { useCredentialsStore } from '@state/zustand/credentialsStore';
import { useAuth } from './useAuth';

/**
 * useCredentials Hook
 * Provides credentials vault state and methods to React components
 * 
 * Usage:
 * const { 
 *   credentials, 
 *   isLoading, 
 *   search, 
 *   createCredential,
 *   deleteCredential 
 * } = useCredentials();
 */

export const useCredentials = () => {
  const { isAuthenticated } = useAuth();
  const {
    credentials,
    filteredCredentials,
    isLoading,
    isSyncing,
    error,
    searchQuery,
    selectedDomain,
    lastSyncTime,
    fetchCredentials,
    searchCredentials,
    filterByDomain,
    getCredentialsByDomain,
    createCredential,
    updateCredential,
    deleteCredential,
    syncVault,
    needsSync,
  } = useCredentialsStore();

  // Fetch credentials when authenticated
  useEffect(() => {
    if (isAuthenticated && credentials.length === 0) {
      fetchCredentials();
    }
  }, [isAuthenticated, fetchCredentials, credentials.length]);

  // Auto-sync vault if needed
  useEffect(() => {
    if (isAuthenticated && needsSync()) {
      syncVault();
    }
  }, [isAuthenticated, syncVault, needsSync]);

  const handleSearch = useCallback(
    (query) => {
      searchCredentials(query);
    },
    [searchCredentials]
  );

  const handleFilterByDomain = useCallback(
    (domain) => {
      filterByDomain(domain);
    },
    [filterByDomain]
  );

  const handleCreateCredential = useCallback(
    async (credentialData) => {
      return await createCredential(credentialData);
    },
    [createCredential]
  );

  const handleUpdateCredential = useCallback(
    async (id, updates) => {
      return await updateCredential(id, updates);
    },
    [updateCredential]
  );

  const handleDeleteCredential = useCallback(
    async (id) => {
      return await deleteCredential(id);
    },
    [deleteCredential]
  );

  const handleSync = useCallback(async () => {
    return await syncVault();
  }, [syncVault]);

  return {
    // State
    credentials,
    filteredCredentials,
    isLoading,
    isSyncing,
    error,
    searchQuery,
    selectedDomain,
    lastSyncTime,

    // Methods
    search: handleSearch,
    filterByDomain: handleFilterByDomain,
    getCredentialsByDomain,
    create: handleCreateCredential,
    update: handleUpdateCredential,
    delete: handleDeleteCredential,
    sync: handleSync,
    refetch: fetchCredentials,
    needsSync,
  };
};

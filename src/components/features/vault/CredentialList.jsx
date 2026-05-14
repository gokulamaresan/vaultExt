import React from 'react';
import { useCredentials } from '@hooks/useCredentials';
import { Button } from '@components/common/Button';
import { CredentialCard } from './CredentialCard';
import { SearchBar } from './SearchBar';
import { Loading } from '@components/common/Loading';
import './CredentialList.css';

export const CredentialList = () => {
  const {
    filteredCredentials,
    isLoading,
    isSyncing,
    error,
    search,
    sync,
    delete: deleteCredential,
    needsSync,
  } = useCredentials();

  const handleAutoFill = async (credential) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'INJECT_CREDENTIALS',
        payload: credential,
      });
      // Handle response if necessary
      return response;
    } catch (messageError) {
      console.error('Auto-fill message failed:', messageError);
    }
  };

  const handleDelete = async (id) => {
    await deleteCredential(id);
  };

  if (isLoading) {
    return <Loading text="Loading vault..." />;
  }

  return (
    <div className="credential-list-container">
      <div className="credential-list-header">
        <SearchBar onSearch={search} />
        <Button variant="secondary" onClick={sync} loading={isSyncing}>
          {needsSync() ? 'Sync Vault' : 'Refresh'}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="credential-list-grid">
        {filteredCredentials.length === 0 ? (
          <div className="empty-state">
            <p>No saved credentials found.</p>
          </div>
        ) : (
          filteredCredentials.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              onAutoFill={() => handleAutoFill(credential)}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

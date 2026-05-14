import React from 'react';
import { PopupLayout } from '@components/layout/PopupLayout';
import { CredentialList } from '@components/features/vault/CredentialList';
import { useAuth } from '@hooks/useAuth';
import './VaultPage.css';

export const VaultPage = () => {
  const { user, logout } = useAuth();

  return (
    <PopupLayout
      header={
        <div className="vault-header">
          <div>
            <h2>VaultGuard</h2>
            <p className="vault-subtitle">Welcome back, {user?.name || 'User'}</p>
          </div>
          <button className="vault-logout" onClick={logout}>
            Logout
          </button>
        </div>
      }
      footer={
        <div className="vault-footer">
          <span>Securely manage credentials and autofill across websites.</span>
        </div>
      }
    >
      <CredentialList />
    </PopupLayout>
  );
};

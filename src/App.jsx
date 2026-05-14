import React from 'react';
import { useAuth } from '@hooks/useAuth';
import { LoginForm } from '@components/features/auth/LoginForm';
import { VaultPage } from '@pages/VaultPage';
import { Loading } from '@components/common/Loading';
import '@styles/global.css';

export const App = () => {
  const { isAuthenticated, isCheckingAuth, checkAuth } = useAuth();

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <Loading text="Checking session..." />;
  }

  return <div className="app-shell">{isAuthenticated ? <VaultPage /> : <LoginForm />}</div>;
};

export default App;

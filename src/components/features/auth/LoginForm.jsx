import React, { useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@state/zustand/authStore';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Loading } from '@components/common/Loading';
import './LoginForm.css';

/**
 * LoginForm Component
 * Handles user authentication in premium White & Blue Theme
 */
export const LoginForm = ({ onSuccess }) => {
  // Local form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [customError, setCustomError] = useState(null);

  // Auth hook
  const { isLoading: isHookLoading, error: authError } = useAuth();
  const isLoading = isLocalLoading || isHookLoading;
  const displayedError = customError || authError;

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    const errors = {};

    if (!email || email.trim() === '') {
      errors.email = 'Please enter your username or email';
    }

    if (!password || password.length < 4) {
      errors.password = 'Please enter your password';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission directly in UI using dummy credentials
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate first
    if (!validateForm()) {
      return;
    }

    // Clear previous errors
    setValidationErrors({});
    setCustomError(null);
    setIsLocalLoading(true);

    // Simulate premium micro-animation loading delay
    setTimeout(() => {
      setIsLocalLoading(false);

      // Handle authentication in UI itself
      const cleanEmail = email.toLowerCase().trim();
      const isValidUser =
        (cleanEmail === '20240360' && password === 'TDX0963') ||
        ((cleanEmail === 'demo@vaultguard.com' || cleanEmail === 'admin@vaultguard.com') &&
          password === 'password123');

      if (isValidUser) {
        // Clear password from memory
        setPassword('');

        // Directly update the zustand store to bypass API calls
        useAuthStore.setState({
          user: {
            id: cleanEmail === '20240360' ? 'usr_20240360' : 'usr_demo_123',
            name: cleanEmail === '20240360' ? 'Gokul (20240360)' : 'Demo User',
            email: cleanEmail === '20240360' ? '20240360@sky.internal' : cleanEmail,
            role: 'admin',
          },
          token: 'demo_jwt_token_vaultguard_chrome_ext',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Notify parent
        onSuccess?.();
      } else {
        setCustomError('Invalid credentials. Please use the preset demo username and password provided below.');
        setPassword('');
      }
    }, 500);
  };

  /**
   * Autofill Preset Credentials
   */
  const handleAutoFill = () => {
    setEmail('20240360');
    setPassword('TDX0963');
    setValidationErrors({});
    setCustomError(null);
  };

  /**
   * Handle username/email change
   */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (customError) setCustomError(null);
    if (validationErrors.email) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated.email;
        return updated;
      });
    }
  };

  /**
   * Handle password change
   */
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (customError) setCustomError(null);
    if (validationErrors.password) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated.password;
        return updated;
      });
    }
  };

  // Show loading state
  if (isLoading && !isLocalLoading) {
    return <Loading text="Signing in..." />;
  }

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        {/* Header with Premium Blue Shield Icon */}
        <div className="login-header">
          <div className="login-logo-container">
            <svg
              className="login-logo"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="login-title">VaultGuard</h1>
          <p className="login-subtitle">Sign in to your vault</p>
        </div>

        {/* Demo Credentials Helper Card */}
        <div className="demo-credentials-card">
          <div className="demo-badge">
            <span>Preset Credentials</span>
            <span style={{ fontSize: '10px', opacity: 0.8 }}>Target: sky:366</span>
          </div>
          <div className="demo-row">
            <span>Username:</span>
            <span className="demo-value">20240360</span>
          </div>
          <div className="demo-row">
            <span>Password:</span>
            <span className="demo-value">TDX0963</span>
          </div>
          <button
            type="button"
            className="btn-autofill"
            onClick={handleAutoFill}
            title="Click to automatically fill preset credentials"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Auto-fill Credentials
          </button>
        </div>

        {/* Username/Email Input */}
        <Input
          label="Username or Email"
          type="text"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter username"
          error={validationErrors.email}
          disabled={isLoading}
          autoComplete="username"
          required
        />

        {/* Password Input */}
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="••••••••"
          error={validationErrors.password}
          disabled={isLoading}
          autoComplete="current-password"
          required
        />

        {/* Auth Error Message */}
        {displayedError && (
          <div className="error-message" role="alert">
            {displayedError}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading || !email || !password}
          className="login-submit-btn"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
};



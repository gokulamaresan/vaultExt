import React, { useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Loading } from '@components/common/Loading';
import './LoginForm.css';

/**
 * LoginForm Component
 * Handles user authentication
 * 
 * Features:
 * - Email/password input validation
 * - Login with error handling
 * - Loading state feedback
 * - Secure password handling
 */

export const LoginForm = ({ onSuccess }) => {
  // Local form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Auth hook
  const { login, isLoading, error: authError } = useAuth();

  /**
   * Validate form inputs
   */
  const validateForm = () => {
    const errors = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate first
    if (!validateForm()) {
      return;
    }

    // Clear previous errors
    setValidationErrors({});

    // Attempt login
    const result = await login(email, password);

    if (result.success) {
      // Clear password from memory
      setPassword('');

      // Notify parent
      onSuccess?.();
    } else {
      // Show error (handled by hook's error state)
      // Password is kept in state only for this cycle
      setPassword('');
    }
  };

  /**
   * Handle email change
   */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear email error when user starts typing
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
    // Clear password error when user starts typing
    if (validationErrors.password) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated.password;
        return updated;
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return <Loading text="Signing in..." />;
  }

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        {/* Header */}
        <div className="login-header">
          <h1 className="login-title">Welcome to VaultGuard</h1>
          <p className="login-subtitle">Secure password manager for Chrome</p>
        </div>

        {/* Email Input */}
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="you@example.com"
          error={validationErrors.email}
          disabled={isLoading}
          autoComplete="email"
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
        {authError && (
          <div className="error-message" role="alert">
            {authError}
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
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* Footer Links */}
        <div className="login-footer">
          <p className="login-text">
            Don't have an account?{' '}
            <a href="#signup" className="login-link">
              Sign up
            </a>
          </p>
          <p className="login-text">
            <a href="#forgot" className="login-link">
              Forgot password?
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

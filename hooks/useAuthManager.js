// src/hooks/useAuthManager.js
import { useState } from 'react';
import {
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

export const useAuthManager = (authInstance) => {
  const [authError, setAuthError] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const login = async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(authInstance, email, password);
      return { success: true };
    } catch (error) {
      let message = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password.';
      }
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(authInstance, email, password);
      return { success: true };
    } catch (error) {
      let message = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      }
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const resetPassword = async (email) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      console.log('Attempting to send password reset email to', email);
      const res = await fetch('/api/sendPasswordResetEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        let msg = 'Failed to send password reset email.';
        try {
          const data = await res.json();
          if (data && data.error) msg = data.error;
        } catch (_) { /* ignore */ }
        throw new Error(msg);
      }
      console.log('Password reset email request sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Password reset request failed:', error);
      let message = error.message || 'Failed to send password reset email.';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      await signOut(authInstance);
      return { success: true };
    } catch (error) {
      const message = `Logout failed: ${error.message}`;
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return {
    authError,
    isLoadingAuth,
    login,
    register,
    resetPassword,
    logout
  };
};

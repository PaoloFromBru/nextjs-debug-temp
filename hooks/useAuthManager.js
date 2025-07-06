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
    logout
  };
};

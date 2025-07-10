'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import AlertMessage from './AlertMessage';
import PasswordResetModal from './PasswordResetModal';

const AuthModal = ({
  isOpen,
  onClose,
  isRegister,
  setIsRegister,
  onLogin,
  onRegister,
  onPasswordReset,
  error,
  loading
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  // Reset fields when the modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setLocalError('');
      setShowResetModal(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password should be at least 6 characters.');
      return;
    }

    try {
      if (isRegister) {
        await onRegister(email, password);
      } else {
        await onLogin(email, password);
      }
      // on success: close modal and reset to login mode
      setIsRegister(false);
      onClose();
    } catch {
      // parent will surface `error`
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isRegister ? 'Register' : 'Login'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(localError || error) && (
          <AlertMessage
            message={localError || error}
            type="error"
            onDismiss={() => setLocalError('')}
          />
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
            required
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md border border-slate-300 dark:border-slate-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              isRegister ? 'Register' : 'Login'
            )}
          </button>
        </div>
      </form>
      <p className="mt-4 text-center text-sm">
        {isRegister ? (
          <>
            Already have an account?{' '}
            <button onClick={() => setIsRegister(false)} className="text-red-600 hover:underline">
              Login
            </button>
          </>
        ) : (
          <>
            New here?{' '}
            <button onClick={() => setIsRegister(true)} className="text-red-600 hover:underline">
              Register
            </button>
            <br />
            <button onClick={() => setShowResetModal(true)} className="text-red-600 hover:underline mt-2">
              Forgot password?
            </button>
          </>
        )}
      </p>
      {showResetModal && (
        <PasswordResetModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onReset={onPasswordReset}
        />
      )}
    </Modal>
  );
};

export default AuthModal;

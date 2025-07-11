'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import AlertMessage from './AlertMessage';

const PasswordResetModal = ({ isOpen, onClose, onReset, loading = false }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setMessage('');
      setType('info');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Password reset form submitted for', email);
    if (!email) {
      setMessage('Email is required.');
      setType('error');
      return;
    }
    setMessage('Sending password reset email...');
    setType('info');
    const res = await onReset(email);
    if (res?.success) {
      setMessage(`If an account exists for ${email}, a reset link has been sent.`);
      setType('success');
    } else {
      setMessage(res.error || 'Failed to send reset email.');
      setType('error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <AlertMessage
            message={message}
            type={type}
            onDismiss={() => setMessage('')}
          />
        )}
        <div>
          <label htmlFor="resetEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            type="email"
            id="resetEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PasswordResetModal;

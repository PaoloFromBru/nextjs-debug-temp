"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import AlertMessage from "./AlertMessage";

const EmailVerificationModal = ({
  isOpen,
  onClose,
  onVerify,
  error,
  message,
}) => {
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setCode("");
      setLocalError("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");
    if (!code) {
      setLocalError("Verification code is required.");
      return;
    }
    onVerify(code);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify Email">
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && <AlertMessage message={message} type="info" />}
        {!message && (
          <AlertMessage
            message="Enter the 6-digit code we just emailed. If you don't see it, check your spam folder or close this window and try registering again."
            type="info"
          />
        )}
        {(localError || error) && (
          <AlertMessage
            message={localError || error}
            type="error"
            onDismiss={() => setLocalError("")}
          />
        )}
        <div>
          <label
            htmlFor="verificationCode"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Verification Code
          </label>
          <input
            type="text"
            id="verificationCode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
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
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Verify
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EmailVerificationModal;

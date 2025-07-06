// /components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 8, className = '' }) => {
  const spinnerSize = `h-${size} w-${size}`;
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-4 border-t-transparent border-slate-500 dark:border-slate-300 ${spinnerSize}`}
      />
    </div>
  );
};

export default LoadingSpinner;

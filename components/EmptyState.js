'use client';

import React from 'react';
import { Sparkles } from 'lucide-react'; // You can replace with another icon if needed

const EmptyState = ({ title = "Nothing here yet", subtitle = "Add something to get started." }) => {
  return (
    <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <Sparkles className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
      <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
};

export default EmptyState;

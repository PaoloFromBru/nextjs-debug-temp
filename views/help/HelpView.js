'use client';

import React from 'react';

const QuestionMarkCircleIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
  </svg>
);

const HelpView = () => {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center space-x-2">
        <QuestionMarkCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <span>Welcome to My Wine Cellar App!</span>
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        This app helps you manage your wine collection, track experienced wines, and find food pairings.
      </p>

      <div className="space-y-6">
        {[
          {
            title: 'My Cellar',
            points: [
              'View all wines currently in your collection.',
              'Use the search bar to find specific wines by producer, region, year, etc.',
              'Click "Add New Wine" to manually enter new bottles into your cellar.',
              'Edit existing wine details by clicking on the wine card.',
              'In Edit, use the "Cellar" dropdown to move a single wine to another cellar.',
              'Move wines to "Experienced Wines" once consumed, adding tasting notes and a rating.',
            ]
          },
          {
            title: 'Drink Soon',
            points: [
              'See wines that are approaching or have passed their optimal drinking window based on the "Drinking Window" years you entered.',
              'Helps you decide which wines to enjoy next before they lose their quality.',
            ]
          },
          {
            title: 'Food Pairing',
            points: [
              'Explore food pairing suggestions for your wines using AI.',
              'Find wines from your cellar that pair well with a specific food item.',
            ]
          },
          {
            title: 'Settings (Cellars & Import/Export)',
            points: [
              '**Import Wines:** Upload a CSV file to add multiple wines to your cellar at once. Refer to the expected CSV headers for formatting.',
              '**Cellars:** Add multiple cellars (e.g., Belgium, Brussels), select the active one to scope search, Drink Soon, pairing, and exports.',
              '**Bulk Move Wines:** Move ALL wines (including experienced wines) from one cellar to another. Choosing "Default" as source also includes legacy bottles without a cellar tag.',
              '**Export Wines:** Download your active cellar or experienced wines data as a CSV file for backup or external use.',
              '**Danger Zone:** Permanently erase all wines from your active cellar (use with caution!).',
            ]
          },
          {
            title: 'Experienced Wines',
            points: [
              'View wines you have already consumed, along with your tasting notes and ratings.',
              'Helps you keep a record of your tasting experiences.',
              'You can permanently delete experienced wine entries here.',
            ]
          },
          {
            title: 'Login / Register',
            points: [
              'Create an account or log in to save your wine cellar data securely.',
              'Your data is linked to your user account, allowing you to access it from any device.',
            ]
          }
        ].map(({ title, points }, index) => (
          <div key={index}>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">{title}</h3>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
              {points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpView;

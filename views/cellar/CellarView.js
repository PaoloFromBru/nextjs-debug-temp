// src/views/cellar/CellarView.js
'use client';

import React from 'react';
import WineItem from '@/components/WineItem';
import AddWineButton from '@/components/AddWineButton';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';

const CellarView = ({
  wines = [],
  isLoading = false, // ✅ Accept isLoading prop
  isLoadingAction,
  handleOpenWineForm,
  confirmExperienceWine,
  handleOpenFoodPairing,
}) => {
  const allWines = wines;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">My Wine Cellar</h1>
        {/* Pass an empty object so the modal opens for adding a new wine */}
        <AddWineButton onAdd={() => handleOpenWineForm({})} />
      </div>

      {(isLoading || isLoadingAction) && (
        <div className="flex justify-center mb-6">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && allWines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allWines.map((wine) => (
            <WineItem
              key={wine.id}
              wine={wine}
              onEdit={() => handleOpenWineForm(wine)}
              onExperience={() => confirmExperienceWine(wine)}
              onPairFood={() => handleOpenFoodPairing(wine)}
            />
          ))}
        </div>
      ) : !isLoading && (
        <EmptyState message="Your cellar is empty. Add a wine to get started!" />
      )}
    </div>
  );
};

export default CellarView;

'use client';

import React, { useEffect, useMemo } from 'react';
import WineItem from '@/components/WineItem';
import WineFormModal from '@/components/WineFormModal';
import ExperienceWineModal from '@/components/ExperienceWineModal';
import FoodPairingModal from '@/components/FoodPairingModal';
import AlertMessage from '@/components/AlertMessage';

// --- Icons ---
const ClockIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const DrinkSoonView = ({
  wines = [],
  handleOpenWineForm,
  confirmExperienceWine,
  handleOpenFoodPairing,
  error,
  setError,
  isLoadingAction,
  // Modal control from parent
  wineFormOpen,
  onWineFormClose,
  experienceOpen,
  onExperienceClose,
  foodPairingOpen,
  onFoodPairingClose,
  // Selected items passed by parent
  selectedWine,
  selectedExperienceWineId,
  selectedPairingWine,
}) => {
  // Compute wines approaching end based on drinkingWindowEndYear
  const winesApproachingEnd = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return wines.filter(wine => {
      const end = wine.drinkingWindowEndYear;
      return typeof end === 'number' && end <= currentYear;
    });
  }, [wines]);

  useEffect(() => {
    console.debug('DEBUG DrinkSoonView - winesApproachingEnd:', winesApproachingEnd);
  }, [winesApproachingEnd]);

  return (
    <>
      {winesApproachingEnd.length > 0 ? (
        <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow border border-yellow-200 dark:border-yellow-700">
          <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center space-x-2">
            <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <span>Drink Soon! Wines Requiring Attention</span>
          </h2>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
            These wines are past or approaching their ideal drinking window.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {winesApproachingEnd.map(wine => (
              <WineItem
                key={wine.id}
                wine={wine}
                onEdit={() => handleOpenWineForm(wine)}
                onExperience={() => confirmExperienceWine(wine.id)}
                onPairFood={() => handleOpenFoodPairing(wine)}
                loading={isLoadingAction}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow-md mt-6">
          <ClockIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-200">No wines requiring immediate attention!</h3>
          <p className="text-slate-500 dark:text-slate-400">All wines are currently within their drinking window.</p>
        </div>
      )}

      {/* Modals (controlled by parent) */}
      <WineFormModal
        isOpen={wineFormOpen}
        onClose={onWineFormClose}
        wine={selectedWine}
        loading={isLoadingAction}
      />
      <ExperienceWineModal
        isOpen={experienceOpen}
        onClose={onExperienceClose}
        wineId={selectedExperienceWineId}
        loading={isLoadingAction}
      />
      <FoodPairingModal
        isOpen={foodPairingOpen}
        onClose={onFoodPairingClose}
        wine={selectedPairingWine}
      />

      <AlertMessage error={error} onClose={() => setError(null)} />
    </>
  );
};

export default DrinkSoonView;

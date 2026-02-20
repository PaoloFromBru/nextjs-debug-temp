'use client';

import React, { useEffect, useState } from 'react';
import ExperiencedWineItem from '@/components/ExperiencedWineItem';
import { useFirebaseData, useWineActions } from '@/hooks';
import EditExperiencedWineModal from '@/components/EditExperiencedWineModal';
import AlertMessage from '@/components/AlertMessage';

// --- Icons ---
const CheckCircleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const ExperiencedWinesView = ({ experiencedWines: experiencedWinesProp, onDelete }) => {
  const {
    db,
    user,
    appId,
    experiencedWines,
    wines: cellarWines,
    dataError
  } = useFirebaseData();

  const [error, setError] = useState(null);
  const [wineToEdit, setWineToEdit] = useState(null);

  const { isLoadingAction, deleteExperiencedWine, handleUpdateExperiencedWine, handleRestoreExperiencedWine } = useWineActions(db, user?.uid, appId, setError);

  const winesList = experiencedWinesProp || experiencedWines;
  const handleDelete = onDelete || ((id) => deleteExperiencedWine(id));

  useEffect(() => {
    console.log("DEBUG: Experienced wines received:", winesList.map(w => ({ id: w.id, name: w.name || w.producer })));
  }, [winesList]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Experienced Wines</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Total Wines: {winesList.length}
      </p>

      {winesList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {winesList.map(wine => (
            <ExperiencedWineItem
              key={wine.id}
              wine={wine}
              onDelete={() => handleDelete(wine.id)}
              onEdit={() => setWineToEdit(wine)}
              loading={isLoadingAction}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow-md mt-6">
          <CheckCircleIcon className="w-6 h-6 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-200">No experienced wines yet.</h3>
          <p className="text-slate-500 dark:text-slate-400">When you drink a wine, it will appear here!</p>
        </div>
      )}

      <AlertMessage
        message={dataError || error}
        type="error"
        onDismiss={() => setError(null)}
      />
      {wineToEdit && (
        <EditExperiencedWineModal
          isOpen
          wine={wineToEdit}
          onClose={() => setWineToEdit(null)}
          onSubmit={async data => {
            const res = await handleUpdateExperiencedWine(wineToEdit.id, data);
            if (res?.success) setWineToEdit(null);
          }}
          onMoveBack={async data => {
            const res = await handleRestoreExperiencedWine(
              wineToEdit.id,
              { ...data, cellarId: wineToEdit.cellarId },
              cellarWines
            );
            if (res?.success) setWineToEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default ExperiencedWinesView;

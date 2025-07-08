'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { auth } from '@/lib/firebaseClient';
import { useAuthManager } from '@/hooks/useAuthManager';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import useFoodPairingAI from '@/hooks/useFoodPairingAI';
import useWineActions from '@/hooks/useWineActions';
import CellarView from '@/views/cellar/CellarView';
import DrinkSoonView from '@/views/DrinkSoonView/DrinkSoonView';
import ExperiencedWinesView from '@/views/experienced/ExperiencedWinesView';
import ImportExportView from '@/views/importExport/ImportExportView';
import FoodPairingView from '@/views/pairing/FoodPairingView';
import HelpView from '@/views/help/HelpView';
import WineFormModal from '@/components/WineFormModal';
import ExperienceWineModal from '@/components/ExperienceWineModal';
import FoodPairingModal from '@/components/FoodPairingModal';
import ReverseFoodPairingModal from '@/components/ReverseFoodPairingModal';
import AuthModal from '@/components/AuthModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';
import { parseCsv, exportToCsv } from '@/utils';

export default function HomePage() {
  // UI state
  const [view, setView] = useState('cellar');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportStatus, setCsvImportStatus] = useState({ message: '', type: '', errors: [] });
  const [foodForReversePairing, setFoodForReversePairing] = useState('');
  const [wineToEdit, setWineToEdit] = useState(null);
  const [wineToExperience, setWineToExperience] = useState(null);
  const [pairingWine, setPairingWine] = useState(null);
  const [pairingSuggestion, setPairingSuggestion] = useState('');
  const [isLoadingPairing, setIsLoadingPairing] = useState(false);
  const [showReversePairingModal, setShowReversePairingModal] = useState(false);

  // Auth
  const { authError, isLoadingAuth, login, register, logout } = useAuthManager(auth);

  // Data
  const { user, isAuthReady, wines, experiencedWines, isLoadingData, dataError, db, appId } = useFirebaseData();

  // Compute soon-to-drink
  const winesApproachingEnd = useMemo(() => {
    const current = new Date().getFullYear();
    return wines.filter(w => w.drinkingWindowEndYear && w.drinkingWindowEndYear <= current);
  }, [wines]);

  // Reverse pairing AI
  const { callGeminiProxy: findWineForFood, response: reversePairing, loading: isLoadingAI, error: pairingError } = useFoodPairingAI();

  // CRUD actions
  const {
    handleAddWine,
    handleUpdateWine,
    handleExperienceWine,
    handleDeleteWine,
    handleDeleteExperiencedWine,
    handleEraseAllWines,
    isLoadingAction,
    actionError,
    setActionError
  } = useWineActions(db, user?.uid, appId, msg => setCsvImportStatus({ message: msg, type: 'error', errors: [] }));

  // Global error
  const globalError = dataError || authError || actionError || pairingError;

  // CSV import/export
  const handleImportCsv = async () => {
    if (!csvFile) return;
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const { data: parsed } = parseCsv(e.target.result);
        for (const w of parsed) await handleAddWine(w, wines);
        setCsvImportStatus({ message: 'Imported successfully!', type: 'success', errors: [] });
      } catch (err) {
        setCsvImportStatus({ message: err.message, type: 'error', errors: [] });
      }
    };
    reader.readAsText(csvFile);
  };
  const handleExportCsv = () => exportToCsv(wines, 'my_cellar.csv');
  const handleExportExperiencedCsv = () => exportToCsv(experiencedWines, 'experienced_wines.csv');

  const handleFindWineForFood = async () => {
    setShowReversePairingModal(true);
    await findWineForFood(foodForReversePairing, wines);
  };

  const fetchFoodPairing = async (wine) => {
    if (!wine) return;
    setIsLoadingPairing(true);
    setPairingSuggestion('');
    try {
      const prompt = `Suggest 1-3 foods that would pair well with the wine: ${wine.producer} ${wine.name ? '(' + wine.name + ')' : ''} ${wine.region} ${wine.year || ''}.`;
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const output = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestion available.';
      setPairingSuggestion(output);
    } catch (err) {
      setPairingSuggestion(`Error: ${err.message}`);
    } finally {
      setIsLoadingPairing(false);
    }
  };

  // Loading state
  if (isLoadingAuth || !isAuthReady || isLoadingData) {
    return (
      <div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 shadow">
        <h1 className="text-3xl font-bold">My Wine Cellar</h1>
        <div className="flex items-center space-x-4">
          {user?.email && <span className="text-sm text-gray-700 dark:text-gray-300">{user.email}</span>}
          {user ? (
            <button onClick={logout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">
              Logout
            </button>
          ) : (
            <button onClick={() => { setShowAuthModal(true); setIsRegister(false); }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">
              Login
            </button>
          )}
        </div>
      </header>

      {/* Error Banner */}
      {globalError && <AlertMessage message={globalError} type="error" onDismiss={() => {}} />}

      {/* Navigation */}
      <nav className="flex space-x-2 p-4 bg-white dark:bg-slate-800">
        {[
          ['cellar','Cellar'],
          ['drinksoon','Drink Soon'],
          ['experienced','Experienced'],
          ['pairing','Food Pairing'],
          ['importExport','Import/Export'],
          ['help','Help']
        ].map(([key,label]) => (
          <button key={key} onClick={() => setView(key)} className={`px-3 py-1 rounded ${view===key?'bg-blue-600 text-white':'bg-gray-200 dark:bg-slate-700'}`}>{label}</button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="p-6 space-y-10">
        {view==='cellar' && (
          <CellarView
            wines={wines}
            isLoadingAction={isLoadingAction}
            handleOpenWineForm={wine => setWineToEdit(wine)}
            confirmExperienceWine={wine => setWineToExperience(wine)}
            handleOpenFoodPairing={wine => setPairingWine(wine)}
          />
        )}
        {view==='drinksoon' && (
          <DrinkSoonView
            // ◀ PASS the full list
            wines={wines}
            // callbacks to open modal or trigger actions
            handleOpenWineForm={wine => setWineToEdit(wine)}
            confirmExperienceWine={wine => setWineToExperience(wine)}
            handleOpenFoodPairing={wine => setPairingWine(wine)}
            isLoadingAction={isLoadingAction}
            error={actionError}
            setError={setActionError}
			/>
        )}
        {view==='experienced' && (
          <ExperiencedWinesView
            experiencedWines={experiencedWines}
            onDelete={handleDeleteExperiencedWine}
          />
        )}
        {view==='pairing' && (
          <FoodPairingView
            foodForReversePairing={foodForReversePairing}
            setFoodForReversePairing={setFoodForReversePairing}
            handleFindWineForFood={handleFindWineForFood}
            isLoadingReversePairing={isLoadingAI}
            wines={wines}
          />
        )}
        {view==='importExport' && (
          <ImportExportView
            csvFile={csvFile}
            handleCsvFileChange={e=>setCsvFile(e.target.files[0])}
            handleImportCsv={handleImportCsv}
            isImportingCsv={isLoadingAction}
            csvImportStatus={csvImportStatus}
            setCsvImportStatus={setCsvImportStatus}
            wines={wines}
            experiencedWines={experiencedWines}
            handleExportCsv={handleExportCsv}
            handleExportExperiencedCsv={handleExportExperiencedCsv}
            confirmEraseAllWines={()=>window.confirm('Really erase all wines?')&&handleEraseAllWines()}
          />
        )}
        {view==='help' && <HelpView />}
      </main>

      {/* Modals */}
      {wineToEdit && (
        <WineFormModal
          isOpen
          onClose={()=>setWineToEdit(null)}
          wine={wineToEdit}
          onSubmit={async data => {
            const res = wineToEdit.id
              ? await handleUpdateWine(wineToEdit.id, data, wines)
              : await handleAddWine(data, wines);
            if (res?.success) setWineToEdit(null);
          }}
          allWines={wines}
        />
      )}
      {wineToExperience && (
        <ExperienceWineModal
          isOpen
          onClose={()=>setWineToExperience(null)}
          wine={wineToExperience}
          onExperience={(notes,rating,date) => handleExperienceWine(wineToExperience.id,notes,rating,date,wines)}
        />
      )}
      {pairingWine && (
        <FoodPairingModal
          isOpen
          onClose={() => { setPairingWine(null); setPairingSuggestion(''); }}
          wine={pairingWine}
          suggestion={pairingSuggestion}
          isLoading={isLoadingPairing}
          onFetchPairing={() => fetchFoodPairing(pairingWine)}
        />
      )}
      {showReversePairingModal && (
        <ReverseFoodPairingModal
          isOpen
          onClose={() => setShowReversePairingModal(false)}
          foodItem={foodForReversePairing}
          suggestion={reversePairing}
          isLoading={isLoadingAI}
        />
      )}
      {showAuthModal && (
        <AuthModal
          isOpen
          onClose={()=>setShowAuthModal(false)}
          isRegister={isRegister}
          setIsRegister={setIsRegister}
          onLogin={login}
          onRegister={register}
          error={authError}
          loading={isLoadingAuth}
        />
      )}
    </div>
  );
}

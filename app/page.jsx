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

// --- Local Icons ---

const UserIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const WineBottleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.252 2.262A2.25 2.25 0 0 0 5.254 4.24v11.517a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25V4.24a2.25 2.25 0 0 0-1.998-1.978A2.253 2.253 0 0 0 15 2.25H9c-1.014 0-1.881.676-2.172 1.622a2.24 2.24 0 0 1 .424-1.61ZM9 4.5h6M9 7.5h6m-6 3h6m-3.75 3h.008v.008h-.008V15Z" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const StarIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
);

const SparklesIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
);

const UploadIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const QuestionMarkCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
  </svg>
);

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
  const [searchTerm, setSearchTerm] = useState('');

  // Auth
  const { authError, isLoadingAuth, login, register, logout } = useAuthManager(auth);

  // Data
  const { user, isAuthReady, wines, experiencedWines, isLoadingData, dataError, db, appId } = useFirebaseData();

  // Compute soon-to-drink
  const winesApproachingEnd = useMemo(() => {
    const current = new Date().getFullYear();
    return wines.filter(w => w.drinkingWindowEndYear && w.drinkingWindowEndYear <= current);
  }, [wines]);

  const filteredWines = useMemo(() => {
    if (!searchTerm) return wines;
    const term = searchTerm.toLowerCase();
    return wines.filter(w =>
      [w.name, w.producer, w.region, w.color, w.location, w.year && String(w.year)]
        .filter(Boolean)
        .some(val => String(val).toLowerCase().includes(term))
    );
  }, [wines, searchTerm]);

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

  // Loading auth state
  if (isLoadingAuth || !isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="p-6 bg-white dark:bg-slate-800 shadow">
        <div className="flex items-center space-x-2 mb-2">
          <WineBottleIcon className="w-6 h-6 text-purple-600" />
          <h1 className="text-3xl font-bold">My Wine Cellar</h1>
        </div>
        <div className="flex items-center justify-between">
          {user?.email && (
            <div className="flex items-center space-x-1 mr-4 text-sm text-gray-700 dark:text-gray-300">
              <UserIcon />
              <span>{user.email}</span>
            </div>
          )}
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
      <nav className="flex space-x-2 p-4 bg-white dark:bg-slate-800 overflow-x-auto whitespace-nowrap">
        {[
          ['cellar','Cellar', WineBottleIcon],
          ['drinksoon','Drink Soon', ClockIcon],
          ['experienced','Experienced', StarIcon],
          ['pairing','Food Pairing', SparklesIcon],
          ['importExport','Import/Export', UploadIcon],
          ['help','Help', QuestionMarkCircleIcon]
        ].map(([key,label,Icon]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-3 py-1 rounded flex items-center space-x-1 ${view===key?'bg-blue-600 text-white':'bg-gray-200 dark:bg-slate-700'}`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {(view==='cellar' || view==='drinksoon') && (
        <div className="p-4 bg-white dark:bg-slate-800">
          <input
            type="text"
            placeholder="Search wines..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-md p-2 border border-slate-300 dark:border-slate-600 rounded focus:outline-none"
          />
        </div>
      )}

      {/* Main Content */}
      <main className="p-6 space-y-10">
        {view==='cellar' && (
          <CellarView
            wines={filteredWines}
            isLoading={isLoadingData}
            isLoadingAction={isLoadingAction}
            handleOpenWineForm={wine => setWineToEdit(wine)}
            confirmExperienceWine={wine => setWineToExperience(wine)}
            handleOpenFoodPairing={wine => setPairingWine(wine)}
          />
        )}
        {view==='drinksoon' && (
          <DrinkSoonView
            // ◀ PASS the full list
            wines={filteredWines}
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
            goToCellar={() => setView('cellar')}
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

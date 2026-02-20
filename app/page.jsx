"use client";

import React, { useState, useEffect, useMemo } from "react";
import { auth } from "@/lib/firebaseClient";
import { useAuthManager } from "@/hooks/useAuthManager";
import { useFirebaseData } from "@/hooks/useFirebaseData";
import useFoodPairingAI from "@/hooks/useFoodPairingAI";
import useWineActions from "@/hooks/useWineActions";
import CellarView from "@/views/cellar/CellarView";
import DrinkSoonView from "@/views/DrinkSoonView/DrinkSoonView";
import ExperiencedWinesView from "@/views/experienced/ExperiencedWinesView";
import ImportExportView from "@/views/importExport/ImportExportView";
import FoodPairingView from "@/views/pairing/FoodPairingView";
import HelpView from "@/views/help/HelpView";
import WineFormModal from "@/components/WineFormModal";
import ExperienceWineModal from "@/components/ExperienceWineModal";
import FoodPairingModal from "@/components/FoodPairingModal";
import useCellars from "@/hooks/useCellars";
import ReverseFoodPairingModal from "@/components/ReverseFoodPairingModal";
import AuthModal from "@/components/AuthModal";
import EmailVerificationModal from "@/components/EmailVerificationModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import AlertMessage from "@/components/AlertMessage";
import { parseCsv, exportToCsv } from "@/utils";

// --- Local Icons ---

const UserIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const WineBottleIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.252 2.262A2.25 2.25 0 0 0 5.254 4.24v11.517a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25V4.24a2.25 2.25 0 0 0-1.998-1.978A2.253 2.253 0 0 0 15 2.25H9c-1.014 0-1.881.676-2.172 1.622a2.24 2.24 0 0 1 .424-1.61ZM9 4.5h6M9 7.5h6m-6 3h6m-3.75 3h.008v.008h-.008V15Z"
    />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const StarIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
    />
  </svg>
);

const SparklesIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
    />
  </svg>
);

const UploadIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
    />
  </svg>
);

const QuestionMarkCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
    />
  </svg>
);

export default function HomePage() {
  // UI state
  const [view, setView] = useState("cellar");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [verificationError, setVerificationError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportStatus, setCsvImportStatus] = useState({
    message: "",
    type: "",
    errors: [],
  });
  const [foodForReversePairing, setFoodForReversePairing] = useState("");
  const [shoppingFood, setShoppingFood] = useState("");
  const [wineToEdit, setWineToEdit] = useState(null);
  const [wineToExperience, setWineToExperience] = useState(null);
  const [pairingWine, setPairingWine] = useState(null);
  const [pairingSuggestion, setPairingSuggestion] = useState("");
  const [isLoadingPairing, setIsLoadingPairing] = useState(false);
  const [showReversePairingModal, setShowReversePairingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Auth
  const { authError, isLoadingAuth, login, register, resetPassword, logout } =
    useAuthManager(auth);

  // Data
  const {
    user,
    isAuthReady,
    wines,
    experiencedWines,
    isLoadingData,
    dataError,
    db,
    appId,
  } = useFirebaseData();

  // Cellars: user-defined
  const {
    cellars,
    activeCellarId,
    setActiveCellarId,
    createCellar,
    deleteCellar,
  } = useCellars(db, user?.uid, appId);

  // Scope wines by active cellar
  const scopedWines = useMemo(() => {
    if (!activeCellarId) return wines;
    return wines.filter((w) => (w.cellarId || "default") === activeCellarId);
  }, [wines, activeCellarId]);

  const scopedExperiencedWines = useMemo(() => {
    if (!activeCellarId) return experiencedWines;
    return experiencedWines.filter((w) => (w.cellarId || "default") === activeCellarId);
  }, [experiencedWines, activeCellarId]);


  // Compute soon-to-drink
  const winesApproachingEnd = useMemo(() => {
    const current = new Date().getFullYear();
    return wines.filter(
      (w) => w.drinkingWindowEndYear && w.drinkingWindowEndYear <= current,
    );
  }, [wines]);

  const filteredWines = useMemo(() => {
  const base = scopedWines;
  if (!searchTerm) return base;
  const term = searchTerm.toLowerCase();
  return base.filter((w) => [
    w.name, w.producer, w.region, w.color, w.location, w.year && String(w.year),
  ].filter(Boolean).some((val) => String(val).toLowerCase().includes(term)));
}, [scopedWines, searchTerm]);

  // Reverse pairing AI
  const {
    callGeminiProxy: findWineForFood,
    response: reversePairing,
    loading: isLoadingAI,
    error: pairingError,
  } = useFoodPairingAI();

  // CRUD actions
  const {
    handleAddWine,
    handleUpdateWine,
    handleExperienceWine,
    handleDeleteWine,
    handleDeleteExperiencedWine,
    handleEraseAllWines,
    reassignCellar,
    isLoadingAction,
    actionError,
    setActionError,
  } = useWineActions(db, user?.uid, appId, (msg ) =>
    setCsvImportStatus({ message: msg, type: "error", errors: [] }),
    activeCellarId,
  );

  // Global error
  const globalError = dataError || authError || actionError || pairingError;

  const registerWithVerification = async (email, password) => {
    setVerificationError("");
    setVerificationMessage("");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const res = await fetch("/api/sendVerificationEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        let msg = "Failed to send verification email";
        try {
          const data = await res.json();
          if (data && data.error) msg = data.error;
        } catch (e) {
          // ignore JSON parse errors
        }
        throw new Error(msg);
      }
      setPendingRegistration({ email, password, code });
      setVerificationMessage(
        "Verification email sent. Please check your inbox and spam folder. If you don't see it soon, close this window and try registering again.",
      );
      setShowVerificationModal(true);
      return { success: true };
    } catch (err) {
      setVerificationError(
        `${err.message}. If you didn't get the email, double-check the address and try again.`,
      );
      return { success: false };
    }
  };

  const verifyCodeAndRegister = async (enteredCode) => {
    if (!pendingRegistration) return;
    if (enteredCode !== pendingRegistration.code) {
      setVerificationError("Incorrect verification code.");
      return;
    }
    const res = await register(
      pendingRegistration.email,
      pendingRegistration.password,
    );
    if (res?.success) {
      setShowVerificationModal(false);
      setPendingRegistration(null);
    } else {
      setVerificationError(
        `${res.error || "Registration failed."} If the problem persists, try requesting a new verification code.`,
      );
    }
  };

  // CSV import/export
  const handleImportCsv = async () => {
    if (!csvFile) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const { data: parsed } = parseCsv(e.target.result);
        for (const w of parsed) await handleAddWine(w, scopedWines);
        setCsvImportStatus({
          message: "Imported successfully!",
          type: "success",
          errors: [],
        });
      } catch (err) {
        setCsvImportStatus({ message: err.message, type: "error", errors: [] });
      }
    };
    reader.readAsText(csvFile);
  };
  const handleExportCsv = () => exportToCsv(scopedWines, "my_cellar.csv");
  const handleExportExperiencedCsv = () =>
    exportToCsv(scopedExperiencedWines, "experienced_wines.csv");

  const handleFindWineForFood = async () => {
    setShowReversePairingModal(true);
    await findWineForFood(foodForReversePairing, scopedWines);
  };
  const handleFindWineToBuy = async () => {
    setFoodForReversePairing(shoppingFood);
    setShowReversePairingModal(true);
    await findWineForFood(shoppingFood, []);
  };
  const fetchFoodPairing = async (wine) => {
    if (!wine) return;
    setIsLoadingPairing(true);
    setPairingSuggestion("");
    try {
      const prompt = `Suggest 1-3 foods that would pair well with the wine: ${wine.producer} ${wine.name ? "(" + wine.name + ")" : ""} ${wine.region} ${wine.year || ""}.`;
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const output =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No suggestion available.";
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
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
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
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => {
                setShowAuthModal(true);
                setIsRegister(false);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Error Banner */}
      {globalError && (
        <AlertMessage message={globalError} type="error" onDismiss={() => {}} />
      )}

      {/* Navigation */}
      <nav className="flex space-x-2 p-4 bg-white dark:bg-slate-800 overflow-x-auto whitespace-nowrap">
        {[
          ["cellar", "Cellar", WineBottleIcon],
          ["drinksoon", "Drink Soon", ClockIcon],
          ["experienced", "Experienced", StarIcon],
          ["pairing", "Food Pairing", SparklesIcon],
          ["importExport", "Settings", UploadIcon],
          ["help", "Help", QuestionMarkCircleIcon],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-3 py-1 rounded flex items-center space-x-1 ${view === key ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-slate-700"}`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {(view === "cellar" || view === "drinksoon") && (
        <div className="p-4 bg-white dark:bg-slate-800">
          <input
            type="text"
            placeholder="Search wines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md p-2 border border-slate-300 dark:border-slate-600 rounded focus:outline-none"
          />
        </div>
      )}

      {/* Main Content */}
      <main className="p-6 space-y-10">
        {view === "cellar" && (
          <CellarView
            wines={filteredWines}
            isLoading={isLoadingData}
            isLoadingAction={isLoadingAction}
            handleOpenWineForm={(wine) => setWineToEdit(wine)}
            confirmExperienceWine={(wine) => setWineToExperience(wine)}
            handleOpenFoodPairing={(wine) => setPairingWine(wine)}
          />
        )}
        {view === "drinksoon" && (
          <DrinkSoonView
            // ◀ PASS the full list
            wines={filteredWines}
            // callbacks to open modal or trigger actions
            handleOpenWineForm={(wine) => setWineToEdit(wine)}
            confirmExperienceWine={(wine) => setWineToExperience(wine)}
            handleOpenFoodPairing={(wine) => setPairingWine(wine)}
            isLoadingAction={isLoadingAction}
            error={actionError}
            setError={setActionError}
          />
        )}
        {view === "experienced" && (
          <ExperiencedWinesView
            experiencedWines={scopedExperiencedWines}
            onDelete={handleDeleteExperiencedWine}
          />
        )}
        {view === "pairing" && (
          <FoodPairingView
            foodForReversePairing={foodForReversePairing}
            setFoodForReversePairing={setFoodForReversePairing}
            handleFindWineForFood={handleFindWineForFood}
            shoppingFood={shoppingFood}
            setShoppingFood={setShoppingFood}
            handleFindWineToBuy={handleFindWineToBuy}
            isLoadingReversePairing={isLoadingAI}
            wines={scopedWines}
            goToCellar={() => setView("cellar")}
          />
        )}
        {view === "importExport" && (
          <ImportExportView
            cellars={cellars}
            activeCellarId={activeCellarId}
            setActiveCellarId={setActiveCellarId}
            onCreateCellar={createCellar}
            onDeleteCellar={deleteCellar}
            onReassignAll={async (fromId, toId) => {
              const res = await reassignCellar(fromId, toId);
              const msg = res?.success
                ? `Moved ${res.movedWines ?? 0} cellar wines and ${res.movedExperienced ?? 0} experienced wines from "${fromId}" to "${toId}".`
                : res?.error || 'Failed to move wines.';
              setCsvImportStatus({ message: msg, type: res?.success ? 'success' : 'error', errors: [] });
            }}
            csvFile={csvFile}
            handleCsvFileChange={(e) => setCsvFile(e.target.files[0])}
            handleImportCsv={handleImportCsv}
            isImportingCsv={isLoadingAction}
            csvImportStatus={csvImportStatus}
            setCsvImportStatus={setCsvImportStatus}
            wines={scopedWines}
            experiencedWines={scopedExperiencedWines}
            handleExportCsv={handleExportCsv}
            handleExportExperiencedCsv={handleExportExperiencedCsv}
            confirmEraseAllWines={async () => {
              if (!activeCellarId) {
                window.alert('Select a cellar first.');
                return;
              }
              const ok = window.confirm(`Erase ALL wines in cellar "${activeCellarId}"? This cannot be undone.`);
              if (ok) await handleEraseAllWines(activeCellarId);
            }}
          />
        )}
        {view === "help" && <HelpView />}
      </main>

      {/* Modals */}
      {wineToEdit && (
        <WineFormModal
          isOpen
          onClose={() => setWineToEdit(null)}
          wine={wineToEdit}
          cellars={cellars}
          activeCellarId={activeCellarId}
          onSubmit={async (data) => {
            const res = wineToEdit.id
              ? await handleUpdateWine(wineToEdit.id, data, scopedWines)
              : await handleAddWine(data, scopedWines);
            if (res?.success) setWineToEdit(null);
          }}
          allWines={scopedWines}
        />
      )}
      {wineToExperience && (
        <ExperienceWineModal
          isOpen
          onClose={() => setWineToExperience(null)}
          wine={wineToExperience}
          onExperience={async (notes, rating, date) => {
            const res = await handleExperienceWine(
              wineToExperience,
              notes,
              rating,
              date,
            );
            if (res?.success) setWineToExperience(null);
          }}
        />
      )}
      {pairingWine && (
        <FoodPairingModal
          isOpen
          onClose={() => {
            setPairingWine(null);
            setPairingSuggestion("");
          }}
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
          onClose={() => setShowAuthModal(false)}
          isRegister={isRegister}
          setIsRegister={setIsRegister}
          onLogin={login}
          onRegister={registerWithVerification}
          onPasswordReset={resetPassword}
          error={isRegister ? verificationError || authError : authError}
          loading={isLoadingAuth}
        />
      )}
      {showVerificationModal && (
        <EmailVerificationModal
          isOpen
          onClose={() => setShowVerificationModal(false)}
          onVerify={verifyCodeAndRegister}
          error={verificationError}
          message={verificationMessage}
        />
      )}
    </div>
  );
}

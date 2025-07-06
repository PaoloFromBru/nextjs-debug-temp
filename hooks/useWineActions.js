// hooks/useWineActions.js
import { useState } from 'react';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
  getDocs,
  query,
} from 'firebase/firestore';

export default function useWineActions(db, userId, appId, setError) {
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [actionError, setActionError] = useState(null);

  const winesCollectionPath = `artifacts/${appId}/users/${userId}/wines`;
  const experiencedWinesCollectionPath = `artifacts/${appId}/users/${userId}/experiencedWines`;

  const errorOut = (msg, err = null) => {
    if (err) console.error(msg, err);
    setError(msg);
    setActionError(msg);
    return { success: false, error: msg };
  };

  const handleAddWine = async (wineData, allWines) => {
    if (!db || !userId) return errorOut('Database not ready or user not logged in.');
    setIsLoadingAction(true);
    try {
      // safe-guard wineData
      const newLoc = String(wineData?.location || '').trim().toLowerCase();
      const isLocationTaken = allWines.some(
        w => String(w.location || '').trim().toLowerCase() === newLoc
      );
      if (isLocationTaken) return errorOut(`Location "${wineData.location}" is already in use.`);

      await addDoc(collection(db, winesCollectionPath), {
        ...wineData,
        year: wineData?.year ? parseInt(wineData.year, 10) : null,
        drinkingWindowStartYear: wineData?.drinkingWindowStartYear
          ? parseInt(wineData.drinkingWindowStartYear, 10)
          : null,
        drinkingWindowEndYear: wineData?.drinkingWindowEndYear
          ? parseInt(wineData.drinkingWindowEndYear, 10)
          : null,
        addedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (err) {
      return errorOut(`Failed to add wine: ${err.message}`, err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleUpdateWine = async (wineId, wineData, allWines) => {
    if (!db || !userId) return errorOut('Database not ready or user not logged in.');
    setIsLoadingAction(true);
    try {
      const newLoc = String(wineData?.location || '').trim().toLowerCase();
      const isLocationTaken = allWines.some(
        w =>
          w.id !== wineId &&
          String(w.location || '').trim().toLowerCase() === newLoc
      );
      if (isLocationTaken) return errorOut(`Location "${wineData.location}" is already in use by another wine.`);

      const wineDocRef = doc(db, winesCollectionPath, wineId);
      await updateDoc(wineDocRef, {
        ...wineData,
        year: wineData?.year ? parseInt(wineData.year, 10) : null,
        drinkingWindowStartYear: wineData?.drinkingWindowStartYear
          ? parseInt(wineData.drinkingWindowStartYear, 10)
          : null,
        drinkingWindowEndYear: wineData?.drinkingWindowEndYear
          ? parseInt(wineData.drinkingWindowEndYear, 10)
          : null,
      });
      return { success: true };
    } catch (err) {
      return errorOut(`Failed to update wine: ${err.message}`, err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // ... other handlers (experience, delete, erase) unchanged ...


  const handleExperienceWine = async (wineToMoveId, notes, rating, consumedDate, allWines) => {
    if (!db || !userId) return errorOut('Database not ready or user not logged in.');
    setIsLoadingAction(true);
    const wineToMove = allWines.find(w => w.id === wineToMoveId);
    if (!wineToMove) return errorOut('Wine not found.');

    try {
      const batch = writeBatch(db);
      const wineDocRef = doc(db, winesCollectionPath, wineToMoveId);
      const experiencedWineDocRef = doc(db, experiencedWinesCollectionPath, wineToMoveId);

      batch.set(experiencedWineDocRef, {
        ...wineToMove,
        tastingNotes: notes,
        rating: rating,
        consumedAt: consumedDate ? Timestamp.fromDate(new Date(consumedDate)) : Timestamp.now(),
        experiencedAt: Timestamp.now(),
      });
      batch.delete(wineDocRef);
      await batch.commit();
      return { success: true };
    } catch (err) {
      return errorOut(`Failed to experience wine: ${err.message}`, err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteWine = async (wineId) => {
    if (!db || !userId) return errorOut('Database not ready or user not logged in.');
    setIsLoadingAction(true);
    try {
      const wineDocRef = doc(db, winesCollectionPath, wineId);
      await deleteDoc(wineDocRef);
      return { success: true };
    } catch (err) {
      return errorOut(`Failed to delete wine: ${err.message}`, err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteExperiencedWine = async (experiencedWineId) => {
    if (!db || !userId) return errorOut('Database not ready or user not logged in.');
    setIsLoadingAction(true);
    try {
      const experiencedWineDocRef = doc(db, experiencedWinesCollectionPath, experiencedWineId);
      await deleteDoc(experiencedWineDocRef);
      return { success: true };
    } catch (err) {
      return errorOut(`Failed to delete experienced wine: ${err.message}`, err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleEraseAllWines = async () => {
    if (!db || !userId) return errorOut('Database not ready or user not logged in.');
    setIsLoadingAction(true);
    try {
      const q = query(collection(db, winesCollectionPath));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Your cellar is already empty!', 'info');
        return { success: true, message: 'Cellar already empty.' };
      }

      const batch = writeBatch(db);
      querySnapshot.forEach(docSnap => {
        batch.delete(doc(db, winesCollectionPath, docSnap.id));
      });
      await batch.commit();
      return { success: true, message: 'All wines have been successfully erased from your cellar.' };
    } catch (err) {
      return errorOut(`Failed to erase all wines: ${err.message}`, err);
    } finally {
      setIsLoadingAction(false);
    }
  };

//  const errorOut = (msg, err = null) => {
//    if (err) console.error(msg, err);
//    else console.warn(msg);
//    setError(msg);
//    return { success: false, error: msg };
//  };

  return {
    handleAddWine,
    handleUpdateWine,
    handleExperienceWine,
    handleDeleteWine,
    handleDeleteExperiencedWine,
    handleEraseAllWines,
    isLoadingAction,
    actionError,
  };
}
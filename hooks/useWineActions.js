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
  where,
} from 'firebase/firestore';

export default function useWineActions(db, userId, appId, setError, cellarId) {
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
        cellarId: cellarId || 'default',
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
        cellarId: wineData?.cellarId || cellarId || 'default',
        notes: wineData?.notes || '',
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

  const handleUpdateExperiencedWine = async (experiencedWineId, wineData) => {
    if (!db || !userId) return errorOut('Database not ready or user not logged in.');
    setIsLoadingAction(true);
    try {
      const experiencedWineDocRef = doc(db, experiencedWinesCollectionPath, experiencedWineId);
      await updateDoc(experiencedWineDocRef, {
        ...wineData,
        year: wineData?.year ? parseInt(wineData.year, 10) : null,
        drinkingWindowStartYear: wineData?.drinkingWindowStartYear ? parseInt(wineData.drinkingWindowStartYear, 10) : null,
        drinkingWindowEndYear: wineData?.drinkingWindowEndYear ? parseInt(wineData.drinkingWindowEndYear, 10) : null,
        consumedAt: wineData?.consumedDate ? Timestamp.fromDate(new Date(wineData.consumedDate)) : Timestamp.now(),
      });
      return { success: true };
    } catch (err) {
      return errorOut(`Failed to update experienced wine: ${err.message}`, err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleRestoreExperiencedWine = async (experiencedWineId, wineData, allWines) => {
    if (!db || !userId) return errorOut('Database not ready or user not logged in.');
    setIsLoadingAction(true);
    try {
      const newLoc = String(wineData?.location || '').trim().toLowerCase();
      const isLocationTaken = allWines.some(w => String(w.location || '').trim().toLowerCase() === newLoc);
      if (isLocationTaken) return errorOut(`Location "${wineData.location}" is already in use.`);

      const expDocRef = doc(db, experiencedWinesCollectionPath, experiencedWineId);
      const wineDocRef = doc(db, winesCollectionPath, experiencedWineId);
      const baseData = {
        cellarId: wineData.cellarId || cellarId || 'default',
        name: wineData.name || '',
        producer: wineData.producer || '',
        year: wineData.year ? parseInt(wineData.year, 10) : null,
        region: wineData.region || '',
        color: wineData.color || 'red',
        location: wineData.location || '',
        drinkingWindowStartYear: wineData.drinkingWindowStartYear ? parseInt(wineData.drinkingWindowStartYear, 10) : null,
        drinkingWindowEndYear: wineData.drinkingWindowEndYear ? parseInt(wineData.drinkingWindowEndYear, 10) : null,
        addedAt: wineData.addedAt || Timestamp.now(),
      };

      const batch = writeBatch(db);
      batch.set(wineDocRef, baseData);
      batch.delete(expDocRef);
      await batch.commit();
      return { success: true };
    } catch (err) {
      return errorOut(`Failed to restore wine: ${err.message}`, err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // ... other handlers (experience, delete, erase) unchanged ...


  const handleExperienceWine = async (wine, notes, rating, consumedDate) => {
    if (!db || !userId) return errorOut('Database not ready or user not logged in.');
    if (!wine || !wine.id) return errorOut('Wine not found.');
    setIsLoadingAction(true);
    const wineToMove = wine;

    try {
      const batch = writeBatch(db);
      const wineDocRef = doc(db, winesCollectionPath, wine.id);
      const experiencedWineDocRef = doc(db, experiencedWinesCollectionPath, wine.id);

      batch.set(experiencedWineDocRef, {
        ...wineToMove,
        cellarId: wineToMove.cellarId || cellarId || 'default',
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

  // Bulk reassign wines (and experienced wines) from one cellar to another
  const reassignCellar = async (fromId, toId) => {
    if (!db || !userId) return errorOut('Database not ready or user not logged in.');
    if (!fromId || !toId) return errorOut('Both source and target cellar ids are required.');
    if (fromId === toId) return { success: true, message: 'No change (same cellar).' };
    setIsLoadingAction(true);
    try {
      const winesRef = collection(db, winesCollectionPath);
      const expRef = collection(db, experiencedWinesCollectionPath);

      // Support legacy docs without `cellarId` when moving from "default".
      let winesToMove = [];
      let expToMove = [];

      if (fromId === 'default') {
        const [wAll, eAll] = await Promise.all([
          getDocs(winesRef),
          getDocs(expRef),
        ]);

        wAll.forEach((d) => {
          const data = d.data() || {};
          if (!("cellarId" in data) || data.cellarId === 'default') {
            winesToMove.push(d);
          }
        });
        eAll.forEach((d) => {
          const data = d.data() || {};
          if (!("cellarId" in data) || data.cellarId === 'default') {
            expToMove.push(d);
          }
        });
      } else {
        const [wSnap, eSnap] = await Promise.all([
          getDocs(query(winesRef, where('cellarId', '==', fromId))),
          getDocs(query(expRef, where('cellarId', '==', fromId))),
        ]);
        winesToMove = wSnap.docs;
        expToMove = eSnap.docs;
      }

      if (winesToMove.length === 0 && expToMove.length === 0) {
        return { success: true, movedWines: 0, movedExperienced: 0 };
      }

      const batch = writeBatch(db);
      winesToMove.forEach((d) => batch.update(d.ref, { cellarId: toId }));
      expToMove.forEach((d) => batch.update(d.ref, { cellarId: toId }));
      await batch.commit();
      return { success: true, movedWines: winesToMove.length, movedExperienced: expToMove.length };
    } catch (err) {
      return errorOut(`Failed to reassign wines: ${err.message}`, err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleEraseAllWines = async (targetCellarId = cellarId) => {
    if (!db || !userId) return errorOut('Database not ready or user not logged in.');
    setIsLoadingAction(true);
    try {
      let qRef = query(collection(db, winesCollectionPath));
      if (targetCellarId) {
        qRef = query(collection(db, winesCollectionPath), where('cellarId', '==', targetCellarId));
      }
      const querySnapshot = await getDocs(qRef);

      if (querySnapshot.empty) {
        setError('Your cellar is already empty!', 'info');
        return { success: true, message: 'Cellar already empty.' };
      }

      const batch = writeBatch(db);
      querySnapshot.forEach(docSnap => {
        batch.delete(doc(db, winesCollectionPath, docSnap.id));
      });
      await batch.commit();
      return { success: true, message: targetCellarId ? `All wines in cellar "${targetCellarId}" erased.` : 'All wines have been successfully erased from your cellar.' };
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
    handleUpdateExperiencedWine,
    handleRestoreExperiencedWine,
    handleExperienceWine,
    handleDeleteWine,
    handleDeleteExperiencedWine,
    handleEraseAllWines,
    reassignCellar,
    isLoadingAction,
    actionError,
    setActionError,
  };
}

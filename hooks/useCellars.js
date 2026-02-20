import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

// Manage the list of cellars for a user and the active selection
export default function useCellars(db, userId, appId) {
  const [cellars, setCellars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // hydrate active cellar from localStorage
  const [activeCellarId, setActiveCellarIdState] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activeCellarId') || null;
  });

  const collectionPath = useMemo(() => {
    if (!db || !userId || !appId) return null;
    return `artifacts/${appId}/users/${userId}/cellars`;
  }, [db, userId, appId]);

  useEffect(() => {
    if (!collectionPath) {
      setCellars([]);
      return () => {};
    }
    setLoading(true);
    setError(null);
    const unsub = onSnapshot(
      collection(db, collectionPath),
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        arr.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
        setCellars(arr);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setCellars([]);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [db, collectionPath]);

  // Ensure we always have a valid activeCellarId when list changes
  useEffect(() => {
    // If user explicitly selected the virtual 'default' cellar, do not override it
    if (activeCellarId === 'default') return;
    if (!cellars.length) return;
    const exists = cellars.some((c) => c.id === activeCellarId);
    if (!exists && cellars[0]?.id) {
      setActiveCellarId(cellars[0].id);
    }
  }, [cellars, activeCellarId]);

  function setActiveCellarId(id) {
    setActiveCellarIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem('activeCellarId', id || '');
  }

  // Create a cellar by slug id (e.g., belgium) and readable name
  async function createCellar(id, name) {
    if (!db || !collectionPath) throw new Error('Database not ready.');
    const safeId = String(id || '').trim().toLowerCase();
    if (!safeId) throw new Error('Missing cellar id');
    const ref = doc(db, collectionPath, safeId);
    await setDoc(
      ref,
      {
        id: safeId,
        name: name || safeId,
        createdAt: Timestamp.now(),
      },
      { merge: true },
    );
    setActiveCellarId(safeId);
  }

  // Delete cellar; if reassignTo provided, reassign wines first
  async function deleteCellar(id, { reassignTo } = {}) {
    if (!db || !collectionPath) throw new Error('Database not ready.');
    const target = String(id || '').trim();
    if (!target) throw new Error('Missing cellar id');
    if (reassignTo && reassignTo === target) throw new Error('Cannot reassign to the same cellar.');

    const winesCol = collection(db, `artifacts/${appId}/users/${userId}/wines`);
    const expCol = collection(db, `artifacts/${appId}/users/${userId}/experiencedWines`);
    const [wq, eq] = await Promise.all([
      getDocs(query(winesCol, where('cellarId', '==', target))),
      getDocs(query(expCol, where('cellarId', '==', target))),
    ]);

    if (!reassignTo && (!wq.empty || !eq.empty)) {
      throw new Error('Cellar has wines. Reassign them before deletion.');
    }

    if (reassignTo) {
      const batch = writeBatch(db);
      wq.forEach((d) => batch.update(d.ref, { cellarId: reassignTo }));
      eq.forEach((d) => batch.update(d.ref, { cellarId: reassignTo }));
      await batch.commit();
    }

    await deleteDoc(doc(db, collectionPath, target));

    if (activeCellarId === target) {
      setActiveCellarIdState(null);
      if (typeof window !== 'undefined') localStorage.removeItem('activeCellarId');
    }
  }

  return {
    cellars,
    activeCellarId,
    setActiveCellarId,
    createCellar,
    deleteCellar,
    loading,
    error,
  };
}

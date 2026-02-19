import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, Timestamp, setLogLevel } from 'firebase/firestore';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-public-wine-cellar-data';

export const useFirebaseData = () => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [wines, setWines] = useState([]);
  const [experiencedWines, setExperiencedWines] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Set Firestore log level once
  useEffect(() => {
    setLogLevel('debug');
  }, []);

  // Auth state listener (guard if auth is not configured)
  useEffect(() => {
    console.debug('DEBUG: Setting up Firebase Auth listener');
    if (!auth) {
      console.warn('[useFirebaseData] Firebase auth not initialized. Check NEXT_PUBLIC_* env vars.');
      setUser(null);
      setUserId(null);
      setIsAuthReady(true);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      console.debug('[useFirebaseData] onAuthStateChanged:', firebaseUser);
      if (firebaseUser) {
        setUser(firebaseUser);
        setUserId(firebaseUser.uid);
        console.debug('[useFirebaseData] Authenticated as', firebaseUser.uid);
        setDataError(null);
      } else {
        setUser(null);
        setUserId(null);
        setWines([]);
        setExperiencedWines([]);
        console.debug('[useFirebaseData] No user authenticated');
      }
      setIsAuthReady(true);
    });
    return () => {
      console.debug('DEBUG: Cleaning up Auth listener');
      unsubscribe();
    };
  }, [auth]);

  // Firestore subscriptions
  useEffect(() => {
    if (!db || !userId) {
      console.debug('DEBUG: Skipping Firestore subscription (no db or userId)');
      setWines([]);
      setExperiencedWines([]);
      setIsLoadingData(false);
      return;
    }

    console.debug('DEBUG: Subscribing to Firestore for user', userId);
    setIsLoadingData(true);
    setDataError(null);

    const winesPath = `artifacts/${appId}/users/${userId}/wines`;
    const expPath = `artifacts/${appId}/users/${userId}/experiencedWines`;

    let winesLoaded = false;
    let expLoaded = false;
    const checkDone = () => {
      console.debug(`DEBUG: winesLoaded=${winesLoaded}, expLoaded=${expLoaded}`);
      if (winesLoaded && expLoaded) {
        setIsLoadingData(false);
      }
    };

    const unsubWines = onSnapshot(
      query(collection(db, winesPath)),
      snap => {
        console.debug('DEBUG: Wines snapshot size=', snap.size);
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        arr.sort((a, b) => {
          const cmp = (a.producer || '').localeCompare(b.producer || '');
          return cmp !== 0 ? cmp : ((a.year || 0) - (b.year || 0));
        });
        setWines(arr);
        winesLoaded = true;
        checkDone();
      },
      err => {
        console.error('Error fetching wines:', err);
        setDataError(`Failed to fetch wines: ${err.message}`);
        setWines([]);
        winesLoaded = true;
        checkDone();
      }
    );

    const unsubExp = onSnapshot(
      query(collection(db, expPath)),
      snap => {
        console.debug('DEBUG: Experienced snapshot size=', snap.size);
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        arr.sort((a, b) => {
          const da = a.consumedAt instanceof Timestamp ? a.consumedAt.toDate() : new Date(a.consumedAt);
          const dbb = b.consumedAt instanceof Timestamp ? b.consumedAt.toDate() : new Date(b.consumedAt);
          return dbb - da;
        });
        setExperiencedWines(arr);
        expLoaded = true;
        checkDone();
      },
      err => {
        console.error('Error fetching experienced wines:', err);
        setExperiencedWines([]);
        expLoaded = true;
        checkDone();
      }
    );

    return () => {
      console.debug('DEBUG: Unsubscribing from Firestore listeners');
      unsubWines();
      unsubExp();
    };
  }, [db, userId, isAuthReady]);

  return {
    user,
    userId,
    isAuthReady,
    db,
    wines,
    experiencedWines,
    isLoadingData,
    dataError,
    appId
  };
};

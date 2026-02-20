// app/importexport/page.jsx
'use client';

import { useState } from 'react';
import ImportExportView from '@/views/importExport/ImportExportView';
import { useFirebaseData } from '@/hooks';
import useCellars from '@/hooks/useCellars';
import { exportToCsv } from '@/utils';

export default function ImportExportPage() {
  const [csvFile, setCsvFile] = useState(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvImportStatus, setCsvImportStatus] = useState({ message: '', type: '', errors: [] });
  const { wines, experiencedWines, db, user, appId } = useFirebaseData();
  const { cellars, activeCellarId, setActiveCellarId, createCellar, deleteCellar } = useCellars(db, user?.uid, appId);

  const handleCsvFileChange = (e) => setCsvFile(e.target.files[0]);

  const handleImportCsv = () => {
    setIsImportingCsv(true);
    setTimeout(() => {
      setCsvImportStatus({ message: 'Mock import complete.', type: 'success', errors: [] });
      setIsImportingCsv(false);
    }, 1500);
  };

  const handleExportCsv = () => exportToCsv(scopedWines, 'my_cellar');
  const handleExportExperiencedCsv = () => exportToCsv(scopedExperienced, 'experienced_wines', undefined, true);
  const confirmEraseAllWines = async () => {
    if (!activeCellarId) {
      alert('Select a cellar first.');
      return;
    }
    if (confirm(`Erase ALL wines in cellar "${activeCellarId}"? This cannot be undone.`)) {
      // The actual erase is triggered from Home via prop in the all-in-one page,
      // but for this standalone page we simply notify; the real action is wired in app/page.jsx
      alert('Requested erase of current cellar.');
    }
  };

  const scopedWines = activeCellarId ? wines.filter(w => (w.cellarId || 'default') === activeCellarId) : wines;
  const scopedExperienced = activeCellarId ? experiencedWines.filter(w => (w.cellarId || 'default') === activeCellarId) : experiencedWines;

  return (
    <ImportExportView
      cellars={cellars}
      activeCellarId={activeCellarId}
      setActiveCellarId={setActiveCellarId}
      onCreateCellar={createCellar}
      onDeleteCellar={deleteCellar}
      csvFile={csvFile}
      handleCsvFileChange={handleCsvFileChange}
      handleImportCsv={handleImportCsv}
      isImportingCsv={isImportingCsv}
      csvImportStatus={csvImportStatus}
      handleExportCsv={handleExportCsv}
      wines={scopedWines}
      handleExportExperiencedCsv={handleExportExperiencedCsv}
      experiencedWines={scopedExperienced}
      confirmEraseAllWines={confirmEraseAllWines}
      setCsvImportStatus={setCsvImportStatus}
    />
  );
}

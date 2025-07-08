// app/importexport/page.jsx
'use client';

import { useState } from 'react';
import ImportExportView from '@/views/importExport/ImportExportView';
import { useFirebaseData } from '@/hooks';
import { exportToCsv } from '@/utils';

export default function ImportExportPage() {
  const [csvFile, setCsvFile] = useState(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvImportStatus, setCsvImportStatus] = useState({ message: '', type: '', errors: [] });
  const { wines, experiencedWines } = useFirebaseData();

  const handleCsvFileChange = (e) => setCsvFile(e.target.files[0]);

  const handleImportCsv = () => {
    setIsImportingCsv(true);
    setTimeout(() => {
      setCsvImportStatus({ message: 'Mock import complete.', type: 'success', errors: [] });
      setIsImportingCsv(false);
    }, 1500);
  };

  const handleExportCsv = () => exportToCsv(wines, 'my_cellar');
  const handleExportExperiencedCsv = () => exportToCsv(experiencedWines, 'experienced_wines', undefined, true);
  const confirmEraseAllWines = () => {
    if (confirm('Are you sure you want to erase all wines? This cannot be undone.')) {
      alert('All wines erased.');
    }
  };

  return (
    <ImportExportView
      csvFile={csvFile}
      handleCsvFileChange={handleCsvFileChange}
      handleImportCsv={handleImportCsv}
      isImportingCsv={isImportingCsv}
      csvImportStatus={csvImportStatus}
      handleExportCsv={handleExportCsv}
      wines={wines}
      handleExportExperiencedCsv={handleExportExperiencedCsv}
      experiencedWines={experiencedWines}
      confirmEraseAllWines={confirmEraseAllWines}
      setCsvImportStatus={setCsvImportStatus}
    />
  );
}

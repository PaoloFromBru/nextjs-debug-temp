'use client';

import React from 'react';
import AlertMessage from '@/components/AlertMessage';

const UploadIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round"
          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

export default function ImportExportView({
  csvFile,
  handleCsvFileChange,
  handleImportCsv,
  isImportingCsv,
  csvImportStatus = {},
  setCsvImportStatus,
  wines = [],
  experiencedWines = [],
  handleExportCsv,
  handleExportExperiencedCsv,
  confirmEraseAllWines
}) {
  const { message = '', type = '', errors = [] } = csvImportStatus;

  return (
    <>
      {/* Import */}
      <section className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Import Wines from CSV
        </h2>
        <div className="flex flex-col sm:flex-row items-end gap-3 sm:space-x-3">
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-800 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-700"
          />
          <button
            onClick={handleImportCsv}
            disabled={!csvFile || isImportingCsv}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-60"
          >
            {isImportingCsv ? 'Importing...' : 'Import CSV'}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={wines.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-60"
          >
            Export Cellar
          </button>
          <button
            onClick={handleExportExperiencedCsv}
            disabled={experiencedWines.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-60"
          >
            Export Experienced
          </button>
        </div>
        {message && (
          <div className="mt-4">
            <AlertMessage
              message={
                message +
                (errors.length > 0
                  ? `<br/><strong>Errors:</strong><ul>${errors
                      .map((e) => `<li>${e}</li>`)
                      .join('')}</ul>`
                  : '')
              }
              type={type}
              onDismiss={() => setCsvImportStatus({ message: '', type: '', errors: [] })}
              isHtml={errors.length > 0}
            />
          </div>
        )}
      </section>

      {/* Export Cellar */}
      <section className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Export Cellar to CSV
        </h2>
        <button
          onClick={handleExportCsv}
          disabled={wines.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-60 flex items-center space-x-2"
        >
          <UploadIcon className="w-5 h-5 rotate-180" />
          <span>Export Cellar</span>
        </button>
      </section>

      {/* Export Experienced Wines */}
      <section className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Export Experienced Wines to CSV
        </h2>
        <button
          onClick={handleExportExperiencedCsv}
          disabled={experiencedWines.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-60 flex items-center space-x-2"
        >
          <UploadIcon className="w-5 h-5 rotate-180" />
          <span>Export Experienced Wines</span>
        </button>
      </section>
      {/* Danger Zone */}
      <section className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow border border-red-300 dark:border-red-700">
        <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-3">
          Danger Zone: Erase All Wines
        </h2>
        <button
          onClick={confirmEraseAllWines}
          disabled={wines.length === 0}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-60 flex items-center space-x-2"
        >
          <TrashIcon />
          <span>Erase All Wines</span>
        </button>
      </section>
    </>
  );
}

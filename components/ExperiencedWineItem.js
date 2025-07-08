import React from 'react';
import { Timestamp } from 'firebase/firestore';

// --- Icons (local for this component for now, but ideally would be imported from a central Icons.js) ---
const StarIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.109 5.625.441a.562.562 0 0 1 .322.978l-4.307 3.972 1.282 5.586a.562.562 0 0 1-.84.61l-4.908-2.921-4.908 2.921a.562.562 0 0 1-.84-.61l1.282-5.586-4.307-3.972a.562.562 0 0 1 .322-.978l5.625-.441L11.48 3.499Z" />
    </svg>
);
const TrashIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);
const EditIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

const ExperiencedWineItem = ({ wine, onDelete, onEdit }) => {
    const wineColors = {
        red: 'bg-red-200 dark:bg-red-800 border-red-400 dark:border-red-600',
        white: 'bg-yellow-100 dark:bg-yellow-700 border-yellow-300 dark:border-yellow-500',
        rose: 'bg-pink-100 dark:bg-pink-700 border-pink-300 dark:border-pink-500',
        sparkling: 'bg-blue-100 dark:bg-blue-700 border-blue-300 dark:border-blue-500',
        other: 'bg-slate-200 dark:bg-slate-600 border-slate-400 dark:border-slate-500',
    };
    const colorClass = wineColors[wine.color?.toLowerCase()] || wineColors.other;

    const consumedDate = wine.consumedAt ? (wine.consumedAt instanceof Timestamp ? wine.consumedAt.toDate().toLocaleDateString() : new Date(wine.consumedAt).toLocaleDateString()) : 'N/A';

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col`}>
            <div className={`p-4 border-l-8 ${colorClass}`}>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate" title={wine.name || wine.producer}>{wine.name || wine.producer}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{wine.year || 'N/A'}</p>
            </div>
            <div className="p-5 space-y-3 flex-grow">
                <p><strong className="text-slate-600 dark:text-slate-300">Producer:</strong> <span className="text-slate-700 dark:text-slate-200">{wine.producer}</span></p>
                <p><strong className="text-slate-600 dark:text-slate-300">Region:</strong> <span className="text-slate-700 dark:text-slate-200">{wine.region}</span></p>
                <p><strong className="text-slate-600 dark:text-slate-300">Color:</strong> <span className="text-slate-700 dark:text-slate-200 capitalize">{wine.color}</span></p>
                <p><strong className="text-slate-600 dark:text-slate-300">Location:</strong> <span className="text-slate-700 dark:text-slate-200">{wine.location}</span></p>
                
                <p><strong className="text-slate-600 dark:text-slate-300">Consumed:</strong> <span className="text-slate-700 dark:text-slate-200">{consumedDate}</span></p>
                <p><strong className="text-slate-600 dark:text-slate-300">Rating:</strong> 
                    <span className="text-slate-700 dark:text-slate-200 flex items-center">
                        {wine.rating > 0 ? (
                            Array.from({ length: 5 }, (_, i) => (
                                <StarIcon key={i} className={`w-4 h-4 ${i < wine.rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} />
                            ))
                        ) : 'N/A'}
                    </span>
                </p>
                <p><strong className="text-slate-600 dark:text-slate-300">Notes:</strong> <span className="text-slate-700 dark:text-slate-200 italic">{wine.tastingNotes || 'No notes added.'}</span></p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={onEdit}
                    title="Edit Experienced Wine"
                    className="p-2 rounded-md text-sm text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-700 transition-colors"
                >
                    <EditIcon />
                </button>
                <button
                    onClick={onDelete}
                    title="Delete Experienced Wine"
                    className="p-2 rounded-md text-sm text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-700 transition-colors"
                >
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
};

export default ExperiencedWineItem;

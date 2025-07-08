"use client";
import React, { useState, useEffect } from 'react';
import Modal from './Modal.js';
import AlertMessage from './AlertMessage.js';
import { Timestamp } from 'firebase/firestore';

const StarIcon = ({ className = "w-4 h-4", onClick }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" onClick={onClick}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.109 5.625.441a.562.562 0 0 1 .322.978l-4.307 3.972 1.282 5.586a.562.562 0 0 1-.84.61l-4.908-2.921-4.908 2.921a.562.562 0 0 1-.84-.61l1.282-5.586-4.307-3.972a.562.562 0 0 1 .322-.978l5.625-.441L11.48 3.499Z" />
  </svg>
);

const EditExperiencedWineModal = ({ isOpen, onClose, wine, onSubmit, onMoveBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    producer: '',
    year: '',
    region: '',
    color: 'red',
    location: '',
    drinkingWindowStartYear: '',
    drinkingWindowEndYear: '',
    tastingNotes: '',
    rating: 0,
    consumedDate: new Date().toISOString().slice(0,10),
    addedAt: null,
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (wine) {
      setFormData({
        name: wine.name || '',
        producer: wine.producer || '',
        year: wine.year || '',
        region: wine.region || '',
        color: wine.color || 'red',
        location: wine.location || '',
        drinkingWindowStartYear: wine.drinkingWindowStartYear || '',
        drinkingWindowEndYear: wine.drinkingWindowEndYear || '',
        tastingNotes: wine.tastingNotes || '',
        rating: wine.rating || 0,
        consumedDate: wine.consumedAt ? (wine.consumedAt instanceof Timestamp ? wine.consumedAt.toDate() : new Date(wine.consumedAt)).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
        addedAt: wine.addedAt || null,
      });
    }
    setFormError('');
  }, [wine, isOpen]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateBasic = () => {
    if (!formData.producer || !formData.region || !formData.color || !formData.location) {
      setFormError('Producer, Region, Color, and Location are required.');
      return false;
    }
    if (formData.year && (isNaN(parseInt(formData.year)) || parseInt(formData.year) < 1000 || parseInt(formData.year) > new Date().getFullYear() + 10)) {
      setFormError('Please enter a valid Year (e.g., 2020).');
      return false;
    }
    const startYear = formData.drinkingWindowStartYear ? parseInt(formData.drinkingWindowStartYear,10) : null;
    const endYear = formData.drinkingWindowEndYear ? parseInt(formData.drinkingWindowEndYear,10) : null;
    if (formData.drinkingWindowStartYear && (isNaN(startYear) || startYear < 1000 || startYear > new Date().getFullYear() + 50)) {
      setFormError('Please enter a valid Drinking Window Start Year.');
      return false;
    }
    if (formData.drinkingWindowEndYear && (isNaN(endYear) || endYear < 1000 || endYear > new Date().getFullYear() + 100)) {
      setFormError('Please enter a valid Drinking Window End Year.');
      return false;
    }
    if (startYear && endYear && startYear > endYear) {
      setFormError('Drinking Window Start Year cannot be after End Year.');
      return false;
    }
    if (!formData.consumedDate) {
      setFormError('Consumed date is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = e => {
    e.preventDefault();
    setFormError('');
    if (!validateBasic()) return;
    onSubmit(formData);
  };

  const handleMoveBack = e => {
    e.preventDefault();
    setFormError('');
    if (!validateBasic()) return;
    onMoveBack(formData);
  };

  const wineColorOptions = ['red','white','rose','sparkling','other'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={wine ? `Edit Experienced Wine: ${wine.name || wine.producer}` : 'Edit Wine'}>
      {formError && <AlertMessage message={formError} type="error" onDismiss={() => setFormError('')} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name (Optional)</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200" />
        </div>
        <div>
          <label htmlFor="producer" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Producer <span className="text-red-500">*</span></label>
          <input type="text" id="producer" name="producer" value={formData.producer} onChange={handleChange} required className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200" />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
          <input type="number" id="year" name="year" value={formData.year} onChange={handleChange} className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200" />
        </div>
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Region <span className="text-red-500">*</span></label>
          <input type="text" id="region" name="region" value={formData.region} onChange={handleChange} required className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200" />
        </div>
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Color <span className="text-red-500">*</span></label>
          <select id="color" name="color" value={formData.color} onChange={handleChange} required className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200">
            {wineColorOptions.map(opt => (<option key={opt} value={opt} className="capitalize">{opt.charAt(0).toUpperCase()+opt.slice(1)}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cellar Location <span className="text-red-500">*</span></label>
          <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200" />
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
          <h3 className="base font-semibold text-slate-700 dark:text-slate-200 mb-2">Drinking Window (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="drinkingWindowStartYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Year</label>
              <input type="number" id="drinkingWindowStartYear" name="drinkingWindowStartYear" value={formData.drinkingWindowStartYear} onChange={handleChange} className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <label htmlFor="drinkingWindowEndYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300">End Year</label>
              <input type="number" id="drinkingWindowEndYear" name="drinkingWindowEndYear" value={formData.drinkingWindowEndYear} onChange={handleChange} className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200" />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="consumedDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date Consumed <span className="text-red-500">*</span></label>
          <input type="date" id="consumedDate" name="consumedDate" value={formData.consumedDate} onChange={handleChange} required className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Rating</label>
          <div className="flex items-center mt-1 space-x-1">
            {[1,2,3,4,5].map(star => (
              <StarIcon key={star} className={`w-6 h-6 inline-block cursor-pointer ${star <= formData.rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} onClick={() => setFormData(prev => ({...prev, rating: star}))} />
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="tastingNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tasting Notes</label>
          <textarea id="tastingNotes" name="tastingNotes" value={formData.tastingNotes} onChange={handleChange} rows="4" className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200" placeholder="e.g., Fruity, earthy, paired well with..."></textarea>
        </div>
        <div className="flex justify-between space-x-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md border border-slate-300 dark:border-slate-500">Cancel</button>
          <div className="space-x-2">
            <button type="button" onClick={handleMoveBack} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm">Move Back to Cellar</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm">Save Changes</button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditExperiencedWineModal;

// src/components/WineFormModal.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal.js';
import AlertMessage from './AlertMessage.js';

const WINE_COLOR_OPTIONS = ['red', 'white', 'rose', 'sparkling', 'other'];

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
});

const WineFormModal = ({ isOpen, onClose, onSubmit, wine, allWines, cellars = [], activeCellarId = 'default' }) => {
    const [formData, setFormData] = useState({
        name: '',
        producer: '',
        year: '',
        region: '',
        color: 'red',
        location: '',
        cellarId: 'default',
        notes: '',
        drinkingWindowStartYear: '',
        drinkingWindowEndYear: ''
    });
    const [formError, setFormError] = useState('');
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [isFetchingWindow, setIsFetchingWindow] = useState(false);
    const fileInputRef = useRef(null);

    // Removed functions, callScanWineLabelFunction, auth initializations

    useEffect(() => {
        if (wine) {
            setFormData({
                name: wine.name || '',
                producer: wine.producer || '',
                year: wine.year || '',
                region: wine.region || '',
                color: wine.color || 'red',
                location: wine.location || '',
                cellarId: wine.cellarId || 'default',
                notes: wine.notes || '',
                drinkingWindowStartYear: wine.drinkingWindowStartYear || '',
                drinkingWindowEndYear: wine.drinkingWindowEndYear || ''
            });
        } else {
            setFormData({ name: '', producer: '', year: '', region: '', color: 'red', location: '', cellarId: activeCellarId || 'default', notes: '', drinkingWindowStartYear: '', drinkingWindowEndYear: '' });
        }
        setFormError('');
        // Removed setIsScanning(false)
        // Removed setScanResult('')
        // Removed setIsProcessingImage(false)
        // Removed setWebcamKey(Date.now())
    }, [wine, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setIsProcessingImage(true);
        setFormError('');
        try {
            const base64Data = await fileToBase64(file);
            const prompt = `You are reading a photo of a wine bottle label. Extract these fields and respond with ONLY a JSON object (no markdown fences, no explanation):
{
  "producer": string or null,
  "name": string or null (the wine's specific name/cuvee, if distinct from the producer),
  "year": string or null (4-digit vintage year),
  "region": string or null,
  "color": one of "red", "white", "rose", "sparkling", "other", or null
}
If a field cannot be determined from the label, use null. Do not guess.`;

            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: prompt },
                                { inlineData: { mimeType: file.type || 'image/jpeg', data: base64Data } }
                            ]
                        }
                    ],
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
                    ]
                })
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            if (data?.promptFeedback?.blockReason) {
                throw new Error('Label photo was blocked by the AI safety filter. Please fill in the fields manually.');
            }

            const candidate = data?.candidates?.[0];
            if (!candidate || candidate.finishReason === 'SAFETY') {
                throw new Error('Could not read the label automatically. Please fill in the fields manually.');
            }

            const rawText = candidate?.content?.parts?.[0]?.text || '';
            const cleaned = rawText.replace(/```json\s*|```/g, '').trim();

            let parsed;
            try {
                parsed = JSON.parse(cleaned);
            } catch {
                throw new Error('Could not understand the label scan result. Please fill in the fields manually.');
            }

            const updates = {};
            if (parsed.producer) updates.producer = String(parsed.producer).trim();
            if (parsed.name) updates.name = String(parsed.name).trim();
            if (parsed.year && /^\d{4}$/.test(String(parsed.year).trim())) updates.year = String(parsed.year).trim();
            if (parsed.region) updates.region = String(parsed.region).trim();
            if (parsed.color && WINE_COLOR_OPTIONS.includes(String(parsed.color).toLowerCase())) {
                updates.color = String(parsed.color).toLowerCase();
            }

            if (Object.keys(updates).length === 0) {
                setFormError('Could not read any fields from the label. Please fill in the fields manually.');
            } else {
                setFormData(prev => ({ ...prev, ...updates }));
            }
        } catch (err) {
            console.error('Label scan error', err);
            setFormError(err.message || 'Failed to read wine label.');
        } finally {
            setIsProcessingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAskDrinkingWindow = async () => {
        setIsFetchingWindow(true);
        setFormError('');
        try {
            const prompt = `Suggest a conservative drinking window in years for the following wine. The end year should err on the early side. Provide the result as \"YYYY-YYYY\" only.\\nProducer: ${formData.producer}\\nName: ${formData.name}\\nYear: ${formData.year}\\nColor: ${formData.color}`;
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }]
                        }
                    ]
                })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            const output = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const match = output.match(/(\d{4}).*(\d{4})/);
            if (match) {
                setFormData(prev => ({
                    ...prev,
                    drinkingWindowStartYear: match[1],
                    drinkingWindowEndYear: match[2]
                }));
            } else {
                setFormError('Unexpected AI response: ' + output);
            }
        } catch (err) {
            setFormError('Failed to fetch window: ' + err.message);
        } finally {
            setIsFetchingWindow(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.producer || !formData.region || !formData.color || !formData.location) {
            setFormError('Producer, Region, Color, and Location are required.');
            return;
        }
        if (formData.year && (isNaN(parseInt(formData.year)) || parseInt(formData.year) < 1000 || parseInt(formData.year) > new Date().getFullYear() + 10)) {
            setFormError('Please enter a valid Year (e.g., 2020).');
            return;
        }

        const startYear = formData.drinkingWindowStartYear ? parseInt(formData.drinkingWindowStartYear, 10) : null;
        const endYear = formData.drinkingWindowEndYear ? parseInt(formData.drinkingWindowEndYear, 10) : null;

        if (formData.drinkingWindowStartYear && (isNaN(startYear) || startYear < 1000 || startYear > new Date().getFullYear() + 50)) {
            setFormError('Please enter a valid Drinking Window Start Year.');
            return;
        }
        if (formData.drinkingWindowEndYear && (isNaN(endYear) || endYear < 1000 || endYear > new Date().getFullYear() + 100)) {
            setFormError('Please enter a valid Drinking Window End Year.');
            return;
        }
        if (startYear && endYear && startYear > endYear) {
            setFormError('Drinking Window Start Year cannot be after End Year.');
            return;
        }


        if (formData.location && allWines) {
            const currentLocation = formData.location.trim().toLowerCase();
            let isLocationTaken = false;
            if (wine && wine.id) {
                isLocationTaken = allWines.some(
                    w => w.id !== wine.id && w.location && w.location.trim().toLowerCase() === currentLocation
                );
            } else {
                isLocationTaken = allWines.some(
                    w => w.location && w.location.trim().toLowerCase() === currentLocation
                );
            }

            if (isLocationTaken) {
                setFormError(`Location "${formData.location}" is already in use. Please choose a different one or clear the location of the other bottle first.`);
                return;
            }
        }
        onSubmit(formData);
        onClose();
    };

    const wineColorOptions = WINE_COLOR_OPTIONS;
    const canAskAI = formData.name && formData.producer && formData.year && formData.color;

    // Removed captureAndSendToCloudFunction function

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={wine ? 'Edit Wine' : 'Add New Wine'}>
            {formError && <AlertMessage message={formError} type="error" onDismiss={() => setFormError('')} />}

            {/* Always show the form, as scanning functionality is removed */}
            <>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name (Optional)</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                        <textarea
                            name="notes"
                            id="notes"
                            rows="2"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="e.g., Gift from Tizio; bought at XYZ on 2025-09-01"
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="producer" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Producer <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="producer"
                            id="producer"
                            value={formData.producer}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
                        <input
                            type="number"
                            name="year"
                            id="year"
                            value={formData.year}
                            onChange={handleChange}
                            placeholder={`e.g., ${new Date().getFullYear() - 5}`}
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="region" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Region <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="region"
                            id="region"
                            value={formData.region}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="color" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Color <span className="text-red-500">*</span></label>
                        <select
                            name="color"
                            id="color"
                            value={formData.color}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        >
                            {wineColorOptions.map(opt => (
                                <option key={opt} value={opt} className="capitalize">{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="cellarId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cellar</label>
                        <select
                            name="cellarId"
                            id="cellarId"
                            value={formData.cellarId}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        >
                            <option value="default">Default (no cellar tag)</option>
                            {cellars.map(c => (
                                <option key={c.id} value={c.id}>{(c.name || c.id)} ({c.id})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Scan Label (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={handleSelectImage}
                            className="px-3 py-2 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md border border-slate-300 dark:border-slate-500 text-sm"
                        >
                            {isProcessingImage ? 'Scanning...' : 'Take or Upload Photo'}
                        </button>
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cellar Location <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="location"
                            id="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g., Rack A, Shelf 3"
                            required
                            className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                        />
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        <h3 className="base font-semibold text-slate-700 dark:text-slate-200 mb-2">Drinking Window (Optional)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="drinkingWindowStartYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Year</label>
                                <input
                                    type="number"
                                    name="drinkingWindowStartYear"
                                    id="drinkingWindowStartYear"
                                    value={formData.drinkingWindowStartYear}
                                    onChange={handleChange}
                                    placeholder="e.g., 2023"
                                    className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                                />
                            </div>
                            <div>
                                <label htmlFor="drinkingWindowEndYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300">End Year</label>
                                <input
                                    type="number"
                                    name="drinkingWindowEndYear"
                                    id="drinkingWindowEndYear"
                                    value={formData.drinkingWindowEndYear}
                                    onChange={handleChange}
                                    placeholder="e.g., 2030"
                                    className="mt-1 block w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-red-500 focus:border-red-500 shadow-sm sm:text-sm dark:bg-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>
                        {canAskAI && (
                            <button
                                type="button"
                                onClick={handleAskDrinkingWindow}
                                disabled={isFetchingWindow}
                                className="mt-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50"
                            >
                                {isFetchingWindow ? 'Asking AI...' : 'Ask AI for Drinking Window'}
                            </button>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        {/* Removed Scan Label button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-md border border-slate-300 dark:border-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            {wine ? 'Save Changes' : 'Add Wine'}
                        </button>
                    </div>
                </form>
            </>
            {/* Removed isScanning conditional block and Webcam/canvas JSX */}
        </Modal>
    );
};
export default WineFormModal;

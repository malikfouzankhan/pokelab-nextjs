'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { usePokemonStore } from '@/lib/store/usePokemonStore';
import { PokemonRow } from '@/lib/types';
import { X, Upload, Loader2, FileSpreadsheet } from 'lucide-react';

interface CsvImporterProps {
  onClose: () => void;
}

export function CsvImporter({ onClose }: CsvImporterProps) {
  const { setPokemon } = usePokemonStore();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFields = [
    { label: 'Name', key: 'name' },
    { label: 'HP', key: 'hp' },
    { label: 'Attack', key: 'attack' },
    { label: 'Defense', key: 'defense' },
    { label: 'Sp. Atk', key: 'specialAttack' },
    { label: 'Sp. Def', key: 'specialDefense' },
    { label: 'Speed', key: 'speed' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      Papa.parse(selectedFile, {
        header: true,
        preview: 0,
        complete: (results) => {
           if (results.meta.fields) {
             setHeaders(results.meta.fields);
             setStep('mapping');
             const initialMapping: Record<string, string> = {};
             requiredFields.forEach(field => {
                const match = results.meta.fields!.find(h => h.toLowerCase() === field.label.toLowerCase() || h.toLowerCase() === field.key.toLowerCase());
                if (match) initialMapping[field.key] = match;
             });
             setMapping(initialMapping);
           }
        }
      });
    }
  };

  const handleImport = () => {
    if (!file) return;
    setStep('importing');
    
    const newPokemon: PokemonRow[] = [];
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      step: (row) => {
         const data = row.data as Record<string, any>;
         const pokemon: any = {
           id: crypto.randomUUID(),
           nationalId: 0, 
           name: 'Unknown',
           sprite: null,
           types: [],
           generation: 1,
           abilities: [],
           hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0,
         };

         Object.entries(mapping).forEach(([targetKey, sourceHeader]) => {
             const value = data[sourceHeader];
             if (value !== undefined) {
                 if (['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'nationalId', 'generation'].includes(targetKey)) {
                     const num = Number(value);
                     pokemon[targetKey] = isNaN(num) ? 0 : num;
                 } else {
                     pokemon[targetKey] = value;
                 }
             }
         });
         newPokemon.push(pokemon as PokemonRow);
      },
      complete: () => {
         setPokemon(newPokemon);
         onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <h3 className="font-bold text-lg">Import CSV</h3>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 flex-1 overflow-auto">
            {step === 'upload' && (
                <div 
                    className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-12 h-12 text-neutral-400 mb-4" />
                    <p className="font-medium text-lg">Click to upload CSV</p>
                    <p className="text-neutral-500 text-sm">Max 100MB</p>
                    <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={handleFileChange} 
                    />
                </div>
            )}
            
            {step === 'mapping' && (
                <div className="space-y-4">
                    <p className="text-sm text-neutral-500">Map columns from your CSV to Pokémon fields.</p>
                    <div className="grid gap-4">
                        {requiredFields.map(field => (
                            <div key={field.key} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <span className="font-medium">{field.label}</span>
                                <select 
                                    className="p-2 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                                    value={mapping[field.key] || ''}
                                    onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                                >
                                    <option value="">Select Column...</option>
                                    {headers.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {step === 'importing' && (
                <div className="flex flex-col items-center justify-center py-12">
                   <Loader2 className="w-8 h-8 animate-spin mb-4" />
                   <p>Processing CSV...</p>
                </div>
            )}
        </div>
        
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">Cancel</button>
            {step === 'mapping' && (
                <button 
                    onClick={handleImport} 
                    className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg font-medium"
                >
                    Import Data
                </button>
            )}
        </div>
      </div>
    </div>
  );
}

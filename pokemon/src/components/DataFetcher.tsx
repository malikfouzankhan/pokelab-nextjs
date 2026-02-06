'use client';

import { useState } from 'react';
import { usePokemonStore } from '@/lib/store/usePokemonStore';
import { fetchAndStorePokemon } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Database, AlertCircle } from 'lucide-react';
import {clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function DataFetcher() {
  const { 
    status, 
    progress, 
    setStatus, 
    setProgress, 
    setPokemon, 
    appendPokemon 
  } = usePokemonStore();

  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    try {
      setStatus('fetching');
      setError(null);
      
      // Clear existing if any? The prompt says "Fetch Full Pokédex", implying a fresh fetch or append?
      // Usually "Aggregates the complete dataset" implies fresh start or sync.
      // We'll clear for safety to avoid dupes unless we check duplicates robustly.
      setPokemon([]); 

      await fetchAndStorePokemon(
        (batch) => appendPokemon(batch),
        (current, total) => setProgress(current, total)
      );

      setStatus('ready');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'ready') return null;

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'error' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800">
               <Database className="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
            </div>
            
            <h2 className="text-xl font-semibold">Ready to Research?</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs">
              Fetch the complete Pokémon dataset (~1300 records) from PokeAPI to begin analysis.
            </p>

            <button
              onClick={handleFetch}
              className="mt-2 flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:opacity-90 transition-all active:scale-95 font-medium"
            >
               Fetch Full Pokédex Dataset
            </button>
            
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full space-y-4"
          >
            <div className="flex justify-between text-sm font-medium">
              <span>Fetching Pokémon...</span>
              <span className="tabular-nums opacity-60">
                {progress.current} / {progress.total || '...' }
              </span>
            </div>

            <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-blue-600 dark:bg-blue-400"
                 initial={{ width: 0 }}
                 animate={{ width: `${(progress.current / (progress.total || 1300)) * 100}%` }}
                 transition={{ type: "spring", stiffness: 50, damping: 15 }}
               />
            </div>
            
            <p className="text-xs text-neutral-400 text-center">
              Processing data normalization & caching...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { executeCommand, parseCommand } from '@/lib/commandParser';
import { usePokemonStore } from '@/lib/store/usePokemonStore';
import { Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CommandBar() {
  const { pokemon, updateManyPokemon, deletePokemon } = usePokemonStore();
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const command = parseCommand(input);
    const result = executeCommand(command, pokemon, {
        updateMany: updateManyPokemon,
        delete: deletePokemon
    });

    setFeedback({
        type: result.success ? 'success' : 'error',
        message: result.message
    });

    if (result.success) {
        setInput('');
        setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
         <form 
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-full shadow-xl p-2 transition-all focus-within:ring-2 focus-within:ring-black/10 dark:focus-within:ring-white/10"
         >
            <div className="pl-3">
               <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI to edit data (e.g. 'set hp to 100 where types is fire')"
                className="flex-1 bg-transparent border-none outline-none text-sm px-2 h-10 placeholder:text-neutral-400"
            />
            <button 
                type="submit"
                className="p-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-full hover:opacity-90 active:scale-95 transition-all"
            >
                <ArrowRight className="w-4 h-4" />
            </button>
         </form>

         <AnimatePresence>
            {feedback && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-2 text-center text-sm font-medium px-3 py-1 rounded-full inline-block mx-auto w-full ${
                        feedback.type === 'success' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'
                    }`}
                >
                    {feedback.message}
                </motion.div>
            )}
         </AnimatePresence>
      </div>
    </>
  );
}

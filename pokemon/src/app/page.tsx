'use client';

import { usePokemonStore } from "@/lib/store/usePokemonStore";
import { DataFetcher } from "@/components/DataFetcher";
import { DataTable } from "@/components/table/DataTable";
import { CsvImporter } from "@/components/CsvImporter";
import { CommandBar } from "@/components/CommandBar";
import Papa from 'papaparse';
import { useState } from "react";

export default function Home() {
  const { status, pokemon, dynamicColumns, updatePokemon, addDynamicColumn } = usePokemonStore();
  const [showImporter, setShowImporter] = useState(false);

  const handleExport = () => {
    const csv = Papa.unparse(pokemon);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'pokemon-research-lab.csv';
    link.click();
  };

  return (
    <main className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 relative">
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pokémon Research Lab</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              High-performance analysis tool • {pokemon.length} Records
            </p>
          </div>
          <div className="flex gap-2">
            {/* Toolbar Actions */}
             <button 
               onClick={() => {
                 const name = prompt("Enter column name:");
                 if (name) {
                    addDynamicColumn({
                        id: name.toLowerCase().replace(/\s+/g, '_'),
                        label: name,
                        type: 'text' // Default to text for now
                    });
                 }
               }}
               className="px-3 py-1.5 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
             >
               + Add Column
             </button>
             <button 
                onClick={handleExport}
                className="px-3 py-1.5 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
             >
               Export CSV
             </button>
             <button 
                onClick={() => setShowImporter(true)}
                className="px-3 py-1.5 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
             >
               Import CSV
             </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Main Content Area */}
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
            {/* Table Layer - Render if we have data */}
            {pokemon.length > 0 && (
                 <DataTable 
                    data={pokemon} 
                    dynamicColumns={dynamicColumns} 
                    onUpdateRow={updatePokemon} 
                />
            )}

            {/* Fetcher Layer - Conditional positioning */}
            {(status === 'idle' || status === 'fetching' || status === 'error') && (
                <div className={
                    pokemon.length === 0 
                        ? "absolute inset-0 flex items-center justify-center bg-white dark:bg-neutral-950 z-50" // Blocking initial state
                        : "absolute bottom-6 right-6 z-50 bg-white/90 dark:bg-neutral-900/90 shadow-xl rounded-xl border border-neutral-200 dark:border-neutral-800 backdrop-blur-sm p-4 w-80 animate-in slide-in-from-bottom-10 fade-in duration-300" // Floating overlay
                }>
                   <DataFetcher />
                </div>
            )}
        </div>
      </div>
      
      {status === 'ready' && <CommandBar />}
      {showImporter && <CsvImporter onClose={() => setShowImporter(false)} />}
    </main>
  );
}

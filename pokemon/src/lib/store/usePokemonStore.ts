import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { PokemonRow, FetchStatus, DynamicColumn, DynamicColumnType } from '../types';

// Custom IDB storage for Zustand
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    // console.log(name, 'has been retrieved');
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // console.log(name, 'with value', value, 'has been saved');
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    // console.log(name, 'has been deleted');
    await del(name);
  },
};

interface PokemonState {
  pokemon: PokemonRow[];
  status: FetchStatus;
  progress: { current: number; total: number };
  dynamicColumns: DynamicColumn[];
  
  setPokemon: (data: PokemonRow[]) => void;
  appendPokemon: (data: PokemonRow[]) => void;
  setStatus: (status: FetchStatus) => void;
  setProgress: (current: number, total: number) => void;
  
  updatePokemon: (id: string, patches: Partial<PokemonRow>) => void;
  updateManyPokemon: (ids: string[], patches: Partial<PokemonRow>) => void;
  deletePokemon: (ids: string[]) => void;

  addDynamicColumn: (column: DynamicColumn) => void;
  reset: () => void;
}

export const usePokemonStore = create<PokemonState>()(
  persist(
    (set) => ({
      pokemon: [],
      status: 'idle',
      progress: { current: 0, total: 0 },
      dynamicColumns: [],

      setPokemon: (data) => set({ pokemon: data }),
      
      appendPokemon: (data) => set((state) => ({ 
        pokemon: [...state.pokemon, ...data] 
      })),

      setStatus: (status) => set({ status }),
      
      setProgress: (current, total) => set({ progress: { current, total } }),
      
      updatePokemon: (id, patches) => set((state) => ({
        pokemon: state.pokemon.map((p) => 
          p.id === id ? { ...p, ...patches } : p
        )
      })),

      updateManyPokemon: (ids, patches) => set((state) => {
        const idSet = new Set(ids);
        return {
          pokemon: state.pokemon.map((p) => 
            idSet.has(p.id) ? { ...p, ...patches } : p
          )
        };
      }),

      deletePokemon: (ids) => set((state) => {
        const idSet = new Set(ids);
        return {
          pokemon: state.pokemon.filter((p) => !idSet.has(p.id))
        };
      }),
      
      addDynamicColumn: (column) => set((state) => {
        // Prevent duplicates
        if (state.dynamicColumns.some(c => c.id === column.id)) return state;

        const defaultValue = column.type === 'number' ? 0 
          : column.type === 'boolean' ? false 
          : '';

        return {
          dynamicColumns: [...state.dynamicColumns, column],
          pokemon: state.pokemon.map(p => ({
            ...p,
            [column.id]: defaultValue
          }))
        };
      }),

      reset: () => set({ pokemon: [], status: 'idle', progress: { current: 0, total: 0 }, dynamicColumns: [] }),
    }),
    {
      name: 'pokemon-storage',
      storage: createJSONStorage(() => storage),
      skipHydration: true, // We will manually hydrate or let it hydrate async. Zustand persist hydrates async by default with async storage.
    }
  )
);

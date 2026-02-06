import { PokemonRow } from './types';
import { normalizePokemonBatch } from './normalization';

const BASE_URL = 'https://pokeapi.co/api/v2';
const BATCH_SIZE = 20;

export async function fetchAllPokemon(
  onProgress?: (current: number, total: number) => void
): Promise<PokemonRow[]> {
  // 1. Fetch the list of all Pokemon to get the count and URLs
  const listRes = await fetch(`${BASE_URL}/pokemon?limit=2000`); // Fetch all (currently ~1300)
  const listData = await listRes.json();
  const total = listData.count;
  const results = listData.results as { name: string; url: string }[];
  
  // Filter out non-main forms? The requirement says "Fetch all Pokémon (~1300)".
  // Some results might be forms etc. standard PokeAPI /pokemon endpoint returns species/forms mixed?
  // Actually /pokemon returns everything. We'll stick to what it returns but maybe limit to actual 1025+ forms?
  // We will process all of them as requested.

  const allPokemon: PokemonRow[] = [];
  let processed = 0;

  // 2. Process in batches
  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE);
    
    // Fetch details in parallel
    const detailsPromises = batch.map(async (item) => {
      // We can use the URL provided or construct it. Using URL is safer.
      const res = await fetch(item.url);
      if (!res.ok) return null;
      return res.json();
    });

    const details = await Promise.all(detailsPromises);
    const validDetails = details.filter((d) => d !== null);

    // Normalize
    const normalizedBatch = await normalizePokemonBatch(validDetails);
    
    // Store/Accumulate
    allPokemon.push(...normalizedBatch);
    processed += batch.length;
    
    if (onProgress) {
        onProgress(Math.min(processed, results.length), results.length);
    }
    
    // Optional: Push to store incrementally here if we moved this logic to the prompt level, 
    // but the caller will handle the incremental store update if we yield results or use a callback.
    // For now, we return the full array, OR we can accept a callback to "onBatchComplete".
    // Requirement: "Dataset is normalized immediately and pushed to Zustand incrementally"
  }

  return allPokemon;
}

// Improved version that pushes to store incrementally
export async function fetchAndStorePokemon(
  updateStore: (data: PokemonRow[]) => void,
  updateProgress: (current: number, total: number) => void
) {
  const listRes = await fetch(`${BASE_URL}/pokemon?limit=2000`);
  const listData = await listRes.json();
  const results = listData.results as { name: string; url: string }[];
  const total = results.length; // Use actual result length, not count (count includes unreleased or filtered?)
  
  let processed = 0;

  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE);
    
    const detailsPromises = batch.map(async (item) => {
      try {
        const res = await fetch(item.url);
        if (!res.ok) return null;
        return res.json();
      } catch (e) {
        console.error(`Failed to fetch ${item.name}`, e);
        return null;
      }
    });

    const details = await Promise.all(detailsPromises);
    const validDetails = details.filter((d) => d !== null);

    const normalizedBatch = await normalizePokemonBatch(validDetails);
    
    // Push this batch to store
    updateStore(normalizedBatch);
    
    processed += batch.length;
    updateProgress(Math.min(processed, total), total);
  }
}

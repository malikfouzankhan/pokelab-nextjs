import { PokemonRow } from './types';

// Loose type for Raw PokeAPI data (we only define what we need)
interface RawPokemon {
  id: number;
  name: string;
  sprites: { front_default: string | null };
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string } }[];
  species: { url: string }; // We need to fetch species to get generation? "generation (via species)"
  // Fetching species for every pokemon doubles the requests (1300 -> 2600).
  // "Cache species fetches to avoid redundant requests"
}

// Simple in-memory cache for species urls (if many share the same species? No, 1:1 mostly, but Gen is on Species).
// Actually, caching species fetches implies we might fetch the same species multiple times? 
// Or maybe it means we should efficiently manage it.
// We will implement a `getGenerationFromSpecies` helper that fetches and caches.

const speciesCache = new Map<string, number>(); // URL -> Generation Number

async function getGeneration(speciesUrl: string): Promise<number> {
  if (speciesCache.has(speciesUrl)) {
    return speciesCache.get(speciesUrl)!;
  }
  
  try {
    const res = await fetch(speciesUrl);
    if (!res.ok) return 1; // Default
    const data = await res.json();
    // generation name is like "generation-i", "generation-ii". 
    // We parse "generation-x" or use the map.
    // data.generation.name
    
    const genName = data.generation?.name || 'generation-i';
    const genNum = parseGeneration(genName);
    
    speciesCache.set(speciesUrl, genNum);
    return genNum;
  } catch (e) {
    return 1;
  }
}

function parseGeneration(name: string): number {
  const roman = name.split('-')[1]?.toUpperCase();
  const romans: Record<string, number> = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9
  };
  return romans[roman] || 1;
}

export async function normalizePokemonBatch(batch: any[]): Promise<PokemonRow[]> {
  // We need to resolve species for all of them. 
  // We should do this in parallel.
  
  const promises = batch.map(async (p: RawPokemon) => {
    const generation = await getGeneration(p.species.url);
    
    // Extract stats
    const getStat = (name: string) => p.stats.find(s => s.stat.name === name)?.base_stat || 0;
    
    return {
      // id: crypto.randomUUID(), // strict UUID as per request "Rows receive generated UUIDs" (for CSV, but let's use it for all for consistency, or use p.id.toString() for API ones? "id: string; // internal hybrid ID". Let's use stringified ID for API ones to keep stable ID?)
      // Actually, if we re-fetch, UUID chages. Stable ID is better for API items. 
      // "Rows receive generated UUIDs if no ID exists" (CSV context).
      // Let's use `pokeapi-${p.id}` for stability.
      id: `pokeapi-${p.id}`,
      nationalId: p.id,
      name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
      sprite: p.sprites.front_default,
      types: p.types.map(t => t.type.name),
      generation,
      abilities: p.abilities.map(a => a.ability.name),
      
      hp: getStat('hp'),
      attack: getStat('attack'),
      defense: getStat('defense'),
      specialAttack: getStat('special-attack'),
      specialDefense: getStat('special-defense'),
      speed: getStat('speed'),
    };
  });

  return Promise.all(promises);
}

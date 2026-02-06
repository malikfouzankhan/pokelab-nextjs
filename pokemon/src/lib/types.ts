export type PokemonStats = {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
};

// We extend this to flatten the stats as required by the "Flat - Mandatory" rule for PokemonRow,
// but it's helpful to have the keys available for iteration.
export const STAT_KEYS: (keyof PokemonStats)[] = [
  "hp",
  "attack",
  "defense",
  "specialAttack",
  "specialDefense",
  "speed",
];

export type PokemonRow = {
  id: string;                 // internal hybrid ID
  nationalId: number;         // Pokédex number

  // Read-only fields
  name: string;
  sprite: string | null;
  types: string[];
  generation: number;
  abilities: string[];

  // Editable stats (TOP-LEVEL)
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;

  // Dynamic user-defined columns
  [key: string]: string | number | boolean | string[] | null | undefined;
};


export type FetchStatus = 'idle' | 'fetching' | 'processing' | 'ready' | 'error';

export type DynamicColumnType = 'text' | 'number' | 'boolean';

export type DynamicColumn = {
  id: string;
  label: string;
  type: DynamicColumnType;
};

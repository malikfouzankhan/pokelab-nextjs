import { PokemonRow } from './types';

export type CommandAction = 
  | { type: 'update'; field: string; value: any; filterField: string; filterValue: any }
  | { type: 'delete'; filterField: string; filterValue: any }
  | { type: 'unknown' };

export function parseCommand(command: string): CommandAction {
  const lower = command.toLowerCase().trim();
  
  const updateRegex = /^(?:set|update)\s+(\w+)\s+to\s+(.+?)\s+(?:where|for all pokemon of type)\s+(.+)$/;
  const deleteRegex = /^delete\s+(?:rows\s+)?where\s+(.+)$/;

  const updateMatch = lower.match(updateRegex);
  
  if (updateMatch) {
    const [, field, value, condition] = updateMatch;
    
    let filterField = 'unknown';
    let filterValue: any = condition;

    if (lower.includes('for all pokemon of type')) {
        filterField = 'types';
        filterValue = condition; 
    } else {
        const condParts = condition.split(/\s+is\s+/);
        if (condParts.length === 2) {
            filterField = condParts[0];
            filterValue = condParts[1];
        }
    }

    return {
        type: 'update',
        field: mapField(field),
        value: parseValue(value),
        filterField: mapField(filterField),
        filterValue: parseValue(filterValue)
    };
  }

  const deleteMatch = lower.match(deleteRegex);
  if (deleteMatch) {
     const condition = deleteMatch[1];
     const condParts = condition.split(/\s+is\s+/);
     if (condParts.length === 2) {
         return {
             type: 'delete',
             filterField: mapField(condParts[0]),
             filterValue: parseValue(condParts[1])
         };
     }
  }

  return { type: 'unknown' };
}

function mapField(field: string): string {
    const map: Record<string, string> = {
        'hp': 'hp',
        'attack': 'attack',
        'defense': 'defense',
        'sp. atk': 'specialAttack',
        'special attack': 'specialAttack',
        'sp. def': 'specialDefense',
        'special defense': 'specialDefense',
        'speed': 'speed',
        'gen': 'generation',
        'generation': 'generation',
        'name': 'name',
        'type': 'types',
        'types': 'types',
        'ability': 'abilities',
        'abilities': 'abilities'
    };
    return map[field] || field;
}

function parseValue(val: string): any {
    if (!isNaN(Number(val))) return Number(val);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
}

export function executeCommand(
    command: CommandAction, 
    rows: PokemonRow[],
    handlers: {
        updateMany: (ids: string[], patches: any) => void,
        delete: (ids: string[]) => void
    }
): { success: boolean; message: string } {
    if (command.type === 'unknown') return { success: false, message: "Could not understand command." };

    const { filterField, filterValue } = command as any;
    
    // Find matching rows
    const matches = rows.filter(row => {
        const val = row[filterField as keyof PokemonRow];
        if (Array.isArray(val)) {
            return val.some(v => v.toLowerCase() === String(filterValue).toLowerCase());
        }
        return String(val).toLowerCase() === String(filterValue).toLowerCase();
    });

    if (matches.length === 0) return { success: false, message: `No Pokémon found where ${filterField} is ${filterValue}` };

    const ids = matches.map(m => m.id);

    if (command.type === 'update') {
        const { field, value } = command as any;
        handlers.updateMany(ids, { [field]: value });
        return { success: true, message: `Updated ${matches.length} Pokémon.` };
    }

    if (command.type === 'delete') {
        handlers.delete(ids);
        return { success: true, message: `Deleted ${matches.length} Pokémon.` };
    }

    return { success: false, message: "Action failed." };
}

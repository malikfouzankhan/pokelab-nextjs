'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PokemonRow, DynamicColumn } from '@/lib/types';
import { ArrowUp, ArrowDown } from 'lucide-react';
import clsx from 'clsx';

// Constants
const ROW_HEIGHT = 48; // px

interface DataTableProps {
  data: PokemonRow[];
  dynamicColumns: DynamicColumn[];
  onUpdateRow: (id: string, patches: Partial<PokemonRow>) => void;
}

// Editable Cell Component
const EditableCell = ({
  getValue,
  row,
  column,
  table,
}: any) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { updateRow } = table.options.meta as { updateRow: (id: string, patches: any) => void };

  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      updateRow(row.original.id, { [column.id]: value });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      // Determine type based on column meta or current value
      const type = column.columnDef.meta?.type;
      
      let finalValue: any = value;
      if (type === 'number') finalValue = Number(value);
      if (type === 'boolean') finalValue = value === 'true';

      if (finalValue !== initialValue) {
         updateRow(row.original.id, { [column.id]: finalValue }); 
      }
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={value as string}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="w-full h-full bg-blue-50 px-2 outline-none text-right font-medium"
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)} 
      className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 h-full w-full flex items-center justify-end px-2 truncate"
      title={String(value)}
    >
      {String(value)}
    </div>
  );
};

export function DataTable({ data, dynamicColumns, onUpdateRow }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<PokemonRow>[]>(() => {
    const baseColumns: ColumnDef<PokemonRow>[] = [
      {
        accessorKey: 'nationalId',
        header: 'ID',
        size: 60,
        enableSorting: true,
        cell: info => <span className="font-mono text-xs text-neutral-500">#{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'sprite',
        header: 'Sprite',
        size: 60,
        enableSorting: false,
        cell: info => (
          info.getValue() ? <img src={info.getValue() as string} alt="" className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 bg-neutral-100 rounded-full" />
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 140,
        enableSorting: true,
        cell: info => <span className="font-medium text-neutral-900 dark:text-neutral-100">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'types',
        header: 'Type(s)',
        size: 140,
        cell: info => {
          const types = info.getValue() as string[];
          return (
            <div className="flex gap-1 flex-wrap">
              {types.map(t => (
                <span key={t} className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-neutral-100 dark:bg-neutral-800 rounded">{t}</span>
              ))}
            </div>
          );
        }
      },
      {
        accessorKey: 'generation',
        header: 'Gen',
        size: 50,
        cell: info => <span className="text-center block">{info.getValue() as number}</span>
      },
      ...(['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const).map(stat => ({
        accessorKey: stat,
        header: stat === 'specialAttack' ? 'Sp. Atk' : stat === 'specialDefense' ? 'Sp. Def' : stat.charAt(0).toUpperCase() + stat.slice(1),
        size: 70,
        cell: EditableCell,
        meta: { type: 'number' }
      })),
      ...dynamicColumns.map(col => ({
        accessorKey: col.id,
        header: col.label,
        cell: EditableCell,
        meta: { type: col.type }
      }))
    ];
    return baseColumns;
  }, [dynamicColumns]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: { updateRow: onUpdateRow },
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0 
    ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end 
    : 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
        <div ref={parentRef} className="flex-1 overflow-auto h-full w-full relative"> {/* Scroll Container */}
            <table className="w-full text-left text-sm border-collapse table-fixed">
                <thead className="sticky top-0 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 shadow-sm ring-1 ring-black/5">
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th
                                    key={header.id}
                                    style={{ width: header.getSize() }}
                                    className="p-3 font-semibold text-neutral-600 dark:text-neutral-400 select-none text-xs uppercase tracking-wide"
                                >
                                    <div
                                        className={clsx(
                                            "flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-200",
                                            header.column.getCanSort() ? "cursor-pointer" : "cursor-default"
                                        )}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {{
                                            asc: <ArrowUp className="w-3 h-3 ml-1 text-neutral-900 dark:text-neutral-100" />,
                                            desc: <ArrowDown className="w-3 h-3 ml-1 text-neutral-900 dark:text-neutral-100" />,
                                        }[header.column.getIsSorted() as string] ?? null}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {paddingTop > 0 && (
                        <tr>
                            <td style={{ height: `${paddingTop}px` }} />
                        </tr>
                    )}
                    {virtualItems.map(virtualRow => {
                        const row = rows[virtualRow.index];
                        return (
                            <tr
                                key={row.id}
                                className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                                style={{ height: `${virtualRow.size}px` }}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="p-0 border-r border-transparent group-hover:border-neutral-200 dark:group-hover:border-neutral-800 last:border-0">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                    {paddingBottom > 0 && (
                        <tr>
                            <td style={{ height: `${paddingBottom}px` }} />
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}

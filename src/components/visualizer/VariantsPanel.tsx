'use client';

import { useState, useEffect } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Variant } from '@/core/models';

const columns: ColumnDef<Variant>[] = [
  {
    accessorKey: 'gene',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Gene
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const gene = row.getValue('gene') as string | undefined;
      const chrom = row.original.chrom;
      const pos = row.original.pos;
      return gene || (chrom && pos ? `${chrom}:${pos}` : '-');
    },
  },
  {
    accessorKey: 'hgvs',
    header: 'HGVS',
    cell: ({ row }) => {
      const hgvs = row.getValue('hgvs') as string | undefined;
      const hgvs_p = row.original.hgvs_p;
      const hgvs_c = row.original.hgvs_c;
      return hgvs || hgvs_p || hgvs_c || '-';
    },
  },
  {
    accessorKey: 'effect',
    header: 'Effect',
    cell: ({ row }) => {
      const effect = row.getValue('effect') as string | undefined;
      return effect || '-';
    },
  },
  {
    accessorKey: 'vaf',
    header: 'VAF',
    cell: ({ row }) => {
      const vaf = row.getValue('vaf') as number | undefined;
      return vaf ? `${(vaf * 100).toFixed(1)}%` : '-';
    },
  },
  {
    accessorKey: 'depth',
    header: 'Depth',
    cell: ({ row }) => {
      const depth = row.getValue('depth') as number | undefined;
      return depth || '-';
    },
  },
  {
    accessorKey: 'zygosity',
    header: 'Zygosity',
    cell: ({ row }) => {
      const zygosity = row.getValue('zygosity') as string | undefined;
      return zygosity || '-';
    },
  },
  {
    accessorKey: 'clinvarId',
    header: 'ClinVar',
    cell: ({ row }) => {
      const clinvarId = row.getValue('clinvarId') as string | undefined;
      return clinvarId ? (
        <a
          href={`https://www.ncbi.nlm.nih.gov/clinvar/${clinvarId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {clinvarId}
        </a>
      ) : '-';
    },
  },
  {
    accessorKey: 'oncokbLevel',
    header: 'OncoKB',
    cell: ({ row }) => {
      const level = row.getValue('oncokbLevel') as string | undefined;
      return level ? (
        <span className="font-mono bg-blue-100 px-2 py-1 rounded">
          {level}
        </span>
      ) : '-';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const variant = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(variant.hgvs || '')}
            >
              Copy HGVS
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // This will be implemented to show evidence
                console.log('Show evidence for', variant.gene);
              }}
            >
              View Evidence
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface VariantsPanelProps {
  variants: Variant[];
  selectedVariant?: Variant;
  onVariantSelect: (variant: Variant) => void;
  onFilteredVariantsChange: (variants: Variant[]) => void;
}

export function VariantsPanel({
  variants,
  selectedVariant,
  onVariantSelect,
  onFilteredVariantsChange,
}: VariantsPanelProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: variants,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Update filtered variants when sorting or filtering changes
  useEffect(() => {
    const filtered = table.getFilteredRowModel().rows.map(row => row.original);
    onFilteredVariantsChange(filtered);
  }, [sorting, columnFilters, table, onFilteredVariantsChange]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={(
                    selectedVariant &&
                    row.original.gene === selectedVariant.gene &&
                    row.original.hgvs === selectedVariant.hgvs
                  ) ? 'selected' : undefined}
                  onClick={() => onVariantSelect(row.original)}
                  className={cn(
                    'cursor-pointer hover:bg-muted',
                    selectedVariant &&
                    row.original.gene === selectedVariant.gene &&
                    row.original.hgvs === selectedVariant.hgvs
                      ? 'bg-muted'
                      : ''
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No variants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

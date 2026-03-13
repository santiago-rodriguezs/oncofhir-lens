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
import { ArrowUpDown, MoreHorizontal, Dna, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
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

// ── VAF bar ──
function VafBar({ vaf }: { vaf: number }) {
  const pct = Math.min(vaf * 100, 100);
  const color =
    pct >= 40 ? 'bg-red-500' : pct >= 20 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono">{(vaf * 100).toFixed(1)}%</span>
    </div>
  );
}

// ── OncoKB level color ──
function OncoKBBadge({ level }: { level: string }) {
  const colorClass = level.includes('1')
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : level.includes('2')
    ? 'bg-blue-100 text-blue-800 border-blue-300'
    : level.includes('3')
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : level.includes('R')
    ? 'bg-red-100 text-red-800 border-red-300'
    : 'bg-slate-100 text-slate-800 border-slate-300';
  return (
    <Badge variant="outline" className={`text-xs font-mono ${colorClass}`}>
      {level}
    </Badge>
  );
}

// ── ClinVar significance badge ──
function ClinVarBadge({ significance }: { significance: string }) {
  const lower = significance.toLowerCase();
  const colorClass = lower.includes('pathogenic')
    ? 'border-red-300 text-red-700 bg-red-50'
    : lower.includes('benign')
    ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
    : lower.includes('uncertain')
    ? 'border-amber-300 text-amber-700 bg-amber-50'
    : '';
  return (
    <Badge variant="outline" className={`text-xs ${colorClass}`}>
      {significance}
    </Badge>
  );
}

const columns: ColumnDef<Variant>[] = [
  {
    accessorKey: 'gene',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="font-semibold"
      >
        Gen
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const gene = row.getValue('gene') as string | undefined;
      const chrom = row.original.chrom;
      const pos = row.original.pos;
      return (
        <span className="font-semibold text-blue-700">
          {gene || (chrom && pos ? `${chrom}:${pos}` : '-')}
        </span>
      );
    },
  },
  {
    accessorKey: 'hgvs',
    header: 'HGVS',
    cell: ({ row }) => {
      const hgvs_p = row.original.hgvs_p;
      const hgvs_c = row.original.hgvs_c;
      const hgvs = row.getValue('hgvs') as string | undefined;
      return (
        <span className="font-mono text-xs">
          {hgvs_p || hgvs_c || hgvs || '-'}
        </span>
      );
    },
  },
  {
    accessorKey: 'effect',
    header: 'Efecto',
    cell: ({ row }) => {
      const effect = row.getValue('effect') as string | undefined;
      return <span className="text-xs">{effect || '-'}</span>;
    },
  },
  {
    accessorKey: 'vaf',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        VAF
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const vaf = row.getValue('vaf') as number | undefined;
      return vaf != null ? <VafBar vaf={vaf} /> : <span className="text-xs text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: 'depth',
    header: 'Prof.',
    cell: ({ row }) => {
      const depth = row.getValue('depth') as number | undefined;
      return depth != null ? (
        <span className={`text-xs font-mono ${depth < 100 ? 'text-amber-600' : ''}`}>
          {depth}x
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: 'clinvarSignificance',
    header: 'ClinVar',
    cell: ({ row }) => {
      const sig = row.original.clinvarSignificance || row.original.clinvarData?.clinicalSignificance;
      const clinvarId = row.original.clinvarId;
      if (!sig && !clinvarId) return <span className="text-xs text-muted-foreground">-</span>;
      return (
        <div className="flex items-center gap-1">
          {sig && <ClinVarBadge significance={sig} />}
          {clinvarId && !sig && (
            <a
              href={`https://www.ncbi.nlm.nih.gov/clinvar/${clinvarId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs"
            >
              {clinvarId}
            </a>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'oncokbLevel',
    header: 'OncoKB',
    cell: ({ row }) => {
      const level = row.getValue('oncokbLevel') as string | undefined;
      if (!level || level === 'Unknown' || level === 'N/A') {
        return <span className="text-xs text-muted-foreground">-</span>;
      }
      return <OncoKBBadge level={level} />;
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
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(
                  variant.hgvs_p || variant.hgvs_c || variant.hgvs || ''
                )
              }
            >
              Copiar HGVS
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log('Show evidence for', variant.gene)}
            >
              Ver evidencia
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

  useEffect(() => {
    const filtered = table.getFilteredRowModel().rows.map((row) => row.original);
    onFilteredVariantsChange(filtered);
  }, [sorting, columnFilters, table, onFilteredVariantsChange]);

  // Quick stats
  const uniqueGenes = [...new Set(variants.map((v) => v.gene).filter(Boolean))];
  const actionable = variants.filter(
    (v) => v.oncokbLevel && !['Unknown', 'N/A', ''].includes(v.oncokbLevel)
  );
  const pathogenic = variants.filter(
    (v) =>
      v.clinvarSignificance?.toLowerCase().includes('pathogenic') ||
      v.clinvarData?.clinicalSignificance?.toLowerCase().includes('pathogenic')
  );
  const vafs = variants.filter((v) => v.vaf != null).map((v) => v.vaf!);
  const maxVaf = vafs.length > 0 ? Math.max(...vafs) : null;

  return (
    <div className="space-y-4">
      {/* ── Quick insights strip ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
          <Dna className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">
            {variants.length} variantes en {uniqueGenes.length} genes
          </span>
        </div>
        {actionable.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <Target className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">
              {actionable.length} accionable{actionable.length > 1 ? 's' : ''} (OncoKB)
            </span>
          </div>
        )}
        {pathogenic.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            <span className="text-xs font-medium text-red-700">
              {pathogenic.length} patogénica{pathogenic.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
        {maxVaf != null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
            <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              VAF máx: {(maxVaf * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* ── Table ── */}
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
                  data-state={
                    selectedVariant &&
                    row.original.gene === selectedVariant.gene &&
                    row.original.hgvs === selectedVariant.hgvs
                      ? 'selected'
                      : undefined
                  }
                  onClick={() => onVariantSelect(row.original)}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50',
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
                  No se encontraron variantes.
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
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

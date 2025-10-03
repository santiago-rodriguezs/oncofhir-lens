'use client';

import { useState, useMemo } from 'react';
import { useTable, useSortBy, useFilters, useGlobalFilter, usePagination } from 'react-table';
import { ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Variant } from '@/types/fhir';

interface VariantTableProps {
  variants: Variant[];
  onSelectVariant: (variant: Variant) => void;
}

// Custom filter for selecting options
function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}: any) {
  const options = useMemo(() => {
    const optionSet = new Set<string>();
    preFilteredRows.forEach((row: any) => {
      if (row.values[id] !== undefined && row.values[id] !== null) {
        optionSet.add(row.values[id]);
      }
    });
    // Convertir Set a Array usando Array.from en lugar de spread operator
    return Array.from(optionSet).sort();
  }, [id, preFilteredRows]);

  return (
    <select
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
      value={filterValue}
      onChange={e => {
        setFilter(e.target.value || undefined);
      }}
    >
      <option value="">Todos</option>
      {options.map((option, i) => (
        <option key={i} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export default function VariantTable({ variants, onSelectVariant }: VariantTableProps) {
  const [filterInput, setFilterInput] = useState('');
  
  const columns = useMemo(() => [
    {
      Header: 'Gen',
      accessor: 'gene',
      Filter: SelectColumnFilter,
    },
    {
      Header: 'HGVS',
      accessor: 'hgvs',
    },
    {
      Header: 'Consecuencia',
      accessor: 'consequence',
      Filter: SelectColumnFilter,
    },
    {
      Header: 'ClinVar',
      accessor: 'clinvarSignificance',
      Filter: SelectColumnFilter,
    },
    {
      Header: 'VAF',
      accessor: 'vaf',
      Cell: ({ value }: { value: number }) => value ? `${(value * 100).toFixed(2)}%` : 'N/A',
    },
    {
      Header: 'Evidencia',
      accessor: 'evidenceLevel',
      Filter: SelectColumnFilter,
    },
  ], []);
  
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    setGlobalFilter,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: variants,
      initialState: { pageSize: 10 },
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || '';
    setGlobalFilter(value);
    setFilterInput(value);
  };
  
  if (variants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron variantes para este caso.
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div className="relative rounded-md shadow-sm max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={filterInput}
            onChange={handleFilterChange}
            placeholder="Buscar variantes..."
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
          />
        </div>
        
        <div className="flex space-x-2">
          {headerGroups.map((headerGroup) => (
            <div key={headerGroup.id} className="flex space-x-2">
              {headerGroup.headers.map((column: any) => (
                column.Filter ? (
                  <div key={column.id} className="flex items-center">
                    <label className="mr-2 text-sm font-medium text-gray-700">
                      {column.render('Header')}:
                    </label>
                    {column.render('Filter')}
                  </div>
                ) : null
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="table-header"
                  >
                    <div className="flex items-center">
                      {column.render('Header')}
                      <span>
                        {column.isSorted ? (
                          column.isSortedDesc ? (
                            <ChevronDownIcon className="ml-1 h-4 w-4" />
                          ) : (
                            <ChevronUpIcon className="ml-1 h-4 w-4" />
                          )
                        ) : (
                          ''
                        )}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            {...getTableBodyProps()}
            className="bg-white divide-y divide-gray-200"
          >
            {page.map(row => {
              prepareRow(row);
              return (
                <tr
                  {...row.getRowProps()}
                  onClick={() => onSelectVariant(row.original)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  {row.cells.map(cell => (
                    <td
                      {...cell.getCellProps()}
                      className="table-cell"
                    >
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="py-3 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="btn-secondary"
          >
            Anterior
          </button>
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className="btn-secondary"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div className="flex gap-x-2 items-center">
            <span className="text-sm text-gray-700">
              Página <span className="font-medium">{pageIndex + 1}</span> de{' '}
              <span className="font-medium">{pageOptions.length}</span>
            </span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              {[10, 20, 30, 40, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  Mostrar {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Primera</span>
                {'<<'}
              </button>
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Anterior</span>
                {'<'}
              </button>
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Siguiente</span>
                {'>'}
              </button>
              <button
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Última</span>
                {'>>'}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

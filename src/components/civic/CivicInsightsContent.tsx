'use client';

import { useState } from 'react';
import { useCivicEvidence, useFilteredCivicResults } from '@/lib/civic/hooks';
import { CivicAnnotation } from '@/lib/civic/client';
import CivicFilterBar from './CivicFilterBar';
import CivicSummaryCards from './CivicSummaryCards';
import CivicDrugsTable from './CivicDrugsTable';
import CivicVariantDetails from './CivicVariantDetails';

interface CivicInsightsContentProps {
  annotations: CivicAnnotation[];
}

export default function CivicInsightsContent({ annotations }: CivicInsightsContentProps) {
  // State for filters
  const [filters, setFilters] = useState({
    tumorType: '',
    evidenceLevel: [] as string[],
    onlyFdaApproved: false,
    predictiveOnly: true,
  });

  // Fetch CIViC evidence
  const { 
    data: civicResults, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useCivicEvidence(annotations);

  // Apply filters to results
  const { filteredResults, filteredDrugs } = useFilteredCivicResults(civicResults, filters);

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Consultando CIViC API...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">Error al consultar CIViC: {error?.message || 'Error desconocido'}</p>
          <button 
            onClick={() => refetch()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Empty state (no results after filtering)
  if (filteredResults.length === 0 || filteredResults.every(r => r.evidences.length === 0)) {
    return (
      <div className="py-8">
        <CivicFilterBar filters={filters} onFilterChange={handleFilterChange} />
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mt-6">
          <p className="text-gray-600">
            No se encontraron resultados en CIViC para las variantes proporcionadas con los filtros actuales.
          </p>
          {filters.tumorType || filters.evidenceLevel.length > 0 || filters.onlyFdaApproved ? (
            <p className="mt-2 text-sm text-gray-500">
              Pruebe a ajustar los filtros para ver más resultados.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  // Partial results (some variants without matches)
  const hasPartialResults = civicResults?.some(result => !result.matchedVariant);

  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <CivicFilterBar filters={filters} onFilterChange={handleFilterChange} />
      
      {/* Warning for partial results */}
      {hasPartialResults && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">
            Algunas variantes no pudieron ser encontradas en CIViC. Los resultados mostrados son parciales.
          </p>
        </div>
      )}
      
      {/* Summary cards */}
      <CivicSummaryCards 
        results={filteredResults} 
        drugs={filteredDrugs} 
      />
      
      {/* Drugs table */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Drogas Sugeridas</h2>
        <CivicDrugsTable drugs={filteredDrugs} />
      </div>
      
      {/* Variant details */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Detalle por Variante</h2>
        <CivicVariantDetails results={filteredResults} />
      </div>
    </div>
  );
}

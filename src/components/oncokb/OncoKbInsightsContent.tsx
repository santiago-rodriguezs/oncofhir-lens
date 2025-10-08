'use client';

import { useState } from 'react';
import { useOncoKbEvidence, useFilteredOncoKbResults, getAvailableLevels } from '@/lib/oncokb/hooks';
import { OncoKbAnnotation } from '@/lib/oncokb/client';
import OncoKbFilterBar from './OncoKbFilterBar';
import OncoKbSummaryCards from './OncoKbSummaryCards';
import OncoKbDrugsTable from './OncoKbDrugsTable';
import OncoKbVariantDetails from './OncoKbVariantDetails';

interface OncoKbInsightsContentProps {
  annotations: Array<{ 
    geneSymbol: string; 
    variant?: string; 
    hgvs?: string; 
    tumorType?: string; 
    referenceGenome?: "GRCh37" | "GRCh38"; 
    alterationType?: "MUTATION" | "CNA" | "SV" 
  }>;
}

export default function OncoKbInsightsContent({ annotations }: OncoKbInsightsContentProps) {
  // State for filters
  const [filters, setFilters] = useState({
    tumorType: '',
    evidenceType: 'all' as 'sensitive' | 'resistance' | 'all',
    levels: [] as string[],
  });

  // Debug information
  console.log('Annotations received:', annotations.length);
  console.log('Sample annotation:', annotations[0]);
  
  // We're using the API route now, so we don't need to check for the token
  const isOncoKbConfigured = true;

  // Fetch OncoKB evidence
  const { 
    data: oncoKbResults, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useOncoKbEvidence(annotations, isOncoKbConfigured);

  // Get available levels for filtering
  const availableLevels = getAvailableLevels(oncoKbResults);

  // Apply filters to results
  const { filteredResults, suggestedDrugs } = useFilteredOncoKbResults(oncoKbResults, filters);

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Not configured state
  if (!isOncoKbConfigured) {
    return (
      <div className="py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">
            Error al conectar con la API de OncoKB. Por favor, contacte al administrador del sistema.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Consultando OncoKB API...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">Error al consultar OncoKB: {error?.message || 'Error desconocido'}</p>
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
  if (!filteredResults || filteredResults.length === 0 || filteredResults.every(r => !r.treatments || r.treatments.length === 0)) {
    return (
      <div className="py-8">
        <OncoKbFilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          availableLevels={availableLevels}
        />
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mt-6">
          <p className="text-gray-600">
            No se encontraron resultados en OncoKB para las variantes proporcionadas con los filtros actuales.
          </p>
          {filters.tumorType || filters.levels.length > 0 || filters.evidenceType !== 'all' ? (
            <p className="mt-2 text-sm text-gray-500">
              Pruebe a ajustar los filtros para ver más resultados.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <OncoKbFilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        availableLevels={availableLevels}
      />
      
      {/* Summary cards */}
      <OncoKbSummaryCards 
        results={filteredResults} 
        drugs={suggestedDrugs} 
      />
      
      {/* Drugs table */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Drogas Sugeridas</h2>
        <OncoKbDrugsTable drugs={suggestedDrugs} />
      </div>
      
      {/* Variant details */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Detalle por Variante</h2>
        <OncoKbVariantDetails results={filteredResults} />
      </div>
    </div>
  );
}

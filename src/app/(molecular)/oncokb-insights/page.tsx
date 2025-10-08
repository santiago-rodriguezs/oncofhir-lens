'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OncoKbInsightsContent from '@/components/oncokb/OncoKbInsightsContent';

// Create a client
const queryClient = new QueryClient();

type AnnotationType = {
  geneSymbol: string;
  variant?: string;
  hgvs?: string;
  tumorType?: string;
  referenceGenome?: "GRCh37" | "GRCh38";
  alterationType?: "MUTATION" | "CNA" | "SV";
};

export default function OncoKbInsightsPage() {
  const searchParams = useSearchParams();
  const [annotations, setAnnotations] = useState<AnnotationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get annotations from URL params
    const annotationsParam = searchParams.get('annotations');
    
    if (annotationsParam) {
      try {
        const decodedAnnotations = JSON.parse(decodeURIComponent(annotationsParam));
        setAnnotations(decodedAnnotations);
      } catch (error) {
        console.error('Error parsing annotations from URL:', error);
      }
    }
    
    setIsLoading(false);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-pulse space-y-8">
          <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">OncoKB Insights</h1>
        
        {annotations.length === 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm text-yellow-700">
              No se encontraron anotaciones para analizar. Por favor, regrese a la página anterior y genere anotaciones primero.
            </p>
          </div>
        ) : (
          <OncoKbInsightsContent annotations={annotations} />
        )}
      </div>
    </QueryClientProvider>
  );
}

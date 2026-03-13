'use client';

import { useState, useEffect } from 'react';
import { CaseList } from '@/components/CaseList';

export default function CasesPage() {
  const [cases, setCases] = useState<Array<{
    id: string;
    patientId: string;
    label: string;
    date: string;
    variantCount: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('/api/cases');
        
        if (!response.ok) {
          throw new Error('Error fetching cases');
        }
        
        const data = await response.json();
        setCases(data);
      } catch (err) {
        setError('Error loading cases');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCases();
  }, []);
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="max-w-md mx-auto text-center space-y-3 py-16">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="font-medium text-slate-800">No se pudieron cargar los casos</p>
          <p className="text-sm text-slate-500">
            Es posible que la base de datos no esté disponible desde esta red.
            Los casos se almacenan en memoria mientras tanto.
          </p>
          <a href="/" className="inline-block text-sm text-blue-600 hover:underline mt-2">
            Ir a Inicio y procesar un caso
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Casos Anteriores</h1>
      {cases.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-slate-500">No hay casos procesados todavía</p>
          <a href="/" className="inline-block text-sm text-blue-600 hover:underline">
            Procesar un estudio genómico
          </a>
        </div>
      ) : (
        <CaseList cases={cases} />
      )}
    </div>
  );
}

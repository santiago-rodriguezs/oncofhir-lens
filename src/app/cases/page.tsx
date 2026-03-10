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
        <div className="text-center text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Casos Anteriores</h1>
      <CaseList cases={cases} />
    </div>
  );
}

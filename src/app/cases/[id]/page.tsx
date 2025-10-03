'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import VariantTable from '@/components/VariantTable';
import VariantDrawer from '@/components/VariantDrawer';
import TherapyCards from '@/components/TherapyCards';
import { Variant, DetectedIssue, CaseData } from '@/types/fhir';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function CasePage() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/cases/${id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEMO_SECRET}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener datos del caso');
        }
        
        const data = await response.json();
        setCaseData(data);
      } catch (err) {
        setError('Error al cargar datos del caso');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchCaseData();
    }
  }, [id]);
  
  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    setIsDrawerOpen(true);
  };
  
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };
  
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-pulse space-y-8">
          <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error || !caseData) {
    return (
      <div className="py-12 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md inline-block">
          {error || 'Caso no encontrado'}
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Caso: {caseData.specimen.identifier ? caseData.specimen.identifier[0]?.value : id}
            </h1>
            <p className="text-gray-600">
              Paciente: {caseData.patient.name ? caseData.patient.name[0]?.text || caseData.patient.name[0]?.family : caseData.patient.id}
              {caseData.specimen.collection?.collectedDateTime && (
                <> • Recolectado: {new Date(caseData.specimen.collection.collectedDateTime).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
        
        {caseData.detectedIssues && caseData.detectedIssues.length > 0 && (
          <TherapyCards issues={caseData.detectedIssues} />
        )}
        
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Variantes Genómicas</h2>
          <VariantTable 
            variants={caseData.variants} 
            onSelectVariant={handleVariantSelect}
          />
        </div>
        
        <VariantDrawer 
          variant={selectedVariant} 
          isOpen={isDrawerOpen} 
          onClose={handleCloseDrawer}
        />
      </div>
    </ErrorBoundary>
  );
}

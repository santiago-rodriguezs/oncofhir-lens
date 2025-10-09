'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import FhirBundleViewer from '@/components/FhirBundleViewer';
import { Skeleton } from "@/components/ui/skeleton";

interface FhirPanelProps {
  caseId: string;
}

export function FhirPanel({ caseId }: FhirPanelProps) {
  const [bundle, setBundle] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBundle() {
      try {
        setLoading(true);
        console.log('[FhirPanel] Fetching FHIR bundle for case:', caseId);
        const response = await fetch(`/api/cases/${caseId}/fhir`);
        
        console.log('[FhirPanel] Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[FhirPanel] Error response:', errorText);
          throw new Error(`Failed to generate FHIR bundle: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('[FhirPanel] Received bundle:', data);
        setBundle(data.bundle);
      } catch (err) {
        console.error('[FhirPanel] Error fetching FHIR bundle:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchBundle();
  }, [caseId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p className="font-semibold">Error loading FHIR Bundle</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  if (!bundle) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No FHIR bundle available
        </div>
      </Card>
    );
  }

  return <FhirBundleViewer bundle={bundle as any} />;
}

export default FhirPanel;

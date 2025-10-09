import { notFound } from 'next/navigation';
import { VisualizerClient } from './VisualizerClient';
import { Case, CaseService } from '@/lib/cases/service';

async function getCaseData(caseId: string): Promise<Case | null> {
  try {
    // Directly access CaseService since this is a server component
    const caseData = await CaseService.get(caseId);
    return caseData;
  } catch (error) {
    console.error('Error fetching case data:', error);
    return null;
  }
}

interface PageProps {
  params: {
    caseId: string;
  };
  searchParams: {
    tab?: string;
    variant?: string;
  };
}

export default async function VisualizerPage({ params }: PageProps) {
  const data = await getCaseData(params.caseId);
  
  if (!data) {
    notFound();
  }

  return <VisualizerClient caseId={params.caseId} initialData={data} />;
}

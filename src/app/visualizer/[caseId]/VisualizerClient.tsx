'use client';

import { Suspense, useEffect } from 'react';
import { VisualizerHeader } from '@/components/visualizer/VisualizerHeader';
import { SummaryPanel } from '@/components/visualizer/SummaryPanel';
import { VariantsPanel } from '@/components/visualizer/VariantsPanel';
import { AnnotationsPanel } from '@/components/visualizer/AnnotationsPanel';
import { TherapiesPanel } from '@/components/visualizer/TherapiesPanel';
import { ReportViewerPanel } from '@/components/visualizer/ReportViewerPanel';
import { QCPanel } from '@/components/visualizer/QCPanel';
import { AuditPanel } from '@/components/visualizer/AuditPanel';
import { FhirPanel } from '@/components/visualizer/FhirPanel';
import { ClinicalInsightsPanel } from '@/components/visualizer/ClinicalInsightsPanel';
import { TumorBoardChat } from '@/components/visualizer/TumorBoardChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useVisualizerNavigation } from '@/lib/hooks/useVisualizerNavigation';
import { useVisualizerStore } from '@/lib/store/visualizer';
import { CaseMetadata, Variant, Evidence, Therapy, QualityControl } from '@/core/models';

interface VisualizerClientProps {
  caseId: string;
  initialData: {
    metadata: CaseMetadata;
    variants: Variant[];
    evidence: Evidence[];
    therapies: Therapy[];
    qc: QualityControl;
    annotationErrors?: { source: string; message: string }[];
    extractedText?: string[];
    highlights?: Array<{
      pageNumber: number;
      text: string;
      type: 'variant' | 'evidence' | 'therapy';
    }>;
    parsingDetails?: any;
    auditEntries?: any[];
  };
}

export function VisualizerClient({ caseId, initialData }: VisualizerClientProps) {
  const { setTab, currentTab } = useVisualizerNavigation();
  const {
    selectedVariant,
    setSelectedVariant,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    navigateVariants,
    clearSelections,
    setFilteredVariants,
  } = useVisualizerStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector(
          '[data-search-input="true"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Esc: Clear selection
      if (e.key === 'Escape') {
        clearSelections();
      }

      // Left/Right arrows: Navigate variants
      if (e.key === 'ArrowLeft') {
        navigateVariants('previous');
      } else if (e.key === 'ArrowRight') {
        navigateVariants('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelections, navigateVariants]);

  return (
    <div className="flex min-h-screen flex-col">
      <VisualizerHeader 
        metadata={initialData.metadata}
        onSearch={setSearchQuery}
        onFilterChange={setFilters}
      />
      
      <main className="flex-1 container py-6">
        <Tabs value={currentTab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
            <TabsTrigger value="variants">Variantes</TabsTrigger>
            <TabsTrigger value="annotations">Anotaciones</TabsTrigger>
            <TabsTrigger value="therapies">Terapias</TabsTrigger>
            {initialData.metadata.reportSource === 'PDF' && (
              <TabsTrigger value="report">Visor de Reporte</TabsTrigger>
            )}
            <TabsTrigger value="insights">Insights Clínicos</TabsTrigger>
            <TabsTrigger value="chat">Tumor Board</TabsTrigger>
            <TabsTrigger value="fhir">FHIR Bundle</TabsTrigger>
            <TabsTrigger value="qc">QC y Procedencia</TabsTrigger>
            <TabsTrigger value="audit">Auditoría y Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Suspense fallback={<TabSkeleton />}>
              <SummaryPanel
                metadata={initialData.metadata}
                qc={initialData.qc}
                variantCount={initialData.variants.length}
                evidenceCount={initialData.evidence.length}
                therapyCount={initialData.therapies.length}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="variants">
            <Suspense fallback={<TabSkeleton />}>
              <VariantsPanel
                variants={initialData.variants}
                selectedVariant={selectedVariant}
                onVariantSelect={setSelectedVariant}
                onFilteredVariantsChange={setFilteredVariants}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="annotations">
            <Suspense fallback={<TabSkeleton />}>
              <AnnotationsPanel
                selectedVariant={selectedVariant}
                evidence={initialData.evidence}
                annotationErrors={initialData.annotationErrors}
                onEvidenceSelect={(evidence) => {
                  // Handle evidence selection
                  console.log('Selected evidence:', evidence);
                }}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="therapies">
            <Suspense fallback={<TabSkeleton />}>
              <TherapiesPanel
                therapies={initialData.therapies}
                evidence={initialData.evidence}
                onTherapySelect={(therapy) => {
                  // Handle therapy selection
                  console.log('Selected therapy:', therapy);
                }}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="report">
            <Suspense fallback={<TabSkeleton />}>
              <ReportViewerPanel
                pdfUrl={initialData.metadata.reportSource === 'PDF' ? `/api/reports/${caseId}/pdf` : undefined}
                selectedVariant={selectedVariant}
                extractedText={initialData.extractedText || []}
                highlights={initialData.highlights || []}
                onHighlightClick={(highlight) => {
                  // Handle highlight click
                  console.log('Clicked highlight:', highlight);
                }}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="insights">
            <Suspense fallback={<TabSkeleton />}>
              <ClinicalInsightsPanel
                variants={initialData.variants}
                evidence={initialData.evidence}
                therapies={initialData.therapies}
                tumorType={initialData.metadata.tumorType}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="chat">
            <Suspense fallback={<TabSkeleton />}>
              <TumorBoardChat
                variants={initialData.variants}
                evidence={initialData.evidence}
                therapies={initialData.therapies}
                tumorType={initialData.metadata.tumorType}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="fhir">
            <Suspense fallback={<TabSkeleton />}>
              <FhirPanel caseId={caseId} />
            </Suspense>
          </TabsContent>

          <TabsContent value="qc">
            <Suspense fallback={<TabSkeleton />}>
              <QCPanel
                qc={initialData.qc}
                parsingDetails={initialData.parsingDetails}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="audit">
            <Suspense fallback={<TabSkeleton />}>
              <AuditPanel
                entries={initialData.auditEntries || []}
                onAddNote={async (note) => {
                  // Handle adding a new note
                  await fetch(`/api/cases/${caseId}/notes`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content: note }),
                  });
                }}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function TabSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-8 w-full" />
        <div className="grid gap-4 grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    </Card>
  );
}

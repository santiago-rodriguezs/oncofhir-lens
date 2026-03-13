'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useVisualizerNavigation } from '@/lib/hooks/useVisualizerNavigation';
import { useVisualizerStore } from '@/lib/store/visualizer';
import { CaseMetadata, Variant, Evidence, Therapy, QualityControl } from '@/core/models';
import { Loader2 } from 'lucide-react';

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

  // Progressive enrichment state
  const [variants, setVariants] = useState(initialData.variants);
  const [evidence, setEvidence] = useState(initialData.evidence);
  const [therapies, setTherapies] = useState(initialData.therapies);
  const [annotationErrors, setAnnotationErrors] = useState(initialData.annotationErrors);
  const [enriching, setEnriching] = useState(false);
  const [enriched, setEnriched] = useState(false);

  // Check if slow sources are already present
  const hasSlowSources = useCallback(() => {
    return evidence.some(
      (e) => e.source === 'CIViC' || e.source === 'PharmGKB' || e.source === 'gnomAD'
    );
  }, [evidence]);

  // Progressive enrichment: fetch slow annotations on mount
  useEffect(() => {
    if (enriching || enriched || hasSlowSources()) return;

    const enrich = async () => {
      setEnriching(true);
      try {
        const res = await fetch(`/api/cases/${caseId}/enrich`, { method: 'POST' });
        const data = await res.json();

        if (data.status === 'enriched' || data.status === 'already_enriched') {
          setVariants(data.variants || variants);
          setEvidence(data.evidence || evidence);
          setTherapies(data.therapies || therapies);
          if (data.errors?.length > 0) {
            setAnnotationErrors((prev) => [...(prev || []), ...data.errors]);
          }
        }
      } catch (err) {
        console.error('[Enrichment] Failed:', err);
      } finally {
        setEnriching(false);
        setEnriched(true);
      }
    };

    enrich();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector(
          '[data-search-input="true"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      if (e.key === 'Escape') {
        clearSelections();
      }

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
        {/* Enrichment status banner */}
        {enriching && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">
              Cargando fuentes adicionales: CIViC, PharmGKB, gnomAD...
            </span>
            <div className="ml-auto flex gap-1.5">
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">CIViC</Badge>
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">PharmGKB</Badge>
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">gnomAD</Badge>
            </div>
          </div>
        )}

        <Tabs value={currentTab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
            <TabsTrigger value="variants">Variantes</TabsTrigger>
            <TabsTrigger value="annotations">
              Anotaciones
              {enriching && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
            </TabsTrigger>
            <TabsTrigger value="therapies">
              Terapias
              {enriching && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
            </TabsTrigger>
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
                variants={variants}
                evidence={evidence}
                therapies={therapies}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="variants">
            <Suspense fallback={<TabSkeleton />}>
              <VariantsPanel
                variants={variants}
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
                evidence={evidence}
                annotationErrors={annotationErrors}
                onEvidenceSelect={(evidence) => {
                  console.log('Selected evidence:', evidence);
                }}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="therapies">
            <Suspense fallback={<TabSkeleton />}>
              <TherapiesPanel
                therapies={therapies}
                evidence={evidence}
                onTherapySelect={(therapy) => {
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
                  console.log('Clicked highlight:', highlight);
                }}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="insights">
            <Suspense fallback={<TabSkeleton />}>
              <ClinicalInsightsPanel
                variants={variants}
                evidence={evidence}
                therapies={therapies}
                tumorType={initialData.metadata.tumorType}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="chat">
            <Suspense fallback={<TabSkeleton />}>
              <TumorBoardChat
                variants={variants}
                evidence={evidence}
                therapies={therapies}
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

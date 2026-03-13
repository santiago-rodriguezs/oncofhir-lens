'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useModelStore } from '@/lib/store/model';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Variant, Evidence, Therapy } from '@/core/models';
import type { ClinicalInterpretation, GenomicReport } from '@/lib/claude';
import { Brain, FileText, ChevronDown, ChevronUp, Loader2, CheckCircle2, Clock, Sparkles, Download } from 'lucide-react';
import { ApiErrorBanner } from '@/components/ApiErrorBanner';

interface ClinicalInsightsPanelProps {
  caseId: string;
  variants: Variant[];
  evidence: Evidence[];
  therapies: Therapy[];
  tumorType?: string;
}

const TIER_COLORS: Record<string, string> = {
  'Tier I': 'bg-red-100 text-red-800 border-red-300',
  'Tier II': 'bg-orange-100 text-orange-800 border-orange-300',
  'Tier III': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Tier IV': 'bg-gray-100 text-gray-800 border-gray-300',
};

const ACTIONABILITY_COLORS: Record<string, string> = {
  High: 'bg-red-100 text-red-800',
  Moderate: 'bg-orange-100 text-orange-800',
  Low: 'bg-yellow-100 text-yellow-800',
  None: 'bg-gray-100 text-gray-800',
};

// ── Deep Research Style Loading ──
interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done';
}

function DeepResearchLoader({ steps, elapsedSeconds, title }: { steps: LoadingStep[]; elapsedSeconds: number; title: string }) {
  return (
    <Card className="p-6 border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Brain className="h-8 w-8 text-purple-600" />
          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-purple-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-semibold text-purple-900">{title}</h3>
            <p className="text-sm text-purple-600 mt-0.5">
              Clasificación AMP/ASCO/CAP con evidencia clínica
              <span className="ml-2 text-purple-400">{elapsedSeconds}s</span>
            </p>
          </div>
          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2.5">
                {step.status === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : step.status === 'active' ? (
                  <Loader2 className="h-4 w-4 text-purple-500 animate-spin shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-slate-300 shrink-0" />
                )}
                <span className={`text-sm ${
                  step.status === 'done' ? 'text-emerald-700' :
                  step.status === 'active' ? 'text-purple-700 font-medium' :
                  'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ClinicalInsightsPanel({
  caseId,
  variants,
  evidence,
  therapies,
  tumorType,
}: ClinicalInsightsPanelProps) {
  const { model } = useModelStore();
  const [interpretations, setInterpretations] = useState<Map<number, ClinicalInterpretation>>(new Map());
  const [report, setReport] = useState<GenomicReport | null>(null);
  const [loadingVariantIdx, setLoadingVariantIdx] = useState<number | null>(null);
  const [loadingAllVariants, setLoadingAllVariants] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingCache, setLoadingCache] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);

  // Loading steps state
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [loadingTitle, setLoadingTitle] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const isLoading = loadingVariantIdx !== null || loadingAllVariants || loadingReport;

  // Load cached report & interpretations from MongoDB on mount
  useEffect(() => {
    async function loadCache() {
      try {
        const res = await fetch(`/api/cases/${caseId}`);
        if (!res.ok) return;
        const caseData = await res.json();

        if (caseData.cachedReport) {
          setReport(caseData.cachedReport);
        }

        if (caseData.cachedInterpretations?.length > 0) {
          const newMap = new Map<number, ClinicalInterpretation>();
          for (const interp of caseData.cachedInterpretations) {
            const idx = variants.findIndex(
              (v) => v.gene === interp.gene && (v.hgvs_p === interp.variant || v.hgvs_c === interp.variant || v.hgvs === interp.variant)
            );
            if (idx >= 0) newMap.set(idx, interp);
          }
          if (newMap.size > 0) setInterpretations(newMap);
        }
      } catch {
        // Silent fail — cache miss is fine
      } finally {
        setLoadingCache(false);
      }
    }
    loadCache();
  }, [caseId, variants]);

  // Timer
  useEffect(() => {
    if (isLoading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLoading]);

  // Interpret a SINGLE variant (cheap, ~$0.002)
  const handleInterpretOne = async (idx: number) => {
    setLoadingVariantIdx(idx);
    setError(null);
    setExpandedVariant(idx);

    const v = variants[idx];
    setLoadingTitle(`Interpretando ${v.gene || 'variante'}...`);
    setLoadingSteps([
      { id: 'analyze', label: `Analizando ${v.gene} ${v.hgvs_p || v.hgvs_c || ''}...`, status: 'active' },
      { id: 'classify', label: 'Clasificación AMP Tier...', status: 'pending' },
      { id: 'done', label: 'Validando interpretación...', status: 'pending' },
    ]);

    try {
      setTimeout(() => setLoadingSteps((prev) =>
        prev.map((s, i) => ({ ...s, status: i < 1 ? 'done' : i === 1 ? 'active' : 'pending' } as LoadingStep))
      ), 2000);
      setTimeout(() => setLoadingSteps((prev) =>
        prev.map((s, i) => ({ ...s, status: i < 2 ? 'done' : i === 2 ? 'active' : 'pending' } as LoadingStep))
      ), 5000);

      const res = await fetch('/api/claude/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-claude-model': model },
        body: JSON.stringify({
          caseId,
          variants: [v],
          context: tumorType ? { tumorType } : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      if (data.interpretations?.length > 0) {
        setInterpretations((prev) => new Map(prev).set(idx, data.interpretations[0]));
      }

      setLoadingSteps((prev) => prev.map((s) => ({ ...s, status: 'done' as const })));
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al interpretar');
    } finally {
      setLoadingVariantIdx(null);
      setLoadingSteps([]);
    }
  };

  // Interpret ALL variants in batch (more expensive, optional)
  const handleInterpretAll = async () => {
    setLoadingAllVariants(true);
    setError(null);

    setLoadingTitle(`Interpretando ${variants.length} variantes...`);
    setLoadingSteps([
      { id: 'prep', label: `Preparando ${variants.length} variantes con anotaciones...`, status: 'active' },
      { id: 'classify', label: 'Clasificación AMP/ASCO/CAP (Tier I-IV)...', status: 'pending' },
      { id: 'therapy', label: 'Evaluando implicancias terapéuticas...', status: 'pending' },
      { id: 'validate', label: 'Validando interpretaciones...', status: 'pending' },
    ]);

    const advanceStep = (idx: number) => {
      setLoadingSteps((prev) =>
        prev.map((s, i) => ({ ...s, status: i < idx ? 'done' : i === idx ? 'active' : 'pending' } as LoadingStep))
      );
    };

    try {
      setTimeout(() => advanceStep(1), 2000);
      setTimeout(() => advanceStep(2), 8000);
      setTimeout(() => advanceStep(3), 15000);

      const res = await fetch('/api/claude/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-claude-model': model },
        body: JSON.stringify({
          caseId,
          variants,
          context: tumorType ? { tumorType } : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const newMap = new Map<number, ClinicalInterpretation>();
      (data.interpretations || []).forEach((interp: ClinicalInterpretation, i: number) => {
        newMap.set(i, interp);
      });
      setInterpretations(newMap);

      setLoadingSteps((prev) => prev.map((s) => ({ ...s, status: 'done' as const })));
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al interpretar variantes');
    } finally {
      setLoadingAllVariants(false);
      setLoadingSteps([]);
    }
  };

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    setError(null);

    setLoadingTitle('Generando reporte de patología molecular...');
    setLoadingSteps([
      { id: 'rank', label: 'Rankeando variantes por importancia clínica...', status: 'active' },
      { id: 'template', label: 'Construyendo reporte desde datos...', status: 'pending' },
      { id: 'summary', label: 'Claude: resumen ejecutivo + top variantes...', status: 'pending' },
    ]);

    const advanceStep = (idx: number) => {
      setLoadingSteps((prev) =>
        prev.map((s, i) => ({ ...s, status: i < idx ? 'done' : i === idx ? 'active' : 'pending' } as LoadingStep))
      );
    };

    try {
      setTimeout(() => advanceStep(1), 1000);
      setTimeout(() => advanceStep(2), 2500);

      const allInterps = Array.from(interpretations.values());

      const res = await fetch('/api/claude/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-claude-model': model },
        body: JSON.stringify({
          caseId,
          variants,
          evidence,
          therapies,
          interpretations: allInterps.length > 0 ? allInterps : undefined,
          context: { tumorType, reportSource: 'NGS Panel' },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setLoadingSteps((prev) => prev.map((s) => ({ ...s, status: 'done' as const })));
      await new Promise((r) => setTimeout(r, 500));
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar reporte');
    } finally {
      setLoadingReport(false);
      setLoadingSteps([]);
    }
  };

  const interpretedCount = interpretations.size;
  const allInterpreted = interpretedCount === variants.length;

  const handleDownloadPdf = () => {
    if (!report) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fdaRows = report.therapeuticImplications.fdaApproved
      .map(t => `<tr><td>${t.drug}</td><td>${t.biomarker}</td><td>${t.indication}</td><td>${t.evidenceLevel}</td></tr>`)
      .join('');
    const nccnRows = report.therapeuticImplications.nccnRecommended
      .map(t => `<tr><td>${t.drug}</td><td>${t.biomarker}</td><td>${t.indication}</td><td>${t.evidenceLevel}</td></tr>`)
      .join('');
    const trialsRows = report.therapeuticImplications.clinicalTrials
      .map(ct => `<li><strong>${ct.description}</strong> — Biomarcador: ${ct.biomarker}${ct.phase ? ` (${ct.phase})` : ''}</li>`)
      .join('');
    const vcRows = report.variantClassifications
      .map(vc => `<tr><td>${vc.gene}</td><td>${vc.variant}</td><td>${vc.tier}</td><td>${vc.classification}</td><td style="max-width:400px">${vc.clinicalSignificance}</td></tr>`)
      .join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Reporte de Patología Molecular - OncoLens</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #1a1a1a; font-size: 13px; }
        h1 { font-size: 22px; border-bottom: 3px solid #7c3aed; padding-bottom: 8px; color: #7c3aed; }
        h2 { font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 24px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
        th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
        th { background: #f3f4f6; font-weight: 600; }
        .summary { background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 12px 16px; margin: 16px 0; }
        .warning { background: #fffbeb; border: 1px solid #f59e0b; padding: 10px 14px; font-size: 11px; margin-top: 24px; border-radius: 4px; }
        .footer { margin-top: 32px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 4px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>Reporte de Patología Molecular</h1>
      <p style="color:#6b7280;font-size:11px">Generado por OncoLens — ${new Date().toLocaleDateString('es-AR')}</p>

      <h2>Resumen Ejecutivo</h2>
      <div class="summary">${report.executiveSummary}</div>

      <h2>Clasificación de Variantes (${report.variantClassifications.length})</h2>
      <table><tr><th>Gen</th><th>Variante</th><th>Tier</th><th>Clasificación</th><th>Significancia Clínica</th></tr>${vcRows}</table>

      ${fdaRows ? `<h2>Terapias Aprobadas por FDA</h2><table><tr><th>Droga</th><th>Biomarcador</th><th>Indicación</th><th>Nivel de Evidencia</th></tr>${fdaRows}</table>` : ''}
      ${nccnRows ? `<h2>Terapias Recomendadas por NCCN</h2><table><tr><th>Droga</th><th>Biomarcador</th><th>Indicación</th><th>Nivel de Evidencia</th></tr>${nccnRows}</table>` : ''}
      ${trialsRows ? `<h2>Oportunidades de Ensayos Clínicos</h2><ul>${trialsRows}</ul>` : ''}

      <h2>Recomendaciones de Monitoreo</h2>
      <ul>${report.monitoringRecommendations.map(r => `<li>${r}</li>`).join('')}</ul>

      <h2>Limitaciones</h2>
      <ul>${report.limitations.map(l => `<li>${l}</li>`).join('')}</ul>

      <h2>Metodología</h2>
      <p>${report.methodology}</p>

      <div class="warning">⚠️ Este reporte fue generado con asistencia de IA (Claude) y está destinado únicamente a fines de investigación y educación. Todos los hallazgos deben ser revisados y validados por un patólogo molecular calificado antes de su uso clínico.</div>
      <div class="footer">OncoLens FHIR — Plataforma de Análisis Genómico Oncológico</div>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Claude Insights Clínicos</h3>
            <Badge variant="outline" className="text-xs">
              Powered by Claude Sonnet / Opus 4.6
            </Badge>
          </div>
          <div className="flex gap-2 items-center">
            {interpretedCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {interpretedCount}/{variants.length} interpretadas
              </span>
            )}
            {!allInterpreted && (
              <Button
                onClick={handleInterpretAll}
                disabled={isLoading || variants.length === 0}
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Interpretar Todas ({variants.length})
              </Button>
            )}
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading || variants.length === 0}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              {loadingReport ? 'Generando...' : report ? 'Regenerar Reporte' : 'Generar Reporte'}
            </Button>
            {report && (
              <Button onClick={handleDownloadPdf} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                PDF
              </Button>
            )}
          </div>
        </div>
        {error && (
          <div className="mt-3">
            <ApiErrorBanner error={error} onDismiss={() => setError(null)} />
          </div>
        )}
      </Card>

      {/* Deep research loading */}
      {isLoading && loadingSteps.length > 0 && (
        <DeepResearchLoader steps={loadingSteps} elapsedSeconds={elapsedSeconds} title={loadingTitle} />
      )}

      {/* Generated Report — FIRST */}
      {report && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Reporte de Patología Molecular</h3>
            <div className="flex items-center gap-2">
              <Button onClick={handleDownloadPdf} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Descargar PDF
              </Button>
              <Badge variant="outline">Generado por IA</Badge>
            </div>
          </div>
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-6 pr-4">
              <section>
                <h4 className="text-md font-semibold border-b pb-2 mb-2">Resumen Ejecutivo</h4>
                <p className="text-sm leading-relaxed">{report.executiveSummary}</p>
              </section>

              <section>
                <h4 className="text-md font-semibold border-b pb-2 mb-2">Clasificación de Variantes</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gen</TableHead>
                      <TableHead>Variante</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Clasificación</TableHead>
                      <TableHead>Significancia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.variantClassifications.map((vc, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{vc.gene}</TableCell>
                        <TableCell className="font-mono text-sm">{vc.variant}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={TIER_COLORS[vc.tier] || ''}>{vc.tier}</Badge>
                        </TableCell>
                        <TableCell>{vc.classification}</TableCell>
                        <TableCell className="text-sm max-w-md">{vc.clinicalSignificance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>

              {report.therapeuticImplications.fdaApproved.length > 0 && (
                <section>
                  <h4 className="text-md font-semibold border-b pb-2 mb-2">Terapias Aprobadas por FDA</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.therapeuticImplications.fdaApproved.map((t, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="font-medium">{t.drug}</div>
                        <div className="text-sm text-muted-foreground">{t.indication}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">{t.biomarker}</Badge>
                          <Badge variant="secondary" className="text-xs">{t.evidenceLevel}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {report.therapeuticImplications.nccnRecommended.length > 0 && (
                <section>
                  <h4 className="text-md font-semibold border-b pb-2 mb-2">Terapias Recomendadas por NCCN</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.therapeuticImplications.nccnRecommended.map((t, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="font-medium">{t.drug}</div>
                        <div className="text-sm text-muted-foreground">{t.indication}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">{t.biomarker}</Badge>
                          <Badge variant="secondary" className="text-xs">{t.evidenceLevel}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {report.therapeuticImplications.clinicalTrials.length > 0 && (
                <section>
                  <h4 className="text-md font-semibold border-b pb-2 mb-2">Oportunidades de Ensayos Clínicos</h4>
                  <ul className="space-y-2">
                    {report.therapeuticImplications.clinicalTrials.map((ct, idx) => (
                      <li key={idx} className="text-sm">
                        <span className="font-medium">{ct.description}</span>
                        <span className="text-muted-foreground"> — Biomarcador: {ct.biomarker}{ct.phase && ` (${ct.phase})`}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {report.monitoringRecommendations.length > 0 && (
                <section>
                  <h4 className="text-md font-semibold border-b pb-2 mb-2">Recomendaciones de Monitoreo</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {report.monitoringRecommendations.map((rec, idx) => (<li key={idx}>{rec}</li>))}
                  </ul>
                </section>
              )}

              <section>
                <h4 className="text-md font-semibold border-b pb-2 mb-2">Limitaciones</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {report.limitations.map((lim, idx) => (<li key={idx}>{lim}</li>))}
                </ul>
              </section>

              <section>
                <h4 className="text-md font-semibold border-b pb-2 mb-2">Metodología</h4>
                <p className="text-sm text-muted-foreground">{report.methodology}</p>
              </section>

              <Card className="p-3 bg-amber-50 border-amber-200">
                <p className="text-xs text-amber-800">
                  Este reporte fue generado por un asistente de IA (Claude Sonnet 4.6) y está destinado
                  únicamente a fines de investigación y educación. Todos los hallazgos deben ser revisados
                  y validados por un patólogo molecular calificado antes de su uso clínico.
                </p>
              </Card>
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Variants table — each row has an "Interpretar" button */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Variantes Detectadas
          {interpretedCount > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {interpretedCount} interpretada{interpretedCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gen</TableHead>
              <TableHead>Variante</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Clasificación</TableHead>
              <TableHead>Accionabilidad</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v, idx) => {
              const interp = interpretations.get(idx);
              const isExpanded = expandedVariant === idx;
              const isLoadingThis = loadingVariantIdx === idx;

              return (
                <>
                  <TableRow
                    key={idx}
                    className={`${interp ? 'cursor-pointer hover:bg-muted' : ''}`}
                    onClick={() => interp && setExpandedVariant(isExpanded ? null : idx)}
                  >
                    <TableCell className="font-medium text-blue-700">
                      {v.gene || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {v.hgvs_p || v.hgvs_c || v.hgvs || '-'}
                    </TableCell>
                    <TableCell>
                      {interp ? (
                        <Badge variant="outline" className={TIER_COLORS[interp.tier] || ''}>
                          {interp.tier}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {interp ? (
                        <span className="text-sm">{interp.classification}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {interp ? (
                        <Badge variant="outline" className={ACTIONABILITY_COLORS[interp.actionability] || ''}>
                          {interp.actionability}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {interp ? (
                        isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 text-xs"
                          disabled={isLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInterpretOne(idx);
                          }}
                        >
                          {isLoadingThis ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Brain className="h-3.5 w-3.5 mr-1" />
                              Interpretar
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {isExpanded && interp && (
                    <TableRow key={`${idx}-detail`}>
                      <TableCell colSpan={6} className="bg-muted/50">
                        <div className="space-y-4 p-4">
                          <div>
                            <h4 className="text-sm font-semibold mb-1">Justificación del Tier</h4>
                            <p className="text-sm text-muted-foreground">{interp.tierRationale}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-1">Razonamiento Clínico</h4>
                            <p className="text-sm text-muted-foreground">{interp.reasoning}</p>
                          </div>
                          {interp.therapeuticImplications.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Implicancias Terapéuticas</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {interp.therapeuticImplications.map((ti, tiIdx) => (
                                  <Card key={tiIdx} className="p-3 text-sm">
                                    <div className="font-medium">{ti.drug}</div>
                                    <div className="text-muted-foreground">{ti.approvalContext}</div>
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      <Badge variant="outline" className="text-xs">{ti.evidenceLevel}</Badge>
                                      {ti.tumorTypes.map((tt) => (
                                        <Badge key={tt} variant="secondary" className="text-xs">{tt}</Badge>
                                      ))}
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                          {interp.clinicalTrials && interp.clinicalTrials.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Ensayos Clínicos Relevantes</h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {interp.clinicalTrials.map((ct, ctIdx) => (
                                  <li key={ctIdx}>{ct.description}{ct.phase && ` (${ct.phase})`}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {interp.prognosticImplications && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Implicancias Pronósticas</h4>
                              <p className="text-sm text-muted-foreground">{interp.prognosticImplications}</p>
                            </div>
                          )}
                          {interp.sources.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Fuentes</h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {interp.sources.map((s, sIdx) => (<li key={sIdx}>{s}</li>))}
                              </ul>
                            </div>
                          )}
                          <div className="flex justify-end">
                            <Badge variant="secondary" className="text-xs">
                              Confianza: {interp.confidence}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Empty state — only show if nothing is loaded and not loading */}
      {!isLoading && interpretations.size === 0 && !report && (
        <Card className="p-8 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Interpretación Clínica de Variantes</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Hacé click en "Interpretar" en cada variante para obtener la clasificación AMP/ASCO/CAP,
            o usá "Interpretar Todas" para un análisis batch.
          </p>
          <p className="text-xs text-muted-foreground">
            Costo estimado: ~$0.002 por variante individual, ~$0.03 batch completo (Sonnet)
          </p>
        </Card>
      )}
    </div>
  );
}

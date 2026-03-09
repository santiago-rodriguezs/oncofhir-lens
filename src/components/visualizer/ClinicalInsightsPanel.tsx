'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Brain, FileText, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface ClinicalInsightsPanelProps {
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

export function ClinicalInsightsPanel({
  variants,
  evidence,
  therapies,
  tumorType,
}: ClinicalInsightsPanelProps) {
  const [interpretations, setInterpretations] = useState<ClinicalInterpretation[]>([]);
  const [report, setReport] = useState<GenomicReport | null>(null);
  const [loadingInterpret, setLoadingInterpret] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);

  const handleInterpret = async () => {
    setLoadingInterpret(true);
    setError(null);
    try {
      const res = await fetch('/api/claude/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants,
          context: tumorType ? { tumorType } : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setInterpretations(data.interpretations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error interpreting variants');
    } finally {
      setLoadingInterpret(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    setError(null);
    try {
      const res = await fetch('/api/claude/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants,
          evidence,
          therapies,
          interpretations: interpretations.length > 0 ? interpretations : undefined,
          context: {
            tumorType,
            reportSource: 'NGS Panel',
          },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating report');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Claude Clinical Insights</h3>
            <Badge variant="outline" className="text-xs">
              Powered by Claude Sonnet 4.6
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleInterpret}
              disabled={loadingInterpret || variants.length === 0}
              variant="default"
            >
              {loadingInterpret ? 'Interpreting...' : 'Interpret Variants'}
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={loadingReport || variants.length === 0}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              {loadingReport ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}
      </Card>

      {/* Loading states */}
      {(loadingInterpret || loadingReport) && (
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      )}

      {/* Interpretations */}
      {interpretations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Variant Interpretations (AMP/ASCO/CAP)
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gene</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Actionability</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interpretations.map((interp, idx) => (
                <>
                  <TableRow
                    key={idx}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() =>
                      setExpandedVariant(expandedVariant === idx ? null : idx)
                    }
                  >
                    <TableCell className="font-medium">{interp.gene}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {interp.variant}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={TIER_COLORS[interp.tier] || ''}
                      >
                        {interp.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>{interp.classification}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          ACTIONABILITY_COLORS[interp.actionability] || ''
                        }
                      >
                        {interp.actionability}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{interp.confidence}</Badge>
                    </TableCell>
                    <TableCell>
                      {expandedVariant === idx ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedVariant === idx && (
                    <TableRow key={`${idx}-detail`}>
                      <TableCell colSpan={7} className="bg-muted/50">
                        <div className="space-y-4 p-4">
                          {/* Tier rationale */}
                          <div>
                            <h4 className="text-sm font-semibold mb-1">
                              Tier Rationale
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {interp.tierRationale}
                            </p>
                          </div>

                          {/* Reasoning */}
                          <div>
                            <h4 className="text-sm font-semibold mb-1">
                              Clinical Reasoning
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {interp.reasoning}
                            </p>
                          </div>

                          {/* Therapeutic implications */}
                          {interp.therapeuticImplications.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">
                                Therapeutic Implications
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {interp.therapeuticImplications.map(
                                  (ti, tiIdx) => (
                                    <Card
                                      key={tiIdx}
                                      className="p-3 text-sm"
                                    >
                                      <div className="font-medium">
                                        {ti.drug}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {ti.approvalContext}
                                      </div>
                                      <div className="flex gap-1 mt-1 flex-wrap">
                                        <Badge variant="outline" className="text-xs">
                                          {ti.evidenceLevel}
                                        </Badge>
                                        {ti.tumorTypes.map((tt) => (
                                          <Badge
                                            key={tt}
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {tt}
                                          </Badge>
                                        ))}
                                      </div>
                                    </Card>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Clinical trials */}
                          {interp.clinicalTrials &&
                            interp.clinicalTrials.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-1">
                                  Relevant Clinical Trials
                                </h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {interp.clinicalTrials.map((ct, ctIdx) => (
                                    <li key={ctIdx}>
                                      {ct.description}
                                      {ct.phase && ` (${ct.phase})`}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {/* Prognostic/Diagnostic */}
                          {interp.prognosticImplications && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">
                                Prognostic Implications
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {interp.prognosticImplications}
                              </p>
                            </div>
                          )}

                          {/* Sources */}
                          {interp.sources.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">
                                Sources
                              </h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {interp.sources.map((s, sIdx) => (
                                  <li key={sIdx}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Generated Report */}
      {report && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Molecular Pathology Report
            </h3>
            <Badge variant="outline">AI-Generated</Badge>
          </div>
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-6 pr-4">
              {/* Executive Summary */}
              <section>
                <h4 className="text-md font-semibold border-b pb-2 mb-2">
                  Executive Summary
                </h4>
                <p className="text-sm leading-relaxed">
                  {report.executiveSummary}
                </p>
              </section>

              {/* Variant Classifications */}
              <section>
                <h4 className="text-md font-semibold border-b pb-2 mb-2">
                  Variant Classifications
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gene</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Significance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.variantClassifications.map((vc, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {vc.gene}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {vc.variant}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={TIER_COLORS[vc.tier] || ''}
                          >
                            {vc.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>{vc.classification}</TableCell>
                        <TableCell className="text-sm">
                          {vc.clinicalSignificance}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>

              {/* FDA-Approved Therapies */}
              {report.therapeuticImplications.fdaApproved.length > 0 && (
                <section>
                  <h4 className="text-md font-semibold border-b pb-2 mb-2">
                    FDA-Approved Therapies
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.therapeuticImplications.fdaApproved.map(
                      (t, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="font-medium">{t.drug}</div>
                          <div className="text-sm text-muted-foreground">
                            {t.indication}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {t.biomarker}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {t.evidenceLevel}
                            </Badge>
                          </div>
                        </Card>
                      )
                    )}
                  </div>
                </section>
              )}

              {/* NCCN-Recommended */}
              {report.therapeuticImplications.nccnRecommended.length > 0 && (
                <section>
                  <h4 className="text-md font-semibold border-b pb-2 mb-2">
                    NCCN-Recommended Therapies
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.therapeuticImplications.nccnRecommended.map(
                      (t, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="font-medium">{t.drug}</div>
                          <div className="text-sm text-muted-foreground">
                            {t.indication}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {t.biomarker}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {t.evidenceLevel}
                            </Badge>
                          </div>
                        </Card>
                      )
                    )}
                  </div>
                </section>
              )}

              {/* Clinical Trials */}
              {report.therapeuticImplications.clinicalTrials.length > 0 && (
                <section>
                  <h4 className="text-md font-semibold border-b pb-2 mb-2">
                    Clinical Trial Opportunities
                  </h4>
                  <ul className="space-y-2">
                    {report.therapeuticImplications.clinicalTrials.map(
                      (ct, idx) => (
                        <li key={idx} className="text-sm">
                          <span className="font-medium">
                            {ct.description}
                          </span>
                          <span className="text-muted-foreground">
                            {' '}
                            — Biomarker: {ct.biomarker}
                            {ct.phase && ` (${ct.phase})`}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </section>
              )}

              {/* Monitoring */}
              {report.monitoringRecommendations.length > 0 && (
                <section>
                  <h4 className="text-md font-semibold border-b pb-2 mb-2">
                    Monitoring Recommendations
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {report.monitoringRecommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Limitations */}
              <section>
                <h4 className="text-md font-semibold border-b pb-2 mb-2">
                  Limitations
                </h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {report.limitations.map((lim, idx) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </section>

              {/* Methodology */}
              <section>
                <h4 className="text-md font-semibold border-b pb-2 mb-2">
                  Methodology
                </h4>
                <p className="text-sm text-muted-foreground">
                  {report.methodology}
                </p>
              </section>

              {/* Disclaimer */}
              <Card className="p-3 bg-amber-50 border-amber-200">
                <p className="text-xs text-amber-800">
                  This report was generated by an AI assistant (Claude Sonnet
                  4.6) and is intended for research and educational purposes
                  only. All findings should be reviewed and validated by a
                  qualified molecular pathologist before clinical use.
                </p>
              </Card>
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Empty state */}
      {!loadingInterpret &&
        !loadingReport &&
        interpretations.length === 0 &&
        !report && (
          <Card className="p-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Clinical Variant Interpretation
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Use Claude to interpret variants following AMP/ASCO/CAP guidelines
              and generate structured molecular pathology reports.
            </p>
          </Card>
        )}
    </div>
  );
}

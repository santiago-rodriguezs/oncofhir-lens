'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import FhirBundleViewer from '@/components/FhirBundleViewer';
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Copy, Check, FileJson } from "lucide-react";

interface FhirPanelProps {
  caseId: string;
}

export function FhirPanel({ caseId }: FhirPanelProps) {
  const [bundle, setBundle] = useState<Record<string, unknown> | null>(null);
  const [phenopacket, setPhenopacket] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPhenopacket, setLoadingPhenopacket] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBundle() {
      try {
        setLoading(true);
        const response = await fetch(`/api/cases/${caseId}/fhir`);
        if (!response.ok) {
          throw new Error(`Failed to generate FHIR bundle: ${response.status}`);
        }
        const data = await response.json();
        setBundle(data.bundle);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchBundle();
  }, [caseId]);

  const fetchPhenopacket = async () => {
    setLoadingPhenopacket(true);
    try {
      const response = await fetch('/api/export/phenopacket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();
      setPhenopacket(data.phenopacket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating Phenopacket');
    } finally {
      setLoadingPhenopacket(false);
    }
  };

  const handleCopy = (data: Record<string, unknown>, label: string) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (data: Record<string, unknown>, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Card>
    );
  }

  if (error && !bundle) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p className="font-semibold">Error loading FHIR Bundle</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="fhir-ig" className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="fhir-ig">
            FHIR Genomics Reporting IG
          </TabsTrigger>
          <TabsTrigger value="phenopacket">
            GA4GH Phenopacket
          </TabsTrigger>
          <TabsTrigger value="raw-json">
            Raw JSON
          </TabsTrigger>
        </TabsList>
      </div>

      {/* FHIR Genomics Reporting IG Bundle */}
      <TabsContent value="fhir-ig">
        {bundle ? (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">
                    HL7 FHIR Genomics Reporting IG (STU2)
                  </span>
                  <Badge variant="outline" className="text-xs">
                    R4
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(bundle, 'fhir')}
                  >
                    {copied === 'fhir' ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownload(
                        bundle,
                        `genomic-report-${caseId}.fhir.json`
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {countResources(bundle).map(({ type, count }) => (
                  <Badge key={type} variant="secondary">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Profiles: genomics-report, variant, diagnostic-implication,
                therapeutic-implication
              </p>
            </Card>
            <FhirBundleViewer bundle={bundle as any} />
          </div>
        ) : (
          <Card className="p-6 text-center text-muted-foreground">
            No FHIR bundle available
          </Card>
        )}
      </TabsContent>

      {/* GA4GH Phenopacket */}
      <TabsContent value="phenopacket">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-green-600" />
                <span className="font-semibold">GA4GH Phenopacket v2</span>
                <Badge variant="outline" className="text-xs">
                  Schema 2.0.0
                </Badge>
              </div>
              <div className="flex gap-2">
                {!phenopacket ? (
                  <Button
                    onClick={fetchPhenopacket}
                    disabled={loadingPhenopacket}
                    size="sm"
                  >
                    {loadingPhenopacket
                      ? 'Generating...'
                      : 'Generate Phenopacket'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopy(phenopacket, 'phenopacket')
                      }
                    >
                      {copied === 'phenopacket' ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownload(
                          phenopacket,
                          `phenopacket-${caseId}.json`
                        )
                      }
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Includes: Individual, Biosample, Genomic Interpretations with
              VRS alleles, Medical Actions, Disease
            </p>
          </Card>
          {phenopacket && (
            <Card className="p-4">
              <ScrollArea className="max-h-[500px]">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(phenopacket, null, 2)}
                </pre>
              </ScrollArea>
            </Card>
          )}
          {!phenopacket && !loadingPhenopacket && (
            <Card className="p-8 text-center">
              <FileJson className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                GA4GH Phenopacket Export
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Export this case as a GA4GH Phenopacket v2, including VRS
                variant representations, ACMG classifications, and treatment
                data.
              </p>
            </Card>
          )}
        </div>
      </TabsContent>

      {/* Raw JSON */}
      <TabsContent value="raw-json">
        <Card className="p-4">
          <ScrollArea className="max-h-[600px]">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {bundle ? JSON.stringify(bundle, null, 2) : 'No data'}
            </pre>
          </ScrollArea>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function countResources(
  bundle: Record<string, unknown>
): Array<{ type: string; count: number }> {
  const entries = (bundle as any)?.entry;
  if (!Array.isArray(entries)) return [];

  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const type = entry?.resource?.resourceType;
    if (type) {
      counts[type] = (counts[type] || 0) + 1;
    }
  }

  return Object.entries(counts).map(([type, count]) => ({ type, count }));
}

export default FhirPanel;

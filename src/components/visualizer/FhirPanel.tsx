'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import FhirBundleViewer from '@/components/FhirBundleViewer';
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Copy, Check, FileJson, Upload, Server } from "lucide-react";
import { ApiErrorBanner } from '@/components/ApiErrorBanner';

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
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string; isConnectionError?: boolean } | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

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
        setError(err instanceof Error ? err.message : 'Error desconocido');
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
      setError(err instanceof Error ? err.message : 'Error al generar Phenopacket');
    } finally {
      setLoadingPhenopacket(false);
    }
  };

  const handleCopy = (data: Record<string, unknown>, label: string) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const pushToHapi = async () => {
    setPushing(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/fhir/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPushResult({
        success: true,
        message: `${data.resourcesCreated} recursos enviados al servidor FHIR`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const isConnectionError = msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('Failed') || msg.includes('NetworkError');
      setPushResult({
        success: false,
        message: isConnectionError
          ? 'No se pudo conectar al servidor FHIR. El servidor HAPI FHIR no está disponible en este momento, pero podés seguir usando todas las funciones de análisis normalmente.'
          : msg || 'Error enviando al servidor FHIR',
        isConnectionError,
      });
    } finally {
      setPushing(false);
    }
  };

  const validateBundle = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await fetch('/api/fhir/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setValidationResult(await res.json());
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const isConnectionError = msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('Failed') || msg.includes('NetworkError');
      setValidationResult({
        valid: false,
        error: isConnectionError
          ? 'Servidor FHIR no disponible. Podés descargar el bundle y validarlo manualmente en cualquier servidor FHIR.'
          : msg || 'Error de validación',
        isConnectionError,
      });
    } finally {
      setValidating(false);
    }
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
          <p className="font-semibold">Error al cargar el FHIR Bundle</p>
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
            JSON sin procesar
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
                    Copiar
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
                    Descargar
                  </Button>
                  <Button
                    size="sm"
                    onClick={pushToHapi}
                    disabled={pushing}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {pushing ? (
                      <Server className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1" />
                    )}
                    {pushing ? 'Enviando...' : 'Enviar a HAPI FHIR'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validateBundle}
                    disabled={validating}
                  >
                    {validating ? (
                      <Server className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    {validating ? 'Validando...' : 'Validar $validate'}
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
                Perfiles: genomics-report, variant, diagnostic-implication,
                therapeutic-implication
              </p>
              {pushResult && (
                <div className={`mt-3 rounded-lg p-3 text-sm ${
                  pushResult.success
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : pushResult.isConnectionError
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {pushResult.success ? (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      {pushResult.message}
                      {' — '}
                      <a href="/patients" className="underline font-medium">
                        Ver en Visor de Pacientes
                      </a>
                    </div>
                  ) : pushResult.isConnectionError ? (
                    <div>
                      <div className="flex items-center gap-2 font-medium mb-1">
                        <Server className="h-4 w-4" />
                        Servidor FHIR no disponible
                      </div>
                      <p className="text-xs">
                        {pushResult.message}
                      </p>
                    </div>
                  ) : (
                    pushResult.message
                  )}
                </div>
              )}
              {validationResult && (
                <div className={`mt-3 rounded-lg p-3 text-sm border ${
                  validationResult.valid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : validationResult.isConnectionError
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : validationResult.error
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                }`}>
                  {validationResult.error ? (
                    <div>
                      {validationResult.isConnectionError && (
                        <div className="flex items-center gap-2 font-medium mb-1">
                          <Server className="h-4 w-4" />
                          Servidor FHIR no disponible
                        </div>
                      )}
                      <p className={validationResult.isConnectionError ? 'text-xs' : ''}>{validationResult.error}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 font-medium mb-2">
                        {validationResult.valid ? (
                          <><Check className="h-4 w-4" /> Bundle FHIR válido</>
                        ) : (
                          <>Bundle con observaciones</>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs mb-2">
                        <span>Recursos: {validationResult.summary.totalResources}</span>
                        <span className="text-emerald-600">Válidos: {validationResult.summary.validResources}</span>
                        {validationResult.summary.invalidResources > 0 && (
                          <span className="text-red-600">Con errores: {validationResult.summary.invalidResources}</span>
                        )}
                        {validationResult.summary.severityCounts.warning > 0 && (
                          <span className="text-yellow-600">Warnings: {validationResult.summary.severityCounts.warning}</span>
                        )}
                      </div>
                      {validationResult.results
                        .filter((r: any) => r.issues.some((i: any) => i.severity === 'error'))
                        .slice(0, 5)
                        .map((r: any, idx: number) => (
                          <div key={idx} className="text-xs mt-1 border-t pt-1">
                            <span className="font-medium">{r.resourceType}</span>
                            {r.issues
                              .filter((i: any) => i.severity === 'error')
                              .map((i: any, j: number) => (
                                <p key={j} className="text-red-600 ml-2">{i.diagnostics}</p>
                              ))}
                          </div>
                        ))}
                    </>
                  )}
                </div>
              )}
            </Card>
            <FhirBundleViewer bundle={bundle as any} />
          </div>
        ) : (
          <Card className="p-6 text-center text-muted-foreground">
            No hay FHIR bundle disponible
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
                      ? 'Generando...'
                      : 'Generar Phenopacket'}
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
                      Copiar
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
                      Descargar
                    </Button>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Incluye: Individual, Biosample, Interpretaciones Genómicas con
              alelos VRS, Acciones Médicas, Enfermedad
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
                Exportar GA4GH Phenopacket
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Exportar este caso como GA4GH Phenopacket v2, incluyendo
                representaciones de variantes VRS, clasificaciones ACMG y datos
                de tratamiento.
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
              {bundle ? JSON.stringify(bundle, null, 2) : 'Sin datos'}
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

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Dna, Pill, FileText, Activity, Download } from 'lucide-react';

interface PatientData {
  patient: {
    id: string;
    name: string;
    identifier: string;
    gender: string;
    birthDate: string;
  };
  variants: Array<{
    id: string;
    gene: string;
    hgvs_c: string;
    hgvs_p: string;
    vaf?: number;
    depth?: number;
    clinicalSignificance: string;
  }>;
  diagnosticImplications: Array<{
    id: string;
    clinicalSignificance: string;
    phenotype: string;
  }>;
  therapeuticImplications: Array<{
    id: string;
    drug: string;
    evidenceLevel: string;
    note: string;
  }>;
  report: {
    id: string;
    status: string;
    issued: string;
    resultCount: number;
  } | null;
  resourceSummary: Record<string, number>;
  rawBundle: any;
}

export default function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [data, setData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/fhir/patients/${id}`);
        if (!res.ok) throw new Error(await res.text());
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando datos del paciente');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const downloadBundle = () => {
    if (!data?.rawBundle) return;
    const blob = new Blob([JSON.stringify(data.rawBundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-${id}-fhir-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">{error || 'Paciente no encontrado'}</p>
          <Link href="/patients">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{data.patient.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {data.patient.identifier || data.patient.id}
              </code>
              {data.patient.gender && (
                <Badge variant="outline">{data.patient.gender}</Badge>
              )}
              {data.patient.birthDate && (
                <span className="text-xs text-muted-foreground">
                  Nacimiento: {data.patient.birthDate}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={downloadBundle}>
          <Download className="h-4 w-4 mr-1" />
          Descargar FHIR Bundle
        </Button>
      </div>

      {/* Resource summary */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(data.resourceSummary).map(([type, count]) => (
          <Badge key={type} variant="secondary" className="gap-1">
            {type}
            <span className="bg-background px-1.5 rounded text-xs">{count}</span>
          </Badge>
        ))}
      </div>

      {/* Variants */}
      <Card className="mb-6">
        <div className="p-4 border-b flex items-center gap-2">
          <Dna className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold">Variantes Genómicas</h2>
          <Badge variant="outline">{data.variants.length}</Badge>
        </div>
        {data.variants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gen</TableHead>
                <TableHead>c.HGVS</TableHead>
                <TableHead>p.HGVS</TableHead>
                <TableHead>VAF</TableHead>
                <TableHead>Profundidad</TableHead>
                <TableHead>Significancia Clínica</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.variants.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.gene}</TableCell>
                  <TableCell className="font-mono text-xs">{v.hgvs_c || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{v.hgvs_p || '-'}</TableCell>
                  <TableCell>
                    {v.vaf !== undefined ? `${(v.vaf * 100).toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell>{v.depth !== undefined ? `${v.depth}x` : '-'}</TableCell>
                  <TableCell>
                    {v.clinicalSignificance ? (
                      <Badge variant="outline" className="text-xs">
                        {v.clinicalSignificance}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Sin variantes registradas
          </div>
        )}
      </Card>

      {/* Therapeutic Implications */}
      <Card className="mb-6">
        <div className="p-4 border-b flex items-center gap-2">
          <Pill className="h-5 w-5 text-green-600" />
          <h2 className="font-semibold">Implicancias Terapéuticas</h2>
          <Badge variant="outline">{data.therapeuticImplications.length}</Badge>
        </div>
        {data.therapeuticImplications.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Droga</TableHead>
                <TableHead>Nivel de Evidencia</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.therapeuticImplications.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.drug}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.evidenceLevel || '-'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                    {t.note || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Sin implicancias terapéuticas
          </div>
        )}
      </Card>

      {/* Diagnostic Report */}
      {data.report && (
        <Card className="mb-6">
          <div className="p-4 border-b flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold">Reporte Diagnóstico</h2>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <Badge variant="outline">{data.report.status}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Emitido</p>
              <p className="text-sm">
                {new Date(data.report.issued).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resultados</p>
              <p className="text-sm">{data.report.resultCount} recursos</p>
            </div>
          </div>
        </Card>
      )}

      {/* Raw FHIR Bundle */}
      <Accordion type="single" collapsible>
        <AccordionItem value="raw">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Ver FHIR Bundle completo (JSON)
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <pre className="p-4 bg-muted rounded-b-lg text-xs overflow-auto max-h-[500px]">
              {JSON.stringify(data.rawBundle, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

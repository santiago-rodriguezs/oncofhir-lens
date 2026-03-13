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
import {
  ArrowLeft,
  Dna,
  Pill,
  FileText,
  Activity,
  Download,
  FlaskConical,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Microscope,
  BarChart3,
} from 'lucide-react';

interface PatientData {
  patient: {
    id: string;
    name: string;
    identifier: string;
    gender: string;
    birthDate: string;
  };
  specimen: {
    type: string;
    status: string;
    collectedDate: string;
  } | null;
  variants: Array<{
    id: string;
    gene: string;
    hgvs_c: string;
    hgvs_p: string;
    vaf?: number;
    depth?: number;
    clinicalSignificance: string;
    chromosome: string;
    genomicSource: string;
    ref: string;
    alt: string;
    position?: number;
  }>;
  diagnosticImplications: Array<{
    id: string;
    clinicalSignificance: string;
    phenotype: string;
    evidenceLevel: string;
    derivedFrom: string;
  }>;
  therapeuticImplications: Array<{
    id: string;
    drug: string;
    evidenceLevel: string;
    tumorContext: string;
    note: string;
    derivedFrom: string;
  }>;
  overallInterpretation: {
    value: string;
    note: string;
  } | null;
  regionStudied: {
    genes: string[];
    description: string;
  } | null;
  tasks: Array<{
    id: string;
    status: string;
    description: string;
    drug: string;
    evidenceLevel: string;
  }>;
  report: {
    id: string;
    status: string;
    issued: string;
    conclusion: string;
    resultCount: number;
  } | null;
  insights: {
    totalVariants: number;
    uniqueGenes: number;
    geneList: string[];
    avgVaf: number | null;
    highVafVariants: number;
    pathogenicCount: number;
    therapeuticOptions: number;
    tasksCount: number;
  };
  resourceSummary: Record<string, number>;
  rawBundle: any;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };
  const iconColorMap: Record<string, string> = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    cyan: 'text-cyan-600',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${iconColorMap[color]}`} />
        <span className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sublabel && <p className="text-xs mt-1 opacity-70">{sublabel}</p>}
    </div>
  );
}

function InterpretationBadge({ value }: { value: string }) {
  const lower = value.toLowerCase();
  if (lower === 'positive') {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-300 gap-1">
        <AlertTriangle className="h-3 w-3" />
        Positivo
      </Badge>
    );
  }
  if (lower === 'negative') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Negativo
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1">
      Indeterminado
    </Badge>
  );
}

function VafBar({ vaf }: { vaf: number }) {
  const pct = Math.min(vaf * 100, 100);
  const color =
    pct >= 40 ? 'bg-red-500' : pct >= 20 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono">{(vaf * 100).toFixed(1)}%</span>
    </div>
  );
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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

  const { insights } = data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{data.patient.name}</h1>
              {data.overallInterpretation && (
                <InterpretationBadge value={data.overallInterpretation.value} />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                ID: {data.patient.identifier || data.patient.id}
              </code>
              {data.patient.gender && (
                <Badge variant="outline" className="text-xs">{data.patient.gender}</Badge>
              )}
              {data.specimen && (
                <Badge variant="outline" className="text-xs gap-1">
                  <FlaskConical className="h-3 w-3" />
                  {data.specimen.type}
                </Badge>
              )}
              {data.report && (
                <Badge variant="outline" className="text-xs gap-1">
                  <FileText className="h-3 w-3" />
                  {data.report.status}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={downloadBundle}>
          <Download className="h-4 w-4 mr-1" />
          FHIR Bundle
        </Button>
      </div>

      {/* ── Quick Stats Dashboard ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          icon={Dna}
          label="Variantes"
          value={insights.totalVariants}
          sublabel={`${insights.uniqueGenes} gen${insights.uniqueGenes !== 1 ? 'es' : ''} afectado${insights.uniqueGenes !== 1 ? 's' : ''}`}
          color="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="Patogénicas"
          value={insights.pathogenicCount}
          sublabel={insights.pathogenicCount > 0 ? 'Requieren atención' : 'Sin hallazgos'}
          color={insights.pathogenicCount > 0 ? 'red' : 'emerald'}
        />
        <StatCard
          icon={Pill}
          label="Terapias"
          value={insights.therapeuticOptions}
          sublabel={insights.therapeuticOptions > 0 ? 'Opciones identificadas' : 'Sin opciones'}
          color={insights.therapeuticOptions > 0 ? 'emerald' : 'amber'}
        />
        <StatCard
          icon={TrendingUp}
          label="VAF promedio"
          value={insights.avgVaf != null ? `${(insights.avgVaf * 100).toFixed(1)}%` : 'N/A'}
          sublabel={insights.highVafVariants > 0 ? `${insights.highVafVariants} con VAF alto (>30%)` : 'Todo en rango bajo'}
          color={insights.highVafVariants > 0 ? 'amber' : 'cyan'}
        />
        <StatCard
          icon={Target}
          label="Genes"
          value={insights.uniqueGenes}
          sublabel={insights.geneList.slice(0, 4).join(', ') + (insights.geneList.length > 4 ? '...' : '')}
          color="purple"
        />
        <StatCard
          icon={ClipboardList}
          label="Follow-ups"
          value={insights.tasksCount}
          sublabel="Acciones recomendadas"
          color="cyan"
        />
      </div>

      {/* ── Overall Interpretation + Report ── */}
      {(data.overallInterpretation || data.report) && (
        <Card className="mb-6 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b">
            <div className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-slate-600" />
              <h2 className="font-semibold">Interpretación General</h2>
            </div>
          </div>
          <div className="p-4">
            {data.overallInterpretation && (
              <div className="flex items-start gap-4 mb-3">
                <div>
                  <span className="text-sm text-muted-foreground">Resultado: </span>
                  <InterpretationBadge value={data.overallInterpretation.value} />
                </div>
                {data.overallInterpretation.note && (
                  <p className="text-sm text-muted-foreground flex-1">
                    {data.overallInterpretation.note}
                  </p>
                )}
              </div>
            )}
            {data.report?.conclusion && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <span className="font-medium">Conclusión: </span>
                {data.report.conclusion}
              </div>
            )}
            {data.report && (
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span>Emitido: {new Date(data.report.issued).toLocaleString()}</span>
                <span>{data.report.resultCount} observaciones</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Variants Table ── */}
      <Card className="mb-6 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dna className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold">Variantes Genómicas</h2>
            <Badge variant="secondary">{data.variants.length}</Badge>
          </div>
          {data.regionStudied && (
            <span className="text-xs text-muted-foreground">
              Panel: {data.regionStudied.genes.length} genes estudiados
            </span>
          )}
        </div>
        {data.variants.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Gen</TableHead>
                  <TableHead>c.HGVS</TableHead>
                  <TableHead>p.HGVS</TableHead>
                  <TableHead>Chr</TableHead>
                  <TableHead>VAF</TableHead>
                  <TableHead>Profundidad</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Significancia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.variants.map((v) => (
                  <TableRow key={v.id} className="hover:bg-muted/20">
                    <TableCell>
                      <span className="font-semibold text-blue-700">{v.gene}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{v.hgvs_c || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{v.hgvs_p || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v.chromosome || '-'}</TableCell>
                    <TableCell>
                      {v.vaf != null ? <VafBar vaf={v.vaf} /> : '-'}
                    </TableCell>
                    <TableCell>
                      {v.depth != null ? (
                        <span className="text-xs font-mono">{v.depth}x</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {v.genomicSource ? (
                        <Badge variant="outline" className="text-xs">
                          {v.genomicSource}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {v.clinicalSignificance ? (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            v.clinicalSignificance.toLowerCase().includes('pathogenic')
                              ? 'border-red-300 text-red-700 bg-red-50'
                              : v.clinicalSignificance.toLowerCase().includes('benign')
                              ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                              : ''
                          }`}
                        >
                          {v.clinicalSignificance}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Sin variantes registradas
          </div>
        )}
      </Card>

      {/* ── Therapeutic Implications ── */}
      <Card className="mb-6 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-white border-b flex items-center gap-2">
          <Pill className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold">Implicancias Terapéuticas</h2>
          <Badge variant="secondary">{data.therapeuticImplications.length}</Badge>
        </div>
        {data.therapeuticImplications.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Droga</TableHead>
                  <TableHead>Nivel de Evidencia</TableHead>
                  <TableHead>Contexto Tumoral</TableHead>
                  <TableHead>Fuente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.therapeuticImplications.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/20">
                    <TableCell>
                      <span className="font-semibold text-emerald-700">{t.drug}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          t.evidenceLevel?.includes('1') || t.evidenceLevel?.includes('A')
                            ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                            : t.evidenceLevel?.includes('2') || t.evidenceLevel?.includes('B')
                            ? 'border-blue-300 text-blue-700 bg-blue-50'
                            : ''
                        }`}
                      >
                        {t.evidenceLevel || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{t.tumorContext || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {t.note || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Sin implicancias terapéuticas identificadas
          </div>
        )}
      </Card>

      {/* ── Diagnostic Implications ── */}
      {data.diagnosticImplications.length > 0 && (
        <Card className="mb-6 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-white border-b flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold">Implicancias Diagnósticas</h2>
            <Badge variant="secondary">{data.diagnosticImplications.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Significancia Clínica</TableHead>
                  <TableHead>Fenotipo</TableHead>
                  <TableHead>Nivel de Evidencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.diagnosticImplications.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/20">
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          d.clinicalSignificance.toLowerCase().includes('pathogenic')
                            ? 'border-red-300 text-red-700 bg-red-50'
                            : d.clinicalSignificance.toLowerCase().includes('benign')
                            ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                            : ''
                        }`}
                      >
                        {d.clinicalSignificance || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{d.phenotype || '-'}</TableCell>
                    <TableCell className="text-sm">{d.evidenceLevel || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ── Follow-up Tasks ── */}
      {data.tasks.length > 0 && (
        <Card className="mb-6 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-cyan-50 to-white border-b flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cyan-600" />
            <h2 className="font-semibold">Acciones Recomendadas</h2>
            <Badge variant="secondary">{data.tasks.length}</Badge>
          </div>
          <div className="divide-y">
            {data.tasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-muted/20">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{task.status}</Badge>
                  {task.drug && (
                    <span className="font-medium text-sm text-cyan-700">{task.drug}</span>
                  )}
                  {task.evidenceLevel && (
                    <Badge variant="secondary" className="text-xs">
                      {task.evidenceLevel}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Resource summary pills ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(data.resourceSummary).map(([type, count]) => (
          <Badge key={type} variant="outline" className="gap-1 text-xs">
            {type}
            <span className="bg-muted px-1.5 rounded font-mono">{count}</span>
          </Badge>
        ))}
      </div>

      {/* ── Raw FHIR Bundle (collapsible) ── */}
      <Accordion type="single" collapsible>
        <AccordionItem value="raw" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Ver FHIR Bundle completo (JSON)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <pre className="p-4 bg-muted rounded-b-lg text-xs overflow-auto max-h-[500px] font-mono">
              {JSON.stringify(data.rawBundle, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

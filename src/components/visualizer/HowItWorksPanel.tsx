'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * HowItWorksPanel — explains the full application pipeline,
 * domain models, APIs, and standards used.
 */
export function HowItWorksPanel() {
  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-8 pr-4 pb-8">

        {/* ── Header ── */}
        <Card className="p-6 border-l-4 border-blue-500">
          <h2 className="text-2xl font-bold mb-2">OncoLens — Cómo Funciona?</h2>
          <p className="text-muted-foreground">
            Plataforma de análisis genómico que extrae variantes somáticas de reportes clínicos (PDF/VCF),
            las anota contra múltiples bases de conocimiento, las interpreta siguiendo guías clínicas,
            y genera datos interoperables en estándares HL7 FHIR y GA4GH.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge>Next.js 14</Badge>
            <Badge>TypeScript (strict)</Badge>
            <Badge variant="secondary">Claude Sonnet 4.6 / Opus 4.6</Badge>
            <Badge variant="secondary">FHIR R4</Badge>
            <Badge variant="secondary">GA4GH VRS + Phenopackets</Badge>
            <Badge variant="outline">Zod</Badge>
            <Badge variant="outline">Zustand</Badge>
            <Badge variant="outline">TanStack Table</Badge>
          </div>
        </Card>

        {/* ── Pipeline Flow ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Pipeline de Extremo a Extremo</h3>
          <div className="space-y-1">
            {PIPELINE_STEPS.map((step, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${step.color}`}>
                    {idx + 1}
                  </div>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-300" />
                  )}
                </div>
                <div className="pt-1.5 pb-4">
                  <h4 className="font-semibold">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {step.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Domain Model ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Modelo de Dominio</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Todos los modelos están definidos como schemas Zod en <code className="bg-muted px-1 rounded">src/core/models.ts</code>,
            proveyendo validación en tiempo de ejecución e inferencia de tipos TypeScript desde una única fuente de verdad.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOMAIN_MODELS.map((model) => (
              <Card key={model.name} className="p-4 border-l-4 border-purple-400">
                <h4 className="font-semibold font-mono text-sm">{model.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                <div className="mt-2 space-y-0.5">
                  {model.fields.map((f) => (
                    <div key={f} className="text-xs font-mono text-muted-foreground">
                      {f}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* ── API Routes ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Rutas de API</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-semibold">Método</th>
                  <th className="text-left py-2 pr-4 font-semibold">Ruta</th>
                  <th className="text-left py-2 font-semibold">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {API_ROUTES.map((route, idx) => (
                  <tr key={idx} className="border-b border-dashed">
                    <td className="py-2 pr-4">
                      <Badge variant={route.method === 'GET' ? 'secondary' : 'default'} className="text-xs font-mono">
                        {route.method}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{route.path}</td>
                    <td className="py-2 text-muted-foreground text-xs">{route.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Standards ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Estándares y Especificaciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STANDARDS.map((std) => (
              <Card key={std.name} className={`p-4 border-l-4 ${std.borderColor}`}>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{std.name}</h4>
                  <Badge variant="outline" className="text-xs">{std.version}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{std.description}</p>
                {std.profiles && (
                  <div className="mt-2 space-y-0.5">
                    {std.profiles.map((p) => (
                      <div key={p} className="text-xs font-mono text-muted-foreground">{p}</div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>

        {/* ── Annotation Sources ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Bases de Conocimiento para Anotación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ANNOTATION_SOURCES.map((src) => (
              <Card key={src.name} className="p-4">
                <h4 className="font-semibold">{src.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{src.description}</p>
                <Badge variant="outline" className="text-xs mt-2">{src.type}</Badge>
              </Card>
            ))}
          </div>
        </Card>

        {/* ── AI Integration ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Integración con Claude (Life Sciences)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Claude se utiliza a lo largo de todo el pipeline para tareas que requieren razonamiento clínico,
            extracción de datos estructurados y síntesis de conocimiento. Todas las salidas de IA se validan con schemas Zod.
            El modelo es configurable via la variable de entorno <code className="bg-muted px-1 rounded">CLAUDE_MODEL</code>
            — usar <code className="bg-muted px-1 rounded">sonnet</code> (por defecto) o <code className="bg-muted px-1 rounded">opus</code> para
            Claude Opus 4.6 (mayor precisión, más lento).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CLAUDE_USES.map((use) => (
              <Card key={use.title} className="p-4 border-l-4 border-violet-400">
                <h4 className="font-semibold text-sm">{use.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{use.description}</p>
                <div className="text-xs font-mono text-muted-foreground mt-2">{use.file}</div>
              </Card>
            ))}
          </div>
        </Card>

        {/* ── Visualizer Tabs ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Secciones del Visualizador</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Cada pestaña del visualizador muestra una faceta del análisis genómico. A continuación se explica
            qué muestra cada una y cómo se calcula/obtiene la información.
          </p>
          <div className="space-y-4">
            {VISUALIZER_TABS.map((tab) => (
              <Card key={tab.name} className={`p-4 border-l-4 ${tab.borderColor}`}>
                <h4 className="font-semibold">{tab.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{tab.what}</p>
                <p className="text-sm mt-2"><span className="font-medium">Cómo funciona:</span> {tab.how}</p>
              </Card>
            ))}
          </div>
        </Card>

        {/* ── Architecture Diagram (ASCII) ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Arquitectura General</h3>
          <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre">
{`
  ┌─────────────┐     ┌─────────────┐
  │  PDF Report  │     │  VCF File   │
  └──────┬──────┘     └──────┬──────┘
         │                    │
         ▼                    ▼
  ┌──────────────────────────────────┐
  │        INGEST LAYER              │
  │  Claude Sonnet/Opus 4.6 (PDF→JSON)│
  │  VCF Parser (multi-allelic)      │
  └──────────────┬───────────────────┘
                 │
                 ▼
  ┌──────────────────────────────────┐
  │       ANNOTATION PIPELINE        │
  │  ┌────────┐ ┌────────┐ ┌──────┐ │
  │  │ OncoKB │ │ClinVar │ │DGIdb │ │
  │  └───┬────┘ └───┬────┘ └──┬───┘ │
  │      └─────┬─────┘────────┘     │
  │            ▼                     │
  │   Consolidación determinística    │
  │   (merge + validate w/ Zod)      │
  └──────────────┬───────────────────┘
                 │
                 ▼
  ┌──────────────────────────────────┐
  │     CLINICAL INTERPRETATION      │
  │  Claude AMP/ASCO/CAP Tier I-IV   │
  │  Molecular Pathology Report      │
  │  Tumor Board Assistant           │
  └──────────────┬───────────────────┘
                 │
         ┌───────┴───────┐
         ▼               ▼
  ┌──────────────┐ ┌──────────────┐
  │ PERSISTENCE  │ │ OUTPUT LAYER │
  │              │ │              │
  │ MongoDB Atlas│ │ FHIR IG STU2 │
  │ (casos)      │ │ GA4GH VRS    │
  │              │ │ Phenopackets │
  │ HAPI FHIR   │ │              │
  │ (recursos)   │ │ SMART on FHIR│
  │              │ │ (planificado)│
  └──────────────┘ └──────────────┘
         │
         ▼
  ┌──────────────────────────────────┐
  │      FRONTEND (Next.js 14)       │
  │  Vercel · Google OAuth · shadcn  │
  │  Visor de pacientes desde FHIR   │
  │  Dashboard genómico con insights │
  └──────────────────────────────────┘
`}
          </pre>
        </Card>

        {/* ── Integrations & Costs ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Integraciones y Costos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Mapa completo de servicios externos utilizados, su propósito y costo estimado.
            La plataforma está diseñada para funcionar con costo mínimo (o cero) en modo demo/tesis.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-semibold">Servicio</th>
                  <th className="text-left py-2 pr-4 font-semibold">Uso en OncoLens</th>
                  <th className="text-left py-2 pr-4 font-semibold">Costo</th>
                  <th className="text-left py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {INTEGRATIONS.map((integration, idx) => (
                  <tr key={idx} className="border-b border-dashed">
                    <td className="py-2.5 pr-4 font-medium">{integration.service}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground text-xs">{integration.usage}</td>
                    <td className="py-2.5 pr-4">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          integration.cost === 'Gratis'
                            ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                            : integration.cost.includes('Pago')
                            ? 'border-amber-300 text-amber-700 bg-amber-50'
                            : 'border-gray-300'
                        }`}
                      >
                        {integration.cost}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <Badge
                        variant={integration.active ? 'default' : 'secondary'}
                        className={`text-xs ${integration.active ? 'bg-emerald-600' : 'opacity-50'}`}
                      >
                        {integration.active ? 'Activo' : 'No se usa'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <span className="font-medium">Nota sobre costos:</span> El único servicio pago es la API de Anthropic (Claude).
            Para uso académico/tesis, el costo estimado es ~USD 1-5/mes dependiendo del volumen de casos procesados.
            Todos los demás servicios operan en tiers gratuitos.
          </div>
        </Card>

        {/* ── File Structure ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Estructura de Archivos Clave</h3>
          <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre">
{`src/
├── core/
│   └── models.ts              # Canonical Zod schemas (Variant, Evidence, Therapy, etc.)
├── lib/
│   ├── claude/
│   │   ├── variantInterpreter.ts  # AMP/ASCO/CAP classification
│   │   ├── reportGenerator.ts     # Molecular pathology report
│   │   ├── tumorBoardAssistant.ts # Conversational assistant
│   │   └── schemas.ts            # Zod schemas for AI outputs
│   ├── fhir/
│   │   ├── genomics-reporting.ts  # HL7 Genomics Reporting IG (STU2) builders
│   │   ├── resources.ts           # Legacy FHIR resource helpers
│   │   └── client.ts             # FHIR API client
│   ├── ga4gh/
│   │   ├── vrs.ts                # GA4GH VRS v1.3 allele representation
│   │   └── phenopackets.ts       # Phenopackets v2 builder
│   ├── annotate/
│   │   └── service.ts            # Multi-source annotation pipeline
│   ├── vcf/
│   │   └── parser.ts             # VCF parser (multi-allelic support)
│   ├── oncokb.ts                 # OncoKB API client
│   ├── clinvar.ts                # ClinVar E-Utilities client
│   ├── dgidb.ts                  # DGIdb GraphQL client
│   ├── model.ts                  # Claude model selector (CLAUDE_MODEL env)
│   └── sonnet.ts                 # Claude SDK wrapper (JSON + Zod validation)
├── app/
│   ├── api/
│   │   ├── claude/               # /interpret, /report, /chat
│   │   ├── annotate/             # Multi-source annotation
│   │   ├── export/               # /fhir, /phenopacket
│   │   ├── vcf/upload/           # VCF ingestion
│   │   └── pdf/upload/           # PDF ingestion
│   └── visualizer/[caseId]/      # Main visualizer page
└── components/visualizer/         # All visualizer tab panels`}
          </pre>
        </Card>

      </div>
    </ScrollArea>
  );
}

// ── Static data ────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    title: 'Entrada: Reporte PDF o Archivo VCF',
    description: 'El usuario sube un reporte genómico (PDF de laboratorios como Foundation Medicine, Guardant Health) o un archivo VCF de secuenciación NGS.',
    tags: ['PDF parsing', 'VCF multi-alélico', 'Extracción con Claude'],
    color: 'bg-blue-500',
  },
  {
    title: 'Extracción de Variantes',
    description: 'Los PDFs son procesados por Claude (Sonnet u Opus, configurable) para extraer datos estructurados de variantes (gen, HGVS, coordenadas, VAF). Los VCFs se parsean directamente con soporte para sitios multi-alélicos, campos AD/VAF, y anotaciones SnpEff/VEP.',
    tags: ['sonnetJson<T>()', 'Validación Zod', 'VariantInput schema'],
    color: 'bg-cyan-500',
  },
  {
    title: 'Anotación Multi-Fuente',
    description: 'Las variantes se anotan en paralelo contra OncoKB (oncogenicidad, niveles terapéuticos), ClinVar (significancia clínica, patogenicidad) y DGIdb (interacciones droga-gen). Si una fuente falla, se reporta el error sin mezclar datos de IA.',
    tags: ['Promise.allSettled', 'OncoKB', 'ClinVar', 'DGIdb'],
    color: 'bg-green-500',
  },
  {
    title: 'Consolidación de Anotaciones',
    description: 'Los datos de todas las fuentes se fusionan en una anotación unificada por variante. La consolidación es determinística sin intervención de IA, con trazabilidad de fuentes.',
    tags: ['ConsolidatedAnnotation', 'Evidence', 'Therapy'],
    color: 'bg-emerald-500',
  },
  {
    title: 'Interpretación Clínica (Claude Life Sciences)',
    description: 'Cada variante se clasifica siguiendo las guías AMP/ASCO/CAP 2017 (Tier I-IV). Claude asigna patogenicidad, accionabilidad, implicaciones terapéuticas con niveles de evidencia, ensayos clínicos relevantes y evaluación de confianza.',
    tags: ['AMP Tier I-IV', 'ACMG/AMP', 'ClinicalInterpretation schema'],
    color: 'bg-violet-500',
  },
  {
    title: 'Generación de Reporte',
    description: 'Se genera un reporte estructurado de patología molecular siguiendo guías CAP/AMP: resumen ejecutivo, clasificaciones de variantes, terapias aprobadas por FDA, recomendaciones NCCN, ensayos clínicos, monitoreo y limitaciones.',
    tags: ['GenomicReport schema', 'Guías CAP/AMP'],
    color: 'bg-purple-500',
  },
  {
    title: 'Salida Interoperable',
    description: 'El caso completo se serializa como: (1) Bundle HL7 FHIR Genomics Reporting IG STU2 con recursos perfilados, (2) Phenopacket GA4GH v2 con alelos VRS. Ambos formatos son descargables y pueden enviarse a servidores FHIR o compartirse con sistemas compatibles GA4GH.',
    tags: ['FHIR R4', 'Genomics IG STU2', 'VRS v1.3', 'Phenopackets v2'],
    color: 'bg-orange-500',
  },
];

const DOMAIN_MODELS = [
  {
    name: 'Variant',
    description: 'Representación canónica de variante somática',
    fields: ['gene, chrom, pos, ref, alt', 'hgvs, hgvs_c, hgvs_p', 'effect, type (SNV/INDEL/CNV/SV)', 'vaf, depth, quality, filter', 'clinvarSignificance, oncokbLevel', 'oncokbData, clinvarData'],
  },
  {
    name: 'Evidence',
    description: 'Ítem de evidencia de fuentes de anotación',
    fields: ['evidenceId, source (OncoKB/ClinVar)', 'level, description', 'tumorContext, drugAssociations', 'citations, timestamp'],
  },
  {
    name: 'Therapy',
    description: 'Asociación terapéutica droga-variante',
    fields: ['drug, combination[]', 'level, biomarker, tumorType', 'approvalStatus (US/EU/AR)', 'evidenceId'],
  },
  {
    name: 'CaseMetadata',
    description: 'Metadatos a nivel de caso',
    fields: ['patientId, sampleId', 'tumorType, reportSource (PDF/VCF)', 'parsingConfidence, timestamp'],
  },
  {
    name: 'ClinicalInterpretation',
    description: 'Interpretación de variante generada por IA',
    fields: ['tier (I-IV), classification', 'actionability, confidence', 'therapeuticImplications[]', 'clinicalTrials[], sources[]'],
  },
  {
    name: 'GenomicReport',
    description: 'Reporte de patología molecular generado por IA',
    fields: ['executiveSummary', 'variantClassifications[]', 'fdaApproved[], nccnRecommended[]', 'clinicalTrials[], limitations[]'],
  },
];

const API_ROUTES = [
  { method: 'POST', path: '/api/vcf/upload', desc: 'Parsear archivo VCF, extraer variantes, anotar, generar bundle FHIR' },
  { method: 'POST', path: '/api/pdf/upload', desc: 'Extraer variantes de reporte PDF usando Claude' },
  { method: 'POST', path: '/api/annotate', desc: 'Anotar variantes contra OncoKB + ClinVar + DGIdb (sin fallback IA)' },
  { method: 'POST', path: '/api/annotate/oncokb', desc: 'Anotación específica OncoKB' },
  { method: 'POST', path: '/api/fhir/compose', desc: 'Componer bundle FHIR desde anotaciones con IA (legacy)' },
  { method: 'POST', path: '/api/claude/interpret', desc: 'Interpretación clínica de variantes (AMP/ASCO/CAP Tier I-IV)' },
  { method: 'POST', path: '/api/claude/report', desc: 'Generar reporte de patología molecular (CAP/AMP)' },
  { method: 'POST', path: '/api/claude/chat', desc: 'Asistente conversacional de tumor board con contexto genómico' },
  { method: 'GET',  path: '/api/cases/[id]/fhir', desc: 'Generar Bundle conforme a Genomics Reporting IG (STU2)' },
  { method: 'POST', path: '/api/export/fhir', desc: 'Exportar caso como Bundle FHIR IG personalizable' },
  { method: 'POST', path: '/api/export/phenopacket', desc: 'Exportar caso como Phenopacket GA4GH v2 con alelos VRS' },
  { method: 'GET',  path: '/api/cases', desc: 'Listar todos los casos' },
  { method: 'GET',  path: '/api/cases/[id]', desc: 'Obtener datos completos del caso (metadata, variantes, evidencia, terapias, QC)' },
];

const STANDARDS = [
  {
    name: 'HL7 FHIR Genomics Reporting IG',
    version: 'STU2 (v2.0.0)',
    description: 'Guía de implementación para representar resultados de tests genómicos en FHIR. Define recursos perfilados para variantes, implicaciones y reportes.',
    borderColor: 'border-blue-500',
    profiles: [
      'genomics-report (DiagnosticReport)',
      'variant (Observation + LOINC 69548-6)',
      'diagnostic-implication (Observation)',
      'therapeutic-implication (Observation)',
    ],
  },
  {
    name: 'GA4GH VRS',
    version: 'v1.3',
    description: 'Especificación de Representación de Variantes. Provee identificadores de variantes no ambiguos y computables con IDs únicos globales basados en digest.',
    borderColor: 'border-green-500',
    profiles: [
      'Allele → SequenceLocation → SequenceInterval',
      'RefSeq accessions (GRCh38)',
      'SHA-512 truncated digest (ga4gh:VA.*)',
    ],
  },
  {
    name: 'GA4GH Phenopackets',
    version: 'v2.0.0',
    description: 'Schema para compartir información de enfermedades y fenotipos. Combina datos clínicos con interpretaciones genómicas en un formato computable único.',
    borderColor: 'border-green-500',
    profiles: [
      'Individual + Biosample + Disease',
      'GenomicInterpretation + VariationDescriptor',
      'Clasificación ACMG + alelos VRS',
      'MedicalAction (tratamientos)',
    ],
  },
  {
    name: 'FHIR R4',
    version: '4.0.1',
    description: 'Estándar base FHIR para interoperabilidad en salud. Recursos: Patient, Specimen, Observation, DiagnosticReport, ServiceRequest, Task.',
    borderColor: 'border-sky-500',
  },
  {
    name: 'LOINC',
    version: '2.77',
    description: 'Códigos universales para observaciones clínicas. Usado para variant assessment (69548-6), gene studied (48018-6), VAF (81258-6), clinical significance (53037-8), etc.',
    borderColor: 'border-amber-500',
  },
  {
    name: 'SMART on FHIR',
    version: 'v2.1 (planificado)',
    description: 'Framework basado en OAuth2 para apps integradas a HCE. Permitiría lanzar OncoLens directamente desde Epic, Cerner o cualquier HCE habilitado para SMART.',
    borderColor: 'border-gray-400',
    profiles: [
      'Flujo OAuth2 (/launch + /callback)',
      'Contexto de paciente desde HCE',
      'Write-back DiagnosticReport al HCE',
    ],
  },
];

const ANNOTATION_SOURCES = [
  {
    name: 'OncoKB',
    description: 'Base de conocimiento de oncología de precisión de MSK. Oncogenicidad, efectos de mutación, niveles terapéuticos (1-4), drogas aprobadas por FDA.',
    type: 'REST API',
  },
  {
    name: 'ClinVar',
    description: 'Base de datos del NCBI de interpretaciones clínicas de variantes. Clasificaciones de patogenicidad, estado de revisión, consenso de submitters.',
    type: 'E-Utilities (NCBI)',
  },
  {
    name: 'DGIdb',
    description: 'Base de datos de interacciones droga-gen. Interacciones, categorías druggable, fuentes de interacción.',
    type: 'GraphQL API',
  },
  {
    name: 'Claude Sonnet / Opus 4.6',
    description: 'Usado exclusivamente para extracción de variantes desde PDF, interpretación clínica (AMP/ASCO/CAP) y generación de reportes. NO se usa como fallback de anotación.',
    type: 'Anthropic API (configurable)',
  },
];

const VISUALIZER_TABS = [
  {
    name: 'Resumen',
    what: 'Dashboard con KPIs del caso: cantidad de variantes, ítems de evidencia, sugerencias terapéuticas, detalles del caso (paciente, muestra, tumor, fuente) y control de calidad.',
    how: 'Se alimenta directamente de los metadatos del caso y los conteos de los arrays de variantes/evidencia/terapias almacenados en memoria. No requiere llamadas adicionales a APIs.',
    borderColor: 'border-blue-500',
  },
  {
    name: 'Variantes',
    what: 'Tabla interactiva con todas las variantes detectadas. Columnas: gen, HGVS, tipo (SNV/INDEL/CNV), VAF, efecto funcional, clasificación ClinVar, nivel OncoKB, accionabilidad.',
    how: 'Las variantes provienen del parsing del VCF (parser propio con soporte multi-alélico y campos AD/VAF) o de la extracción por Claude del PDF. Se validan contra el schema Zod VariantSchema. La tabla usa TanStack Table con sorting, filtrado y paginación.',
    borderColor: 'border-cyan-500',
  },
  {
    name: 'Anotaciones',
    what: 'Evidencia clínica de cada variante: fuente (OncoKB, ClinVar, DGIdb), nivel de evidencia, descripción, asociaciones farmacológicas y contexto tumoral.',
    how: 'Durante el procesamiento, cada variante se envía en paralelo a 3 APIs: OncoKB (oncogenicidad + nivel terapéutico vía REST), ClinVar (significancia clínica vía E-Utilities del NCBI), y DGIdb (interacciones droga-gen). Si una API falla, se reporta el error explícitamente sin mezclar datos generados por IA. Los resultados se mapean al modelo Evidence.',
    borderColor: 'border-green-500',
  },
  {
    name: 'Terapias',
    what: 'Lista de sugerencias terapéuticas asociadas a las variantes detectadas: droga, nivel de evidencia, biomarcador, tipo de tumor, estado de aprobación.',
    how: 'Se obtienen de dos fuentes: (1) OncoKB devuelve tratamientos con nivel FDA (1-4) asociados a variantes oncogénicas, (2) DGIdb aporta interacciones droga-gen adicionales. Se filtran por biomarcador y tipo de tumor. Cada terapia tiene trazabilidad al evidenceId que la respalda.',
    borderColor: 'border-emerald-500',
  },
  {
    name: 'Visor de Reporte',
    what: 'Vista side-by-side del PDF original (si aplica) y el texto extraído, con highlights de variantes, evidencia y terapias detectadas.',
    how: 'Solo disponible para casos procesados desde PDF. El texto se extrae durante la ingesta con Claude (Sonnet/Opus). Los highlights se generan mapeando las variantes detectadas a posiciones en el texto extraído. Para VCF no hay PDF original, por lo que esta pestaña aparece vacía.',
    borderColor: 'border-amber-500',
  },
  {
    name: 'Insights Clínicos',
    what: 'Interpretación clínica de variantes siguiendo guías AMP/ASCO/CAP (Tier I-IV) y generación de reporte de patología molecular.',
    how: 'Al presionar "Interpretar Variantes", se envían todas las variantes a Claude (POST /api/claude/interpret) que las clasifica según las guías AMP/ASCO/CAP 2017: Tier I (significancia clínica fuerte), Tier II (potencial), Tier III (significancia incierta), Tier IV (benigno/probable benigno). Claude también evalúa accionabilidad, implicaciones terapéuticas y ensayos clínicos. "Generar Reporte" produce un reporte de patología molecular estructurado (POST /api/claude/report) con resumen ejecutivo, clasificaciones, terapias FDA/NCCN y limitaciones.',
    borderColor: 'border-violet-500',
  },
  {
    name: 'Tumor Board',
    what: 'Chat conversacional con IA para discusión de tumor board. Tiene contexto completo del caso (variantes, evidencia, terapias, tipo de tumor).',
    how: 'Cada mensaje se envía a POST /api/claude/chat junto con el historial de conversación y el contexto genómico completo. Claude actúa como oncólogo molecular asistente, respondiendo preguntas sobre accionabilidad, ensayos clínicos, mecanismos de resistencia, interacciones farmacológicas, etc. El modelo usado (Sonnet/Opus) se controla con el selector del header.',
    borderColor: 'border-purple-500',
  },
  {
    name: 'FHIR Bundle',
    what: 'Visualización y descarga del caso como Bundle HL7 FHIR conforme al Genomics Reporting IG (STU2).',
    how: 'Se genera bajo demanda llamando a GET /api/cases/[id]/fhir. El builder en src/lib/fhir/genomics-reporting.ts crea recursos perfilados: GenomicReport (DiagnosticReport), Variant (Observation + LOINC 69548-6), DiagnosticImplication, TherapeuticImplication, Patient, Specimen, ServiceRequest y Task. Cada variante se codifica con HGVS y coordenadas genómicas. El Bundle resultante es válido para enviar a servidores FHIR R4.',
    borderColor: 'border-sky-500',
  },
  {
    name: 'QC y Procedencia',
    what: 'Control de calidad: fuente del caso, confianza del parsing, métricas (total de variantes), alertas de calidad detectadas.',
    how: 'Para VCF, la confianza es 100% (parsing determinístico). Para PDF, la confianza depende de la calidad de extracción de Claude. Las alertas se generan cuando hay campos faltantes, variantes sin gen, o discrepancias en el parsing. Las métricas incluyen totalVariants y otros indicadores del proceso.',
    borderColor: 'border-orange-500',
  },
  {
    name: 'Auditoría y Notas',
    what: 'Log de auditoría del caso y sistema de notas clínicas. Permite agregar observaciones del equipo médico.',
    how: 'Las notas se persisten via POST /api/cases/[id]/notes. El log de auditoría registra eventos del ciclo de vida del caso (creación, anotación, interpretación, exportación). Cada entrada tiene timestamp e información contextual.',
    borderColor: 'border-red-500',
  },
];

const INTEGRATIONS = [
  {
    service: 'Anthropic Claude (Sonnet/Opus)',
    usage: 'Extracción de variantes desde PDF, interpretación clínica AMP/ASCO/CAP, generación de reportes, asistente de tumor board',
    cost: 'Pago por uso (~$3/1M tokens input)',
    active: true,
  },
  {
    service: 'MongoDB Atlas',
    usage: 'Persistencia de casos (variantes, evidencia, terapias, metadata). Fallback in-memory si no está disponible',
    cost: 'Gratis',
    active: true,
  },
  {
    service: 'HAPI FHIR Server',
    usage: 'Almacenamiento interoperable de recursos FHIR R4. Push de bundles, $validate, $everything, visor de pacientes',
    cost: 'Gratis',
    active: true,
  },
  {
    service: 'OncoKB (MSK)',
    usage: 'Anotación de variantes: oncogenicidad, efecto de mutación, niveles terapéuticos FDA (1-4), drogas aprobadas',
    cost: 'Gratis',
    active: true,
  },
  {
    service: 'ClinVar (NCBI)',
    usage: 'Significancia clínica de variantes: clasificación de patogenicidad, estado de revisión, consenso de submitters',
    cost: 'Gratis',
    active: true,
  },
  {
    service: 'DGIdb',
    usage: 'Interacciones droga-gen: fármacos asociados a genes mutados, categorías druggable, fuentes de interacción',
    cost: 'Gratis',
    active: true,
  },
  {
    service: 'CIViC',
    usage: 'Evidencia clínica curada: niveles A-E, tipos (predictivo/diagnóstico/pronóstico), significancia, citas PubMed',
    cost: 'Gratis (CC0)',
    active: true,
  },
  {
    service: 'PharmGKB',
    usage: 'Farmacogenómica: anotaciones clínicas 1A-2B, toxicidad, dosificación, drug labels FDA/EMA',
    cost: 'Gratis (CC BY-SA 4.0)',
    active: true,
  },
  {
    service: 'gnomAD',
    usage: 'Frecuencias alélicas poblacionales: filtrado de polimorfismos comunes (AF >1%), frecuencia por etnia',
    cost: 'Gratis',
    active: true,
  },
  {
    service: 'COSMIC (MyVariant.info)',
    usage: 'Mutaciones somáticas en cáncer: COSMIC ID, frecuencia de mutación en tumores, sitios tumorales',
    cost: 'Gratis',
    active: true,
  },
  {
    service: 'Vercel',
    usage: 'Hosting de la aplicación Next.js, CI/CD automático desde GitHub, dominio y SSL',
    cost: 'Gratis',
    active: true,
  },
  {
    service: 'Google OAuth',
    usage: 'Autenticación de usuarios con cuenta Google (whitelist de emails autorizados)',
    cost: 'Gratis',
    active: true,
  },
  {
    service: 'GCP Healthcare API',
    usage: 'FHIR store gestionado en Google Cloud (reemplazado por HAPI FHIR)',
    cost: 'Pago por uso',
    active: false,
  },
  {
    service: 'GCP Vertex AI (Gemini)',
    usage: 'Modelo de lenguaje alternativo (reemplazado por Claude Anthropic)',
    cost: 'Pago por uso',
    active: false,
  },
];

const CLAUDE_USES = [
  {
    title: 'Extracción de Variantes desde PDF',
    description: 'Extrae datos estructurados de variantes desde reportes clínicos no estructurados (Foundation Medicine, Guardant, etc.)',
    file: 'src/app/api/pdf/upload/route.ts',
  },
  {
    title: 'Consolidación de Anotaciones',
    description: 'Fusiona anotaciones de múltiples fuentes en una vista unificada por variante. Consolidación determinística sin IA.',
    file: 'src/app/api/annotate/route.ts',
  },
  {
    title: 'Interpretación Clínica',
    description: 'Clasifica variantes siguiendo guías AMP/ASCO/CAP 2017 (Tier I-IV) con implicaciones terapéuticas.',
    file: 'src/lib/claude/variantInterpreter.ts',
  },
  {
    title: 'Generación de Reportes',
    description: 'Genera reportes de patología molecular siguiendo guías CAP/AMP.',
    file: 'src/lib/claude/reportGenerator.ts',
  },
  {
    title: 'Asistente de Tumor Board',
    description: 'IA conversacional con contexto genómico completo para Q&A clínico durante tumor board.',
    file: 'src/lib/claude/tumorBoardAssistant.ts',
  },
];

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
          <h2 className="text-2xl font-bold mb-2">OncoFHIR Lens</h2>
          <p className="text-muted-foreground">
            Genomic analysis platform that extracts somatic variants from clinical reports (PDF/VCF),
            annotates them against multiple knowledge bases, interprets them following clinical guidelines,
            and outputs interoperable data in HL7 FHIR and GA4GH standards.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge>Next.js 14</Badge>
            <Badge>TypeScript (strict)</Badge>
            <Badge variant="secondary">Claude Sonnet 4.6</Badge>
            <Badge variant="secondary">FHIR R4</Badge>
            <Badge variant="secondary">GA4GH VRS + Phenopackets</Badge>
            <Badge variant="outline">Zod</Badge>
            <Badge variant="outline">Zustand</Badge>
            <Badge variant="outline">TanStack Table</Badge>
          </div>
        </Card>

        {/* ── Pipeline Flow ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Pipeline End-to-End</h3>
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
          <h3 className="text-xl font-semibold mb-4">Domain Model</h3>
          <p className="text-sm text-muted-foreground mb-4">
            All models are defined as Zod schemas in <code className="bg-muted px-1 rounded">src/core/models.ts</code>,
            providing runtime validation and TypeScript type inference from a single source of truth.
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
          <h3 className="text-xl font-semibold mb-4">API Routes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-semibold">Method</th>
                  <th className="text-left py-2 pr-4 font-semibold">Route</th>
                  <th className="text-left py-2 font-semibold">Description</th>
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
          <h3 className="text-xl font-semibold mb-4">Standards &amp; Specifications</h3>
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
          <h3 className="text-xl font-semibold mb-4">Annotation Knowledge Bases</h3>
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
          <h3 className="text-xl font-semibold mb-4">Claude Integration (Life Sciences)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Claude Sonnet 4.6 is used throughout the pipeline for tasks that require clinical reasoning,
            structured data extraction, and knowledge synthesis. All AI outputs are validated with Zod schemas.
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

        {/* ── Architecture Diagram (ASCII) ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Architecture Overview</h3>
          <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre">
{`
  ┌─────────────┐     ┌─────────────┐
  │  PDF Report  │     │  VCF File   │
  └──────┬──────┘     └──────┬──────┘
         │                    │
         ▼                    ▼
  ┌──────────────────────────────────┐
  │        INGEST LAYER              │
  │  Claude Sonnet 4.6 (PDF → JSON) │
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
  │   Claude Consolidation           │
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
                 ▼
  ┌──────────────────────────────────┐
  │        OUTPUT LAYER              │
  │                                  │
  │  ┌───────────────────────────┐   │
  │  │ FHIR Genomics Reporting   │   │
  │  │ IG (STU2)                 │   │
  │  │ • GenomicReport           │   │
  │  │ • Variant Observation     │   │
  │  │ • DiagnosticImplication   │   │
  │  │ • TherapeuticImplication  │   │
  │  │ • ServiceRequest + Task   │   │
  │  └───────────────────────────┘   │
  │                                  │
  │  ┌───────────────────────────┐   │
  │  │ GA4GH Standards           │   │
  │  │ • VRS v1.3 Alleles        │   │
  │  │ • Phenopackets v2         │   │
  │  └───────────────────────────┘   │
  │                                  │
  │  ┌───────────────────────────┐   │
  │  │ Future: SMART on FHIR     │   │
  │  │ → EHR Integration         │   │
  │  └───────────────────────────┘   │
  └──────────────────────────────────┘
`}
          </pre>
        </Card>

        {/* ── File Structure ── */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Key File Structure</h3>
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
│   ├── oncokb.ts                 # OncoKB API + Sonnet fallback
│   ├── clinvar.ts                # ClinVar API + Sonnet fallback
│   ├── dgidb.ts                  # DGIdb API + Sonnet fallback
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
    title: 'Input: PDF Report or VCF File',
    description: 'The user uploads a genomic report (PDF from commercial labs like Foundation Medicine, Guardant Health) or a VCF file from NGS sequencing.',
    tags: ['PDF parsing', 'VCF multi-allelic', 'Claude extraction'],
    color: 'bg-blue-500',
  },
  {
    title: 'Variant Extraction',
    description: 'PDFs are processed by Claude Sonnet 4.6 to extract structured variant data (gene, HGVS, coordinates, VAF). VCFs are parsed directly with support for multi-allelic sites, AD/VAF fields, and SnpEff/VEP annotations.',
    tags: ['sonnetJson<T>()', 'Zod validation', 'VariantInput schema'],
    color: 'bg-cyan-500',
  },
  {
    title: 'Multi-Source Annotation',
    description: 'Variants are annotated in parallel against OncoKB (oncogenicity, therapy levels), ClinVar (clinical significance, pathogenicity), and DGIdb (drug-gene interactions). When APIs are unavailable, Claude acts as a knowledgeable fallback.',
    tags: ['Promise.allSettled', 'OncoKB', 'ClinVar', 'DGIdb', 'Sonnet fallback'],
    color: 'bg-green-500',
  },
  {
    title: 'Annotation Consolidation',
    description: 'Data from all sources is merged into a unified annotation per variant. Claude consolidates conflicting or complementary evidence into a single coherent view with evidence sources tracked.',
    tags: ['ConsolidatedAnnotation', 'Evidence', 'Therapy'],
    color: 'bg-emerald-500',
  },
  {
    title: 'Clinical Interpretation (Claude Life Sciences)',
    description: 'Each variant is classified following AMP/ASCO/CAP 2017 guidelines (Tier I-IV). Claude assigns pathogenicity, actionability, therapeutic implications with evidence levels, relevant clinical trials, and confidence assessment.',
    tags: ['AMP Tier I-IV', 'ACMG/AMP', 'ClinicalInterpretation schema'],
    color: 'bg-violet-500',
  },
  {
    title: 'Report Generation',
    description: 'A structured molecular pathology report is generated following CAP/AMP guidelines: executive summary, variant classifications, FDA-approved therapies, NCCN recommendations, clinical trials, monitoring, and limitations.',
    tags: ['GenomicReport schema', 'CAP/AMP guidelines'],
    color: 'bg-purple-500',
  },
  {
    title: 'Interoperable Output',
    description: 'The complete case is serialized as: (1) HL7 FHIR Genomics Reporting IG STU2 Bundle with profiled resources, (2) GA4GH Phenopacket v2 with VRS alleles. Both formats are downloadable and can be submitted to FHIR servers or shared with GA4GH-compatible systems.',
    tags: ['FHIR R4', 'Genomics IG STU2', 'VRS v1.3', 'Phenopackets v2'],
    color: 'bg-orange-500',
  },
];

const DOMAIN_MODELS = [
  {
    name: 'Variant',
    description: 'Canonical somatic variant representation',
    fields: ['gene, chrom, pos, ref, alt', 'hgvs, hgvs_c, hgvs_p', 'effect, type (SNV/INDEL/CNV/SV)', 'vaf, depth, quality, filter', 'clinvarSignificance, oncokbLevel', 'oncokbData, clinvarData'],
  },
  {
    name: 'Evidence',
    description: 'Evidence item from annotation sources',
    fields: ['evidenceId, source (OncoKB/ClinVar)', 'level, description', 'tumorContext, drugAssociations', 'citations, timestamp'],
  },
  {
    name: 'Therapy',
    description: 'Drug-variant therapeutic association',
    fields: ['drug, combination[]', 'level, biomarker, tumorType', 'approvalStatus (US/EU/AR)', 'evidenceId'],
  },
  {
    name: 'CaseMetadata',
    description: 'Case-level metadata',
    fields: ['patientId, sampleId', 'tumorType, reportSource (PDF/VCF)', 'parsingConfidence, timestamp'],
  },
  {
    name: 'ClinicalInterpretation',
    description: 'AI-generated variant interpretation',
    fields: ['tier (I-IV), classification', 'actionability, confidence', 'therapeuticImplications[]', 'clinicalTrials[], sources[]'],
  },
  {
    name: 'GenomicReport',
    description: 'AI-generated molecular pathology report',
    fields: ['executiveSummary', 'variantClassifications[]', 'fdaApproved[], nccnRecommended[]', 'clinicalTrials[], limitations[]'],
  },
];

const API_ROUTES = [
  { method: 'POST', path: '/api/vcf/upload', desc: 'Parse VCF file, extract variants, annotate, generate FHIR bundle' },
  { method: 'POST', path: '/api/pdf/upload', desc: 'Extract variants from PDF report using Claude Sonnet 4.6' },
  { method: 'POST', path: '/api/annotate', desc: 'Annotate variants against OncoKB + ClinVar + DGIdb with consolidation' },
  { method: 'POST', path: '/api/annotate/oncokb', desc: 'OncoKB-specific annotation with Sonnet fallback' },
  { method: 'POST', path: '/api/fhir/compose', desc: 'AI-compose FHIR bundle from annotations (legacy)' },
  { method: 'POST', path: '/api/claude/interpret', desc: 'Clinical variant interpretation (AMP/ASCO/CAP Tier I-IV)' },
  { method: 'POST', path: '/api/claude/report', desc: 'Generate molecular pathology report (CAP/AMP)' },
  { method: 'POST', path: '/api/claude/chat', desc: 'Tumor board conversational assistant with genomic context' },
  { method: 'GET',  path: '/api/cases/[id]/fhir', desc: 'Generate Genomics Reporting IG (STU2) compliant Bundle' },
  { method: 'POST', path: '/api/export/fhir', desc: 'Export case as customizable FHIR IG Bundle' },
  { method: 'POST', path: '/api/export/phenopacket', desc: 'Export case as GA4GH Phenopacket v2 with VRS alleles' },
  { method: 'GET',  path: '/api/cases', desc: 'List all cases' },
  { method: 'GET',  path: '/api/cases/[id]', desc: 'Get full case data (metadata, variants, evidence, therapies, QC)' },
];

const STANDARDS = [
  {
    name: 'HL7 FHIR Genomics Reporting IG',
    version: 'STU2 (v2.0.0)',
    description: 'Implementation guide for representing genomic test results in FHIR. Defines profiled resources for variants, implications, and reports.',
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
    description: 'Variant Representation Specification. Provides unambiguous, computable variant identifiers with digest-based globally unique IDs.',
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
    description: 'Schema for sharing disease and phenotype information. Combines clinical data with genomic interpretations in a single computable format.',
    borderColor: 'border-green-500',
    profiles: [
      'Individual + Biosample + Disease',
      'GenomicInterpretation + VariationDescriptor',
      'ACMG classification + VRS alleles',
      'MedicalAction (treatments)',
    ],
  },
  {
    name: 'FHIR R4',
    version: '4.0.1',
    description: 'Base FHIR standard for healthcare interoperability. Resources: Patient, Specimen, Observation, DiagnosticReport, ServiceRequest, Task.',
    borderColor: 'border-sky-500',
  },
  {
    name: 'LOINC',
    version: '2.77',
    description: 'Universal codes for clinical observations. Used for variant assessment (69548-6), gene studied (48018-6), VAF (81258-6), clinical significance (53037-8), etc.',
    borderColor: 'border-amber-500',
  },
  {
    name: 'SMART on FHIR',
    version: 'v2.1 (planned)',
    description: 'OAuth2-based framework for EHR-integrated apps. Would enable launching OncoFHIR Lens directly from Epic, Cerner, or any SMART-enabled EHR.',
    borderColor: 'border-gray-400',
    profiles: [
      'OAuth2 launch flow (/launch + /callback)',
      'Patient context from EHR',
      'Write-back DiagnosticReport to EHR',
    ],
  },
];

const ANNOTATION_SOURCES = [
  {
    name: 'OncoKB',
    description: 'MSK precision oncology knowledge base. Oncogenicity, mutation effects, therapy levels (1-4), FDA-approved drugs.',
    type: 'REST API + Sonnet fallback',
  },
  {
    name: 'ClinVar',
    description: 'NCBI database of clinical variant interpretations. Pathogenicity classifications, review status, submitter consensus.',
    type: 'E-Utilities + Sonnet fallback',
  },
  {
    name: 'DGIdb',
    description: 'Drug-Gene Interaction Database. Drug-gene interactions, druggable categories, interaction sources.',
    type: 'GraphQL + Sonnet fallback',
  },
  {
    name: 'Claude Sonnet 4.6',
    description: 'AI fallback when APIs are unavailable. Also used for consolidation, interpretation, and report generation.',
    type: 'Anthropic API',
  },
];

const CLAUDE_USES = [
  {
    title: 'PDF Variant Extraction',
    description: 'Extracts structured variant data from unstructured clinical reports (Foundation Medicine, Guardant, etc.)',
    file: 'src/app/api/pdf/upload/route.ts',
  },
  {
    title: 'Annotation Fallback',
    description: 'Acts as knowledge-based fallback for OncoKB, ClinVar, and DGIdb when real APIs are unavailable or rate-limited.',
    file: 'src/lib/oncokb.ts, clinvar.ts, dgidb.ts',
  },
  {
    title: 'Annotation Consolidation',
    description: 'Merges annotations from multiple sources into a unified view per variant, resolving conflicts.',
    file: 'src/app/api/annotate/route.ts',
  },
  {
    title: 'Clinical Interpretation',
    description: 'Classifies variants following AMP/ASCO/CAP 2017 guidelines (Tier I-IV) with therapeutic implications.',
    file: 'src/lib/claude/variantInterpreter.ts',
  },
  {
    title: 'Report Generation',
    description: 'Generates molecular pathology reports following CAP/AMP guidelines.',
    file: 'src/lib/claude/reportGenerator.ts',
  },
  {
    title: 'Tumor Board Assistant',
    description: 'Conversational AI with full genomic context for clinical Q&A during tumor board.',
    file: 'src/lib/claude/tumorBoardAssistant.ts',
  },
];

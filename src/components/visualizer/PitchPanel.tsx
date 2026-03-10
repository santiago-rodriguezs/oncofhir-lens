'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PitchPanel() {
  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-10 pr-4 pb-12">

        {/* ── Hero ── */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              OncoFHIR Lens
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Plataforma de genómica clínica que transforma reportes de secuenciación en datos
            interoperables y accionables para oncología de precisión.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">HL7 FHIR R4</Badge>
            <Badge className="bg-green-100 text-green-700 border-green-200">GA4GH VRS + Phenopackets</Badge>
            <Badge className="bg-violet-100 text-violet-700 border-violet-200">Claude Sonnet 4.6</Badge>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">AMP/ASCO/CAP Guidelines</Badge>
          </div>
        </div>

        {/* ── Problema & Solución ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-l-4 border-red-400 bg-red-50/50">
            <h3 className="text-lg font-bold text-red-700 mb-3">El Problema</h3>
            <ul className="space-y-2 text-sm text-red-900">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">x</span>
                Los reportes genómicos llegan en <strong>PDFs no estructurados</strong> — no son computables
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">x</span>
                La anotación de variantes requiere consultar <strong>múltiples bases de datos</strong> manualmente
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">x</span>
                La interpretación clínica depende de <strong>expertise escaso</strong> en genómica molecular
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">x</span>
                Los datos quedan <strong>aislados</strong> — no se integran con la historia clínica electrónica
              </li>
            </ul>
          </Card>
          <Card className="p-6 border-l-4 border-green-400 bg-green-50/50">
            <h3 className="text-lg font-bold text-green-700 mb-3">La Solución</h3>
            <ul className="space-y-2 text-sm text-green-900">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">&#10003;</span>
                <strong>Extracción inteligente</strong> de variantes desde PDF y VCF con IA
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">&#10003;</span>
                <strong>Anotación automática</strong> contra OncoKB, ClinVar y DGIdb en paralelo
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">&#10003;</span>
                <strong>Interpretación clínica</strong> con guías AMP/ASCO/CAP asistida por Claude
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">&#10003;</span>
                <strong>Salida interoperable</strong> en FHIR Genomics IG + GA4GH estándares
              </li>
            </ul>
          </Card>
        </div>

        {/* ── Diagrama de Integración Principal ── */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-2 text-center">Arquitectura de Integración</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Flujo end-to-end desde la entrada del estudio hasta la salida interoperable
          </p>
          <div className="flex flex-col items-center gap-0">
            {/* Input Layer */}
            <div className="flex gap-4 mb-2">
              <div className="px-4 py-2 bg-blue-100 border-2 border-blue-300 rounded-lg text-center text-sm font-semibold text-blue-800 min-w-[140px]">
                PDF Genómico
                <div className="text-xs font-normal text-blue-600 mt-0.5">Foundation, Guardant...</div>
              </div>
              <div className="px-4 py-2 bg-blue-100 border-2 border-blue-300 rounded-lg text-center text-sm font-semibold text-blue-800 min-w-[140px]">
                Archivo VCF
                <div className="text-xs font-normal text-blue-600 mt-0.5">NGS / WES / WGS</div>
              </div>
            </div>
            <Arrow />

            {/* AI Extraction */}
            <div className="w-full max-w-lg px-6 py-3 bg-violet-100 border-2 border-violet-300 rounded-xl text-center">
              <div className="font-bold text-violet-800">Claude Sonnet 4.6</div>
              <div className="text-xs text-violet-600 mt-1">
                Extracción estructurada de variantes + Validación con Zod schemas
              </div>
            </div>
            <Arrow />

            {/* Annotation */}
            <div className="w-full max-w-lg px-4 py-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl">
              <div className="font-bold text-emerald-800 text-center mb-3">Pipeline de Anotación Multi-fuente</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="px-3 py-2 bg-white border border-emerald-200 rounded-lg text-center">
                  <div className="font-semibold text-sm">OncoKB</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Oncogenicidad</div>
                  <div className="text-xs text-muted-foreground">Niveles terapéuticos</div>
                </div>
                <div className="px-3 py-2 bg-white border border-emerald-200 rounded-lg text-center">
                  <div className="font-semibold text-sm">ClinVar</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Significancia clínica</div>
                  <div className="text-xs text-muted-foreground">Patogenicidad</div>
                </div>
                <div className="px-3 py-2 bg-white border border-emerald-200 rounded-lg text-center">
                  <div className="font-semibold text-sm">DGIdb</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Interacciones</div>
                  <div className="text-xs text-muted-foreground">droga-gen</div>
                </div>
              </div>
              <div className="text-xs text-center text-emerald-600 mt-2 italic">
                Solo datos validados de bases de conocimiento
              </div>
            </div>
            <Arrow />

            {/* Interpretation */}
            <div className="w-full max-w-lg px-6 py-3 bg-purple-100 border-2 border-purple-300 rounded-xl text-center">
              <div className="font-bold text-purple-800">Interpretación Clínica</div>
              <div className="flex justify-center gap-2 mt-2">
                <Badge className="bg-purple-200 text-purple-800 text-xs">AMP Tier I-IV</Badge>
                <Badge className="bg-purple-200 text-purple-800 text-xs">ACMG/AMP</Badge>
                <Badge className="bg-purple-200 text-purple-800 text-xs">Reporte Molecular</Badge>
                <Badge className="bg-purple-200 text-purple-800 text-xs">Tumor Board</Badge>
              </div>
            </div>
            <Arrow />

            {/* Output */}
            <div className="w-full max-w-lg px-4 py-4 bg-orange-50 border-2 border-orange-300 rounded-xl">
              <div className="font-bold text-orange-800 text-center mb-3">Salida Interoperable</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="px-3 py-3 bg-white border border-blue-200 rounded-lg text-center">
                  <div className="font-semibold text-sm text-blue-700">FHIR Genomics IG</div>
                  <div className="text-xs text-muted-foreground mt-1">STU2 (v2.0.0)</div>
                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    <Badge variant="outline" className="text-[10px]">GenomicReport</Badge>
                    <Badge variant="outline" className="text-[10px]">Variant</Badge>
                    <Badge variant="outline" className="text-[10px]">DiagnosticImplication</Badge>
                    <Badge variant="outline" className="text-[10px]">TherapeuticImplication</Badge>
                  </div>
                </div>
                <div className="px-3 py-3 bg-white border border-green-200 rounded-lg text-center">
                  <div className="font-semibold text-sm text-green-700">GA4GH Standards</div>
                  <div className="text-xs text-muted-foreground mt-1">VRS v1.3 + Phenopackets v2</div>
                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    <Badge variant="outline" className="text-[10px]">VRS Alleles</Badge>
                    <Badge variant="outline" className="text-[10px]">Phenopacket</Badge>
                    <Badge variant="outline" className="text-[10px]">ACMG Class</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Valor Diferencial ── */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-6 text-center">Valor Diferencial</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUE_PROPS.map((v) => (
              <div key={v.title} className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl ${v.bg}`}>
                  {v.icon}
                </div>
                <h4 className="font-bold mt-3 mb-1">{v.title}</h4>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Mapa de Integraciones ── */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-2 text-center">Ecosistema de Integraciones</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Cada componente está conectado con estándares internacionales y APIs reales
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.map((integration) => (
              <Card key={integration.name} className={`p-4 border-l-4 ${integration.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{integration.icon}</span>
                  <h4 className="font-bold text-sm">{integration.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{integration.description}</p>
                <div className="flex flex-wrap gap-1">
                  {integration.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* ── Stack Tecnológico ── */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-6 text-center">Stack Tecnológico</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TECH_STACK.map((tech) => (
              <div key={tech.name} className="text-center p-3 rounded-lg bg-muted/50">
                <div className="font-semibold text-sm">{tech.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{tech.role}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Diagrama de Estándares Clínicos ── */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-2 text-center">Estándares Clínicos Implementados</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            OncoFHIR Lens es pionero en combinar estos estándares en una sola herramienta
          </p>
          <div className="flex flex-col items-center gap-0">
            {/* Variant Representation */}
            <div className="w-full max-w-2xl grid grid-cols-3 gap-3 mb-3">
              <Card className="p-3 border-2 border-blue-200 bg-blue-50/50 text-center">
                <div className="text-xs font-bold text-blue-700 mb-1">FHIR Genomics IG</div>
                <div className="text-[10px] text-blue-600">HL7 International</div>
                <div className="mt-2 space-y-0.5">
                  <div className="text-[10px] bg-white rounded px-1 py-0.5">GenomicReport</div>
                  <div className="text-[10px] bg-white rounded px-1 py-0.5">Variant Observation</div>
                  <div className="text-[10px] bg-white rounded px-1 py-0.5">Diagnostic Implication</div>
                  <div className="text-[10px] bg-white rounded px-1 py-0.5">Therapeutic Implication</div>
                </div>
              </Card>
              <Card className="p-3 border-2 border-green-200 bg-green-50/50 text-center">
                <div className="text-xs font-bold text-green-700 mb-1">GA4GH VRS v1.3</div>
                <div className="text-[10px] text-green-600">Global Alliance</div>
                <div className="mt-2 space-y-0.5">
                  <div className="text-[10px] bg-white rounded px-1 py-0.5">Allele + Location</div>
                  <div className="text-[10px] bg-white rounded px-1 py-0.5">RefSeq GRCh38</div>
                  <div className="text-[10px] bg-white rounded px-1 py-0.5">ga4gh:VA.* digest</div>
                </div>
              </Card>
              <Card className="p-3 border-2 border-teal-200 bg-teal-50/50 text-center">
                <div className="text-xs font-bold text-teal-700 mb-1">Phenopackets v2</div>
                <div className="text-[10px] text-teal-600">GA4GH</div>
                <div className="mt-2 space-y-0.5">
                  <div className="text-[10px] bg-white rounded px-1 py-0.5">Individual + Biosample</div>
                  <div className="text-[10px] bg-white rounded px-1 py-0.5">GenomicInterpretation</div>
                  <div className="text-[10px] bg-white rounded px-1 py-0.5">ACMG Classification</div>
                </div>
              </Card>
            </div>

            <div className="flex items-center gap-2 my-2">
              <div className="h-px w-12 bg-gray-300" />
              <span className="text-xs text-muted-foreground font-medium">Guías de Interpretación</span>
              <div className="h-px w-12 bg-gray-300" />
            </div>

            <div className="w-full max-w-2xl grid grid-cols-3 gap-3 mt-2">
              <Card className="p-3 border-2 border-purple-200 bg-purple-50/50 text-center">
                <div className="text-xs font-bold text-purple-700">AMP/ASCO/CAP 2017</div>
                <div className="text-[10px] text-purple-600 mt-1">Clasificación somática</div>
                <div className="text-[10px] text-purple-600">Tier I-IV</div>
              </Card>
              <Card className="p-3 border-2 border-amber-200 bg-amber-50/50 text-center">
                <div className="text-xs font-bold text-amber-700">LOINC + SNOMED CT</div>
                <div className="text-[10px] text-amber-600 mt-1">Codificación universal</div>
                <div className="text-[10px] text-amber-600">Observaciones genómicas</div>
              </Card>
              <Card className="p-3 border-2 border-rose-200 bg-rose-50/50 text-center">
                <div className="text-xs font-bold text-rose-700">Sequence Ontology</div>
                <div className="text-[10px] text-rose-600 mt-1">Tipos de variante</div>
                <div className="text-[10px] text-rose-600">Efectos funcionales</div>
              </Card>
            </div>
          </div>
        </Card>

        {/* ── Flujo del Usuario ── */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-6 text-center">Flujo del Usuario</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {USER_FLOW.map((step, idx) => (
              <div key={step.title} className="flex items-center gap-4">
                <div className="text-center min-w-[120px]">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold ${step.color}`}>
                    {idx + 1}
                  </div>
                  <h4 className="font-semibold text-sm mt-2">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                </div>
                {idx < USER_FLOW.length - 1 && (
                  <div className="hidden md:block text-gray-300 text-2xl">&#8594;</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* ── Comparativa ── */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 text-center">Comparativa con el Enfoque Tradicional</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-3 pr-4 font-bold">Aspecto</th>
                  <th className="text-left py-3 pr-4 font-bold text-red-600">Flujo Manual</th>
                  <th className="text-left py-3 font-bold text-green-600">OncoFHIR Lens</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, idx) => (
                  <tr key={idx} className="border-b border-dashed">
                    <td className="py-2.5 pr-4 font-medium">{row.aspect}</td>
                    <td className="py-2.5 pr-4 text-red-700 text-xs">{row.manual}</td>
                    <td className="py-2.5 text-green-700 text-xs">{row.oncofhir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Roadmap ── */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 text-center">Roadmap</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROADMAP.map((phase) => (
              <Card key={phase.title} className={`p-4 border-t-4 ${phase.border}`}>
                <Badge className={phase.badgeClass}>{phase.badge}</Badge>
                <h4 className="font-bold mt-2">{phase.title}</h4>
                <ul className="mt-2 space-y-1">
                  {phase.items.map((item) => (
                    <li key={item} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="mt-0.5">{phase.done ? '\u2713' : '\u25CB'}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Card>

        {/* ── Footer ── */}
        <div className="text-center py-4 text-sm text-muted-foreground">
          <p className="font-semibold">OncoFHIR Lens</p>
          <p>Tesis de grado — Licenciatura en Bioinformática</p>
          <p className="mt-1">Santiago Rodriguez Salinas</p>
        </div>

      </div>
    </ScrollArea>
  );
}

// ── Arrow connector ──
function Arrow() {
  return (
    <div className="flex flex-col items-center my-1">
      <div className="w-0.5 h-4 bg-gray-300" />
      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-gray-400" />
    </div>
  );
}

// ── Data ──

const VALUE_PROPS = [
  {
    icon: '\u{1F9EC}',
    title: 'De PDF a FHIR en minutos',
    description: 'Transforma reportes genómicos no estructurados en recursos FHIR interoperables automáticamente.',
    bg: 'bg-blue-100',
  },
  {
    icon: '\u{1F916}',
    title: 'IA Clínica Validada',
    description: 'Claude Sonnet 4.6 interpreta variantes siguiendo guías AMP/ASCO/CAP con schemas Zod estrictos.',
    bg: 'bg-violet-100',
  },
  {
    icon: '\u{1F310}',
    title: 'Estándares Globales',
    description: 'Compatible con FHIR Genomics IG, GA4GH VRS, Phenopackets — listo para integrarse con cualquier HCE.',
    bg: 'bg-green-100',
  },
  {
    icon: '\u{1F50D}',
    title: 'Multi-Source Annotation',
    description: 'Consulta OncoKB, ClinVar y DGIdb en paralelo. Solo datos validados de bases de conocimiento.',
    bg: 'bg-emerald-100',
  },
  {
    icon: '\u{1F4CA}',
    title: 'Interpretación Accionable',
    description: 'Clasificación AMP Tier I-IV, implicaciones terapéuticas, ensayos clínicos relevantes.',
    bg: 'bg-purple-100',
  },
  {
    icon: '\u{1F4AC}',
    title: 'Tumor Board Asistente',
    description: 'Chat con contexto genómico completo para discusión clínica en tiempo real.',
    bg: 'bg-orange-100',
  },
];

const INTEGRATIONS = [
  {
    name: 'Anthropic Claude API',
    icon: '\u{1F916}',
    description: 'Motor de IA para extracción, interpretación, reportes y chat. Modelo Sonnet 4.6 optimizado para ciencias de la vida.',
    tags: ['PDF extraction', 'Variant interpretation', 'Report generation', 'Tumor board'],
    border: 'border-violet-400',
  },
  {
    name: 'OncoKB (MSK)',
    icon: '\u{1F3E5}',
    description: 'Base de datos de oncología de precisión del Memorial Sloan Kettering. Niveles de evidencia terapéutica FDA.',
    tags: ['Oncogenicity', 'Therapy levels 1-4', 'FDA approved'],
    border: 'border-blue-400',
  },
  {
    name: 'ClinVar (NCBI)',
    icon: '\u{1F9EA}',
    description: 'Base de datos de variantes clínicas del NIH. Clasificaciones de patogenicidad y significancia clínica.',
    tags: ['Pathogenicity', 'Clinical significance', 'Review status'],
    border: 'border-sky-400',
  },
  {
    name: 'DGIdb',
    icon: '\u{1F48A}',
    description: 'Base de datos de interacciones droga-gen. Druggability y opciones terapéuticas.',
    tags: ['Drug-gene interactions', 'Druggable categories'],
    border: 'border-teal-400',
  },
  {
    name: 'HL7 FHIR R4',
    icon: '\u{1F525}',
    description: 'Estándar de interoperabilidad en salud. Genomics Reporting IG STU2 para representación de variantes.',
    tags: ['DiagnosticReport', 'Observation', 'Patient', 'Specimen'],
    border: 'border-orange-400',
  },
  {
    name: 'GA4GH',
    icon: '\u{1F30D}',
    description: 'Global Alliance for Genomics & Health. VRS para representación canónica, Phenopackets para interoperabilidad.',
    tags: ['VRS v1.3', 'Phenopackets v2', 'Beacon API (futuro)'],
    border: 'border-green-400',
  },
];

const TECH_STACK = [
  { name: 'Next.js 14', role: 'Framework fullstack' },
  { name: 'TypeScript', role: 'Type safety (strict)' },
  { name: 'Zod', role: 'Schema validation' },
  { name: 'Zustand', role: 'State management' },
  { name: 'TanStack Table', role: 'Data tables' },
  { name: 'Radix UI', role: 'Componentes accesibles' },
  { name: 'Tailwind CSS', role: 'Estilos utilitarios' },
  { name: 'Playwright', role: 'Testing E2E' },
];

const USER_FLOW = [
  { title: 'Subir', desc: 'PDF o VCF', color: 'bg-blue-500' },
  { title: 'Extraer', desc: 'Variantes con IA', color: 'bg-cyan-500' },
  { title: 'Anotar', desc: 'OncoKB + ClinVar + DGIdb', color: 'bg-green-500' },
  { title: 'Interpretar', desc: 'AMP/ASCO/CAP Tiers', color: 'bg-purple-500' },
  { title: 'Exportar', desc: 'FHIR + GA4GH', color: 'bg-orange-500' },
];

const COMPARISON = [
  {
    aspect: 'Tiempo de procesamiento',
    manual: 'Horas a días por caso',
    oncofhir: 'Segundos (< 30s por caso)',
  },
  {
    aspect: 'Consulta de bases de datos',
    manual: 'Manual, una por una',
    oncofhir: 'Automática, 3 fuentes en paralelo',
  },
  {
    aspect: 'Clasificación de variantes',
    manual: 'Depende del genetista disponible',
    oncofhir: 'IA con guías AMP/ASCO/CAP',
  },
  {
    aspect: 'Formato de salida',
    manual: 'PDF o texto libre',
    oncofhir: 'FHIR IG + GA4GH computables',
  },
  {
    aspect: 'Integración con HCE',
    manual: 'Copy-paste manual',
    oncofhir: 'FHIR nativo, listo para EHR',
  },
  {
    aspect: 'Reproducibilidad',
    manual: 'Varía según el profesional',
    oncofhir: 'Determinista, auditable, versionado',
  },
];

const ROADMAP = [
  {
    title: 'MVP (Actual)',
    badge: 'Completado',
    badgeClass: 'bg-green-100 text-green-700',
    border: 'border-green-400',
    done: true,
    items: [
      'Ingesta PDF + VCF',
      'Anotación multi-fuente',
      'Interpretación AMP/ASCO/CAP',
      'FHIR Genomics IG STU2',
      'GA4GH VRS + Phenopackets',
      'Tumor Board chat',
    ],
  },
  {
    title: 'Fase 2',
    badge: 'En progreso',
    badgeClass: 'bg-amber-100 text-amber-700',
    border: 'border-amber-400',
    done: false,
    items: [
      'SMART on FHIR launch',
      'Integración con HAPI FHIR Server',
      'Soporte multi-paciente',
      'Historial de casos persistente',
    ],
  },
  {
    title: 'Fase 3',
    badge: 'Planificado',
    badgeClass: 'bg-gray-100 text-gray-700',
    border: 'border-gray-400',
    done: false,
    items: [
      'Beacon API v2 (GA4GH)',
      'CDS Hooks para alertas en EHR',
      'Soporte multi-idioma',
      'Validación clínica formal',
    ],
  },
];

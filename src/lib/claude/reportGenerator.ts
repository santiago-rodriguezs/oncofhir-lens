import { Variant, Evidence, Therapy } from '@/core/models';
import { sonnetJson } from '@/lib/sonnet';
import { GenomicReport } from './schemas';
import { ClinicalInterpretation } from './schemas';
import { getClaudeModel } from '@/lib/model';
import { z } from 'zod';

// ── Variant importance scoring ────────────────────────────────────────────

const ONCOKB_LEVEL_SCORE: Record<string, number> = {
  LEVEL_1: 100, LEVEL_2: 80, LEVEL_3A: 60, LEVEL_3B: 50,
  LEVEL_4: 30, LEVEL_R1: 70, LEVEL_R2: 40,
};

const CLINVAR_SCORE: Record<string, number> = {
  Pathogenic: 80, 'Likely pathogenic': 60, 'Pathogenic/Likely_pathogenic': 70,
  'Uncertain significance': 20, 'Likely benign': 5, Benign: 0,
};

function scoreVariant(v: Variant): number {
  let score = 0;

  // OncoKB level
  if (v.oncokbLevel) score += ONCOKB_LEVEL_SCORE[v.oncokbLevel] || 10;

  // ClinVar significance
  if (v.clinvarSignificance) {
    const key = Object.keys(CLINVAR_SCORE).find(k =>
      v.clinvarSignificance!.toLowerCase().includes(k.toLowerCase())
    );
    if (key) score += CLINVAR_SCORE[key];
  }

  // High VAF = clonal driver
  if (v.vaf != null) {
    if (v.vaf > 0.3) score += 30;
    else if (v.vaf > 0.1) score += 15;
  }

  // COSMIC hits = recurrent somatic
  if (v.cosmicCount && v.cosmicCount > 100) score += 25;
  else if (v.cosmicCount && v.cosmicCount > 10) score += 10;

  // Common polymorphism penalty
  if (v.isCommonPolymorphism) score -= 50;

  // Known cancer genes bonus
  const CANCER_GENES = ['TP53', 'EGFR', 'KRAS', 'BRAF', 'PIK3CA', 'NRAS', 'ALK', 'ROS1', 'MET', 'HER2', 'ERBB2', 'RET', 'BRCA1', 'BRCA2', 'IDH1', 'IDH2', 'FLT3', 'NPM1', 'JAK2', 'ABL1', 'KIT', 'PDGFRA'];
  if (v.gene && CANCER_GENES.includes(v.gene.toUpperCase())) score += 20;

  return score;
}

function rankVariants(variants: Variant[]): Variant[] {
  return [...variants].sort((a, b) => scoreVariant(b) - scoreVariant(a));
}

// ── Template-based report builder ─────────────────────────────────────────

function buildVariantClassifications(
  variants: Variant[],
  interpretations?: ClinicalInterpretation[]
): GenomicReport['variantClassifications'] {
  return variants.map(v => {
    const interp = interpretations?.find(
      i => i.gene === v.gene && (i.variant === v.hgvs_p || i.variant === v.hgvs_c || i.variant === v.hgvs)
    );

    // Tier assignment based on OncoKB level (gold standard)
    const tier = interp?.tier
      || (v.oncokbLevel?.match(/LEVEL_(1|2|R1)/) ? 'Tier I'
        : v.oncokbLevel?.match(/LEVEL_(3A|3B|4|R2)/) ? 'Tier II'
        : v.clinvarSignificance?.toLowerCase().includes('pathogenic') ? 'Tier II'
        : v.isCommonPolymorphism ? 'Tier IV'
        : 'Tier III');

    // Classification: prefer OncoKB oncogenic data, then ClinVar
    const oncokbOncogenic = v.oncokbData?.oncogenic;
    const classification = interp?.classification
      || (oncokbOncogenic === 'Oncogenic' ? 'Pathogenic'
        : oncokbOncogenic === 'Likely Oncogenic' ? 'Likely Pathogenic'
        : v.clinvarSignificance || 'Uncertain Significance');

    // Build rich significance string from all available data
    const parts: string[] = [];
    if (v.oncokbLevel) {
      const levelName = v.oncokbLevel.replace('LEVEL_', 'Level ');
      parts.push(`OncoKB ${levelName}`);
    }
    if (oncokbOncogenic) parts.push(`${oncokbOncogenic}`);
    if (v.oncokbData?.mutationEffect) parts.push(`Efecto: ${v.oncokbData.mutationEffect}`);
    if (v.clinvarSignificance) parts.push(`ClinVar: ${v.clinvarSignificance}`);
    if (v.cosmicId) parts.push(`${v.cosmicId} (${v.cosmicCount?.toLocaleString() || '?'} casos)`);
    if (v.gnomadAF != null) parts.push(`gnomAD AF: ${(v.gnomadAF * 100).toFixed(3)}%`);
    if (v.vaf != null) parts.push(`VAF: ${(v.vaf * 100).toFixed(1)}%`);
    if (v.effect) parts.push(v.effect);

    const significance = interp?.tierRationale || parts.join(' | ') || 'Sin datos de anotación disponibles';

    return {
      gene: v.gene || 'Unknown',
      variant: v.hgvs || v.hgvs_p || v.hgvs_c || `${v.chrom}:${v.pos} ${v.ref}>${v.alt}`,
      tier,
      classification,
      clinicalSignificance: significance,
    };
  });
}

function buildTherapeuticImplications(
  therapies: Therapy[],
  evidence: Evidence[],
): GenomicReport['therapeuticImplications'] {
  const fdaApproved: GenomicReport['therapeuticImplications']['fdaApproved'] = [];
  const nccnRecommended: GenomicReport['therapeuticImplications']['nccnRecommended'] = [];
  const clinicalTrials: GenomicReport['therapeuticImplications']['clinicalTrials'] = [];

  // From therapies
  for (const t of therapies) {
    const entry = {
      drug: t.drug,
      biomarker: t.biomarker || 'N/A',
      indication: t.tumorType || 'See label',
      evidenceLevel: t.level || 'N/A',
    };
    const level = (t.level || '').toUpperCase();
    if (level.includes('1') || level.includes('FDA') || level.includes('A')) {
      fdaApproved.push(entry);
    } else if (level.includes('2') || level.includes('NCCN') || level.includes('B')) {
      nccnRecommended.push(entry);
    }
  }

  // From evidence drug associations
  for (const e of evidence) {
    if (!e.drugAssociations?.length) continue;
    for (const drug of e.drugAssociations) {
      const entry = {
        drug,
        biomarker: e.description?.split(' ').slice(0, 3).join(' ') || 'N/A',
        indication: 'See source',
        evidenceLevel: `${e.source} ${e.level || ''}`.trim(),
      };
      // Avoid duplicates
      if (!fdaApproved.some(f => f.drug === drug) && !nccnRecommended.some(n => n.drug === drug)) {
        nccnRecommended.push(entry);
      }
    }
  }

  return { fdaApproved, nccnRecommended, clinicalTrials };
}

function buildMonitoring(variants: Variant[]): string[] {
  const recs: string[] = [];
  const genes = [...new Set(variants.map(v => v.gene).filter(Boolean))];

  if (genes.some(g => ['EGFR', 'ALK', 'ROS1', 'KRAS', 'BRAF'].includes(g!))) {
    recs.push('Seguimiento con imágenes según guías NCCN para el tipo tumoral.');
  }
  if (genes.some(g => ['TP53', 'BRCA1', 'BRCA2'].includes(g!))) {
    recs.push('Considerar asesoramiento genético para variantes en genes de predisposición.');
  }
  if (variants.some(v => v.oncokbLevel?.startsWith('LEVEL_R'))) {
    recs.push('Monitorizar resistencia: se detectaron variantes asociadas a resistencia terapéutica.');
  }
  recs.push('Re-evaluar perfil molecular en caso de progresión para detectar nuevos mecanismos de resistencia.');
  recs.push('Monitoreo periódico con ctDNA/biopsia líquida si está disponible.');

  return recs;
}

function buildLimitations(context?: { reportSource?: string }): string[] {
  const lims = [
    'Este análisis se limita a las regiones cubiertas por el panel NGS utilizado.',
    'Variantes en regiones no cubiertas, reordenamientos complejos o alteraciones epigenéticas no son detectadas.',
    'Las clasificaciones de tiering se basan en la evidencia disponible al momento del análisis y pueden cambiar.',
    'Los resultados deben ser interpretados en el contexto clínico del paciente por un profesional calificado.',
  ];
  if (context?.reportSource === 'PDF') {
    lims.push('Las variantes fueron extraídas de un reporte PDF mediante procesamiento de texto, lo que puede introducir errores de parsing.');
  }
  return lims;
}

function buildMethodology(variants: Variant[], context?: { reportSource?: string }): string {
  const sources = new Set<string>();
  for (const v of variants) {
    if (v.oncokbLevel || v.oncokbData) sources.add('OncoKB');
    if (v.clinvarSignificance || v.clinvarData) sources.add('ClinVar');
    if (v.cosmicId) sources.add('COSMIC');
    if (v.gnomadAF != null) sources.add('gnomAD');
  }
  const sourceList = sources.size > 0 ? Array.from(sources).join(', ') : 'OncoKB, ClinVar';
  return `Análisis de ${variants.length} variantes somáticas detectadas por ${context?.reportSource || 'NGS panel'}. Anotación con ${sourceList}, DGIdb, CIViC y PharmGKB. Clasificación según guías AMP/ASCO/CAP 2017. Resumen ejecutivo generado con asistencia de IA (Claude).`;
}

// ── Claude: executive summary + top variant narratives ────────────────────

const SUMMARY_SYSTEM = `You are a molecular tumor board assistant. Write a concise executive summary in Spanish for a clinical genomic report. Be precise, clinical, and actionable. Respond ONLY with valid JSON.`;

const SummarySchema = z.object({
  executiveSummary: z.string(),
  topVariantNarratives: z.array(z.object({
    gene: z.string(),
    narrative: z.string(),
  })),
});

async function generateExecutiveSummary(
  topVariants: Variant[],
  totalVariants: number,
  therapyCount: number,
  context?: { tumorType?: string },
  model?: string,
): Promise<z.infer<typeof SummarySchema>> {
  const variantSummaries = topVariants.map(v => ({
    gene: v.gene,
    variant: v.hgvs || v.hgvs_p || v.hgvs_c,
    effect: v.effect,
    vaf: v.vaf,
    oncokbLevel: v.oncokbLevel,
    clinvarSignificance: v.clinvarSignificance,
    cosmicId: v.cosmicId,
    cosmicCount: v.cosmicCount,
    gnomadAF: v.gnomadAF,
  }));

  const prompt = `Generate an executive summary for a molecular pathology report.

Tumor type: ${context?.tumorType || 'Not specified'}
Total variants: ${totalVariants}
Therapies found: ${therapyCount}

Top ${topVariants.length} most clinically significant variants:
${JSON.stringify(variantSummaries, null, 2)}

Return JSON with:
- "executiveSummary": 3-4 sentences in Spanish summarizing the key findings, most actionable variants, and overall clinical significance.
- "topVariantNarratives": array of {gene, narrative} for each of the ${topVariants.length} variants above. Each narrative should be 2-3 sentences in Spanish explaining why this variant matters clinically.`;

  return sonnetJson(
    getClaudeModel(model),
    SUMMARY_SYSTEM,
    prompt,
    'ExecutiveSummary',
    SummarySchema,
    { maxTokens: 2000 }
  );
}

// ── Main export ───────────────────────────────────────────────────────────

/**
 * Generate a structured molecular pathology report.
 * Template-based with Claude only for executive summary + top variant narratives.
 * ~90% cheaper and 3-5x faster than full Claude generation.
 */
export async function generateGenomicReport(params: {
  variants: Variant[];
  evidence?: Evidence[];
  therapies?: Therapy[];
  interpretations?: ClinicalInterpretation[];
  context?: {
    tumorType?: string;
    stage?: string;
    sampleType?: string;
    reportSource?: string;
  };
  model?: string;
}): Promise<GenomicReport> {
  const { variants, evidence = [], therapies = [], interpretations, context } = params;

  // 1. Rank variants and pick top 3
  const ranked = rankVariants(variants);
  const topN = Math.min(3, ranked.length);
  const topVariants = ranked.slice(0, topN);

  // 2. Build template sections (instant, no API calls)
  const variantClassifications = buildVariantClassifications(ranked, interpretations);
  const therapeuticImplications = buildTherapeuticImplications(therapies, evidence);
  const monitoringRecommendations = buildMonitoring(variants);
  const limitations = buildLimitations(context);
  const methodology = buildMethodology(variants, context);

  // 3. Claude ONLY for executive summary + top variant narratives (~2000 tokens max)
  const { executiveSummary, topVariantNarratives } = await generateExecutiveSummary(
    topVariants,
    variants.length,
    therapies.length,
    context,
    params.model,
  );

  // 4. Enrich the top variant classifications with Claude narratives
  for (const narrative of topVariantNarratives) {
    const vc = variantClassifications.find(v => v.gene === narrative.gene);
    if (vc) {
      vc.clinicalSignificance = narrative.narrative;
    }
  }

  return {
    executiveSummary,
    variantClassifications,
    therapeuticImplications,
    monitoringRecommendations,
    limitations,
    methodology,
  };
}

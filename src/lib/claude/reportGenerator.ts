import { Variant, Evidence, Therapy } from '@/core/models';
import { sonnetJson } from '@/lib/sonnet';
import { GenomicReportSchema, GenomicReport } from './schemas';
import { ClinicalInterpretation } from './schemas';

import { getClaudeModel } from '@/lib/model';

const SYSTEM_PROMPT = `You are a clinical genomics reporting assistant generating structured molecular pathology reports.

Follow CAP/AMP reporting guidelines. Reports must be:
- Clinically accurate and evidence-based
- Structured for oncologist consumption
- Clear about evidence levels and limitations
- Actionable — prioritize findings that change management

Report structure:
1. Executive summary (2-3 sentences, most important findings first)
2. Variant classifications table with AMP tiers
3. Therapeutic implications organized by evidence level:
   - FDA-approved therapies (with specific indications)
   - NCCN-recommended therapies
   - Clinical trial opportunities
4. Monitoring recommendations
5. Limitations of the analysis
6. Brief methodology note

Use professional clinical language. Do not include patient-identifiable information.
Respond ONLY with valid JSON, no markdown formatting.`;

/**
 * Generate a structured molecular pathology report
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
  const { variants, evidence, therapies, interpretations, context } = params;

  const prompt = `Generate a molecular pathology report for the following case:

${context ? `Clinical Context:
- Tumor type: ${context.tumorType || 'Not specified'}
- Stage: ${context.stage || 'Not specified'}
- Sample type: ${context.sampleType || 'Tumor tissue'}
- Data source: ${context.reportSource || 'NGS panel'}
` : ''}

Variants detected (${variants.length}):
${JSON.stringify(
  variants.map((v) => ({
    gene: v.gene,
    hgvs: v.hgvs || v.hgvs_p || v.hgvs_c,
    effect: v.effect,
    vaf: v.vaf,
    chrom: v.chrom,
    pos: v.pos,
    ref: v.ref,
    alt: v.alt,
    oncokbLevel: v.oncokbLevel,
    clinvarSignificance: v.clinvarSignificance,
  })),
  null,
  2
)}

${
  interpretations && interpretations.length > 0
    ? `\nClinical Interpretations (pre-computed):\n${JSON.stringify(
        interpretations.map((i) => ({
          gene: i.gene,
          variant: i.variant,
          tier: i.tier,
          classification: i.classification,
          actionability: i.actionability,
          therapeuticImplications: i.therapeuticImplications,
        })),
        null,
        2
      )}`
    : ''
}

${
  evidence && evidence.length > 0
    ? `\nEvidence items:\n${JSON.stringify(
        evidence.map((e) => ({
          source: e.source,
          level: e.level,
          description: e.description,
          drugAssociations: e.drugAssociations,
        })),
        null,
        2
      )}`
    : ''
}

${
  therapies && therapies.length > 0
    ? `\nTherapy suggestions:\n${JSON.stringify(
        therapies.map((t) => ({
          drug: t.drug,
          level: t.level,
          biomarker: t.biomarker,
          tumorType: t.tumorType,
        })),
        null,
        2
      )}`
    : ''
}

Generate a comprehensive molecular pathology report following CAP/AMP guidelines.`;

  return sonnetJson<GenomicReport>(
    getClaudeModel(params.model),
    SYSTEM_PROMPT,
    prompt,
    'GenomicReport',
    GenomicReportSchema,
    { maxTokens: 16000 }
  );
}

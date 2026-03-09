import { Variant } from '@/core/models';
import { sonnetJson } from '@/lib/sonnet';
import { ClinicalInterpretationSchema, ClinicalInterpretation } from './schemas';
import { z } from 'zod';

const MODEL = 'claude-sonnet-4-6-20250828';

const SYSTEM_PROMPT = `You are a molecular tumor board assistant specializing in somatic variant interpretation.

You classify variants following:
- AMP/ASCO/CAP 2017 guidelines for somatic variants (Tier I-IV)
- ACMG/AMP 2015 guidelines for germline variants (Pathogenic → Benign)

Tier definitions:
- Tier I: Variants with strong clinical significance (FDA-approved therapy, professional guidelines)
- Tier II: Variants with potential clinical significance (clinical trials, smaller studies, off-label use)
- Tier III: Variants of uncertain clinical significance (no published evidence of cancer association)
- Tier IV: Variants deemed benign or likely benign

For each variant you MUST:
1. Assign an AMP tier with explicit rationale
2. Classify pathogenicity (Pathogenic → Benign)
3. Assess actionability (High/Moderate/Low/None)
4. List therapeutic implications with evidence levels
5. Note relevant clinical trials if applicable
6. State your confidence level and reasoning
7. Cite sources (OncoKB, ClinVar, NCCN, FDA labels, published literature)

Always be precise about uncertainty. Never overstate evidence.
Respond ONLY with valid JSON, no markdown formatting.`;

/**
 * Interpret a single variant using Claude for clinical classification
 */
export async function interpretVariant(
  variant: Variant,
  context?: { tumorType?: string; stage?: string; priorTherapies?: string[] }
): Promise<ClinicalInterpretation> {
  const contextSection = context
    ? `\nClinical context:
  - Tumor type: ${context.tumorType || 'Not specified'}
  - Stage: ${context.stage || 'Not specified'}
  - Prior therapies: ${context.priorTherapies?.join(', ') || 'None reported'}`
    : '';

  const annotationSection = [
    variant.oncokbData
      ? `OncoKB: oncogenic=${variant.oncokbData.oncogenic}, mutationEffect=${variant.oncokbData.mutationEffect || 'N/A'}, sensitiveLevel=${variant.oncokbData.highestSensitiveLevel || 'N/A'}`
      : null,
    variant.clinvarData
      ? `ClinVar: significance=${variant.clinvarData.clinicalSignificance}, reviewStatus=${variant.clinvarData.reviewStatus || 'N/A'}`
      : null,
    variant.clinvarSignificance
      ? `ClinVar significance: ${variant.clinvarSignificance}`
      : null,
    variant.oncokbLevel
      ? `OncoKB level: ${variant.oncokbLevel}`
      : null,
  ]
    .filter(Boolean)
    .join('\n  ');

  const prompt = `Interpret this somatic variant:

Gene: ${variant.gene || 'Unknown'}
Chromosome: ${variant.chrom || 'Unknown'} Position: ${variant.pos || 'Unknown'}
Ref: ${variant.ref || 'N/A'} → Alt: ${variant.alt || 'N/A'}
HGVS: ${variant.hgvs || variant.hgvs_c || variant.hgvs_p || 'N/A'}
Effect: ${variant.effect || 'Unknown'}
VAF: ${variant.vaf !== undefined ? (variant.vaf * 100).toFixed(1) + '%' : 'N/A'}
${annotationSection ? `\nExisting annotations:\n  ${annotationSection}` : ''}
${contextSection}

Provide AMP/ASCO/CAP tier classification, actionability assessment, therapeutic implications with evidence levels, and relevant clinical trials.`;

  return sonnetJson<ClinicalInterpretation>(
    MODEL,
    SYSTEM_PROMPT,
    prompt,
    'ClinicalInterpretation',
    ClinicalInterpretationSchema
  );
}

/**
 * Interpret multiple variants in batch
 */
export async function interpretVariants(
  variants: Variant[],
  context?: { tumorType?: string; stage?: string; priorTherapies?: string[] }
): Promise<ClinicalInterpretation[]> {
  const results = await Promise.allSettled(
    variants.map((v) => interpretVariant(v, context))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<ClinicalInterpretation> =>
        r.status === 'fulfilled'
    )
    .map((r) => r.value);
}

import { Variant } from '@/core/models';
import { sonnetJson } from '@/lib/sonnet';
import { ClinicalInterpretationSchema, ClinicalInterpretation } from './schemas';
import { z } from 'zod';
import { getClaudeModel } from '@/lib/model';

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
Respond ONLY with valid JSON array, no markdown formatting.`;

/**
 * Interpret ALL variants in a single Claude call (batch).
 * Much faster than one call per variant.
 */
export async function interpretVariants(
  variants: Variant[],
  context?: { tumorType?: string; stage?: string; priorTherapies?: string[] },
  model?: string
): Promise<ClinicalInterpretation[]> {
  if (variants.length === 0) return [];

  const contextSection = context
    ? `\nClinical context:
  - Tumor type: ${context.tumorType || 'Not specified'}
  - Stage: ${context.stage || 'Not specified'}
  - Prior therapies: ${context.priorTherapies?.join(', ') || 'None reported'}`
    : '';

  const variantDescriptions = variants.map((v, i) => {
    const annotations = [
      v.oncokbData
        ? `OncoKB: oncogenic=${v.oncokbData.oncogenic}, mutationEffect=${v.oncokbData.mutationEffect || 'N/A'}, sensitiveLevel=${v.oncokbData.highestSensitiveLevel || 'N/A'}`
        : null,
      v.oncokbLevel ? `OncoKB level: ${v.oncokbLevel}` : null,
      v.clinvarData
        ? `ClinVar: significance=${v.clinvarData.clinicalSignificance}, reviewStatus=${v.clinvarData.reviewStatus || 'N/A'}`
        : null,
      v.clinvarSignificance ? `ClinVar significance: ${v.clinvarSignificance}` : null,
      v.gnomadAF != null ? `gnomAD AF: ${(v.gnomadAF * 100).toFixed(3)}%` : null,
      v.cosmicId ? `COSMIC: ${v.cosmicId}` : null,
    ].filter(Boolean).join('; ');

    return `[Variant ${i + 1}]
Gene: ${v.gene || 'Unknown'}
HGVS: ${v.hgvs || v.hgvs_p || v.hgvs_c || 'N/A'}
Chr${v.chrom || '?'}:${v.pos || '?'} ${v.ref || '?'}>${v.alt || '?'}
Effect: ${v.effect || 'Unknown'}
VAF: ${v.vaf !== undefined ? (v.vaf * 100).toFixed(1) + '%' : 'N/A'}
${annotations ? `Annotations: ${annotations}` : ''}`;
  }).join('\n\n');

  const prompt = `Interpret ALL ${variants.length} somatic variants below and return a JSON array with one interpretation object per variant, in the same order.
${contextSection}

${variantDescriptions}

Return a JSON array of ${variants.length} interpretation objects. Each must have: gene, variant, tier, tierRationale, classification, actionability, therapeuticImplications, confidence, reasoning, sources. Optional: clinicalTrials, prognosticImplications, diagnosticImplications.`;

  return sonnetJson<ClinicalInterpretation[]>(
    getClaudeModel(model),
    SYSTEM_PROMPT,
    prompt,
    'ClinicalInterpretations',
    z.array(ClinicalInterpretationSchema),
    { maxTokens: 16000 }
  );
}

/**
 * Interpret a single variant (convenience wrapper)
 */
export async function interpretVariant(
  variant: Variant,
  context?: { tumorType?: string; stage?: string; priorTherapies?: string[] },
  model?: string
): Promise<ClinicalInterpretation> {
  const results = await interpretVariants([variant], context, model);
  if (results.length === 0) {
    throw new Error('No interpretation returned');
  }
  return results[0];
}

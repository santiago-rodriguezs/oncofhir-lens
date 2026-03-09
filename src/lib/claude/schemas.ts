import { z } from 'zod';

// ── Variant Interpretation (Layer 1: AMP/ASCO/CAP Classification) ──

export const ClinicalInterpretationSchema = z.object({
  gene: z.string(),
  variant: z.string(),
  tier: z.enum(['Tier I', 'Tier II', 'Tier III', 'Tier IV']),
  tierRationale: z.string(),
  classification: z.enum([
    'Pathogenic',
    'Likely Pathogenic',
    'Uncertain Significance',
    'Likely Benign',
    'Benign',
  ]),
  actionability: z.enum(['High', 'Moderate', 'Low', 'None']),
  therapeuticImplications: z.array(
    z.object({
      drug: z.string(),
      evidenceLevel: z.string(),
      approvalContext: z.string(),
      tumorTypes: z.array(z.string()),
    })
  ),
  clinicalTrials: z.array(
    z.object({
      description: z.string(),
      phase: z.string().optional(),
      eligibilityCriteria: z.string().optional(),
    })
  ).optional(),
  prognosticImplications: z.string().optional(),
  diagnosticImplications: z.string().optional(),
  confidence: z.enum(['High', 'Moderate', 'Low']),
  reasoning: z.string(),
  sources: z.array(z.string()),
});

export type ClinicalInterpretation = z.infer<typeof ClinicalInterpretationSchema>;

// ── Genomic Report (Layer 2: Molecular Pathology Report) ──

export const GenomicReportSchema = z.object({
  executiveSummary: z.string(),
  variantClassifications: z.array(
    z.object({
      gene: z.string(),
      variant: z.string(),
      tier: z.string(),
      classification: z.string(),
      clinicalSignificance: z.string(),
    })
  ),
  therapeuticImplications: z.object({
    fdaApproved: z.array(
      z.object({
        drug: z.string(),
        biomarker: z.string(),
        indication: z.string(),
        evidenceLevel: z.string(),
      })
    ),
    nccnRecommended: z.array(
      z.object({
        drug: z.string(),
        biomarker: z.string(),
        indication: z.string(),
        evidenceLevel: z.string(),
      })
    ),
    clinicalTrials: z.array(
      z.object({
        description: z.string(),
        biomarker: z.string(),
        phase: z.string().optional(),
      })
    ),
  }),
  monitoringRecommendations: z.array(z.string()),
  limitations: z.array(z.string()),
  methodology: z.string(),
});

export type GenomicReport = z.infer<typeof GenomicReportSchema>;

// ── Tumor Board Chat (Layer 3) ──

export const TumorBoardMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export type TumorBoardMessage = z.infer<typeof TumorBoardMessageSchema>;

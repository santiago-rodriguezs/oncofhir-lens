import { z } from 'zod';

// Base models for domain entities
export const CaseMetadata = z.object({
  patientId: z.string().optional(),
  sampleId: z.string().optional(),
  tumorType: z.string().optional(),
  reportSource: z.enum(['PDF', 'VCF']),
  parsingConfidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
});

export const Variant = z.object({
  gene: z.string().optional(),
  chrom: z.string().optional(),
  pos: z.number().optional(),
  ref: z.string().optional(),
  alt: z.string().optional(),
  hgvs: z.string().optional(),
  hgvs_c: z.string().optional(),
  hgvs_p: z.string().optional(),
  effect: z.string().optional(),
  vaf: z.number().optional(),
  depth: z.number().optional(),
  zygosity: z.string().optional(),
  clinvarId: z.string().optional(),
  oncokbLevel: z.string().optional(),
  actionability: z.string().optional(),
  evidenceLinks: z.array(z.string()).optional(),
  type: z.enum(['SNV', 'INDEL', 'CNV', 'SV']).optional(),
});

export const Evidence = z.object({
  evidenceId: z.string(),
  source: z.enum(['OncoKB', 'ClinVar', 'Other']),
  level: z.string(),
  description: z.string(),
  tumorContext: z.string().optional(),
  drugAssociations: z.array(z.string()),
  citations: z.array(z.string()),
  timestamp: z.string().datetime(),
});

export const Therapy = z.object({
  drug: z.string(),
  combination: z.array(z.string()).optional(),
  level: z.string(),
  biomarker: z.string(),
  tumorType: z.string(),
  approvalStatus: z.object({
    US: z.boolean(),
    EU: z.boolean(),
    AR: z.boolean(),
  }).optional(),
  evidenceId: z.string(),
});

export const QualityControl = z.object({
  source: z.enum(['PDF', 'VCF']),
  metrics: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  flags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

// Type exports
export type CaseMetadata = z.infer<typeof CaseMetadata>;
export type Variant = z.infer<typeof Variant>;
export type Evidence = z.infer<typeof Evidence>;
export type Therapy = z.infer<typeof Therapy>;
export type QualityControl = z.infer<typeof QualityControl>;

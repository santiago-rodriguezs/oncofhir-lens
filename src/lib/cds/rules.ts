import { Variant } from '@/types/fhir';

/**
 * Simple rule-based system for generating therapy suggestions
 * Used as a fallback when Gemini API is not available
 */

// Define rule types
export interface TherapyRule {
  gene: string;
  variant?: string;
  consequence?: string;
  title: string;
  rationale: string;
  suggestions: string[];
  evidenceUrls: string[];
  severity: 'high' | 'moderate' | 'low';
}

// Define rules for common actionable variants
export const THERAPY_RULES: TherapyRule[] = [
  {
    gene: 'EGFR',
    variant: 'L858R',
    title: 'EGFR L858R - Targetable Driver Mutation',
    rationale: 'EGFR L858R is a well-established driver mutation in non-small cell lung cancer that predicts response to EGFR tyrosine kinase inhibitors.',
    suggestions: ['Osimertinib', 'Gefitinib', 'Erlotinib', 'Afatinib'],
    evidenceUrls: [
      'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1450',
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6933030/'
    ],
    severity: 'high'
  },
  {
    gene: 'EGFR',
    variant: 'exon19del',
    title: 'EGFR Exon 19 Deletion - Targetable Driver Mutation',
    rationale: 'EGFR exon 19 deletions are well-established driver mutations in non-small cell lung cancer that predict response to EGFR tyrosine kinase inhibitors.',
    suggestions: ['Osimertinib', 'Gefitinib', 'Erlotinib', 'Afatinib'],
    evidenceUrls: [
      'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1450',
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6933030/'
    ],
    severity: 'high'
  },
  {
    gene: 'EGFR',
    variant: 'T790M',
    title: 'EGFR T790M - Resistance Mutation',
    rationale: 'EGFR T790M is a common resistance mechanism to first/second-generation EGFR TKIs. Third-generation inhibitors like osimertinib are effective against this mutation.',
    suggestions: ['Osimertinib'],
    evidenceUrls: [
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5461364/'
    ],
    severity: 'high'
  },
  {
    gene: 'BRAF',
    variant: 'V600E',
    title: 'BRAF V600E - Targetable Driver Mutation',
    rationale: 'BRAF V600E mutation is a well-established driver in melanoma and other cancers, predicting response to BRAF inhibitors.',
    suggestions: ['Vemurafenib', 'Dabrafenib', 'Dabrafenib + Trametinib'],
    evidenceUrls: [
      'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1461',
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5010093/'
    ],
    severity: 'high'
  },
  {
    gene: 'ALK',
    title: 'ALK Fusion - Targetable Driver Mutation',
    rationale: 'ALK gene fusions are established drivers in a subset of non-small cell lung cancers and predict response to ALK inhibitors.',
    suggestions: ['Alectinib', 'Lorlatinib', 'Brigatinib', 'Crizotinib'],
    evidenceUrls: [
      'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1450',
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6932758/'
    ],
    severity: 'high'
  },
  {
    gene: 'KRAS',
    variant: 'G12C',
    title: 'KRAS G12C - Newly Targetable Mutation',
    rationale: 'KRAS G12C is now targetable with specific inhibitors in non-small cell lung cancer and other tumors.',
    suggestions: ['Sotorasib', 'Adagrasib', 'Clinical trial enrollment'],
    evidenceUrls: [
      'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-grants-accelerated-approval-sotorasib-kras-g12c-mutated-nsclc',
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8118268/'
    ],
    severity: 'high'
  },
  {
    gene: 'BRCA1',
    consequence: 'frameshift',
    title: 'BRCA1 Loss-of-Function - PARP Inhibitor Sensitivity',
    rationale: 'Loss-of-function mutations in BRCA1 predict sensitivity to PARP inhibitors in ovarian, breast, pancreatic, and prostate cancers.',
    suggestions: ['Olaparib', 'Niraparib', 'Rucaparib', 'Talazoparib'],
    evidenceUrls: [
      'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1453',
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6355451/'
    ],
    severity: 'moderate'
  },
  {
    gene: 'BRCA2',
    consequence: 'frameshift',
    title: 'BRCA2 Loss-of-Function - PARP Inhibitor Sensitivity',
    rationale: 'Loss-of-function mutations in BRCA2 predict sensitivity to PARP inhibitors in ovarian, breast, pancreatic, and prostate cancers.',
    suggestions: ['Olaparib', 'Niraparib', 'Rucaparib', 'Talazoparib'],
    evidenceUrls: [
      'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1453',
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6355451/'
    ],
    severity: 'moderate'
  },
  {
    gene: 'BRCA1',
    consequence: 'nonsense',
    title: 'BRCA1 Loss-of-Function - PARP Inhibitor Sensitivity',
    rationale: 'Loss-of-function mutations in BRCA1 predict sensitivity to PARP inhibitors in ovarian, breast, pancreatic, and prostate cancers.',
    suggestions: ['Olaparib', 'Niraparib', 'Rucaparib', 'Talazoparib'],
    evidenceUrls: [
      'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1453',
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6355451/'
    ],
    severity: 'moderate'
  },
  {
    gene: 'BRCA2',
    consequence: 'nonsense',
    title: 'BRCA2 Loss-of-Function - PARP Inhibitor Sensitivity',
    rationale: 'Loss-of-function mutations in BRCA2 predict sensitivity to PARP inhibitors in ovarian, breast, pancreatic, and prostate cancers.',
    suggestions: ['Olaparib', 'Niraparib', 'Rucaparib', 'Talazoparib'],
    evidenceUrls: [
      'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1453',
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6355451/'
    ],
    severity: 'moderate'
  },
  {
    gene: 'MLH1',
    consequence: 'frameshift',
    title: 'Mismatch Repair Deficiency - Immunotherapy Response',
    rationale: 'Loss of mismatch repair proteins suggests microsatellite instability (MSI-High) status, which predicts response to immune checkpoint inhibitors.',
    suggestions: ['Pembrolizumab', 'Nivolumab', 'Nivolumab + Ipilimumab'],
    evidenceUrls: [
      'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-grants-accelerated-approval-pembrolizumab-first-tissue-site-agnostic-indication',
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5953546/'
    ],
    severity: 'moderate'
  }
];

/**
 * Apply simple rules to generate therapy suggestions
 * @param variants - List of genomic variants
 * @param patientId - Patient ID for reference
 * @returns Array of detected issues with therapy suggestions
 */
export function applySimpleRules(variants: Variant[], patientId: string) {
  const detectedIssues = [];
  
  // Check each variant against rules
  for (const variant of variants) {
    for (const rule of THERAPY_RULES) {
      // Check if variant matches rule criteria
      const geneMatch = variant.gene === rule.gene;
      const variantMatch = !rule.variant || variant.hgvs.includes(rule.variant);
      const consequenceMatch = !rule.consequence || variant.consequence.includes(rule.consequence);
      
      if (geneMatch && variantMatch && consequenceMatch) {
        detectedIssues.push({
          title: rule.title,
          detail: rule.title,
          severity: rule.severity,
          evidence: rule.rationale,
          suggestions: rule.suggestions,
          evidenceRefs: rule.evidenceUrls
        });
        
        // Break after first matching rule for this variant
        break;
      }
    }
  }
  
  // Add generic high TMB suggestion if many variants
  if (variants.length > 20) {
    detectedIssues.push({
      title: 'Potential High Tumor Mutation Burden - Consider Immunotherapy',
      detail: 'Potential High Tumor Mutation Burden - Consider Immunotherapy',
      severity: 'low' as const,
      evidence: 'The high number of mutations detected suggests elevated tumor mutation burden, which may predict response to immune checkpoint inhibitors.',
      suggestions: ['Pembrolizumab', 'Nivolumab', 'TMB testing confirmation'],
      evidenceRefs: [
        'https://www.fda.gov/drugs/drug-approvals-and-databases/fda-approves-pembrolizumab-adults-and-children-tmb-h-solid-tumors',
        'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6133188/'
      ]
    });
  }
  
  return detectedIssues;
}

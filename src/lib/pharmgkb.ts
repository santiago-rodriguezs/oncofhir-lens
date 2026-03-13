/**
 * PharmGKB (Pharmacogenomics Knowledge Base) REST client
 * https://api.pharmgkb.org
 *
 * Free, no auth, CC BY-SA 4.0. Rate limit: ~2 req/s.
 */

const PHARMGKB_API = 'https://api.pharmgkb.org/v1';

export interface PharmGKBClinicalAnnotation {
  gene: string;
  level: string; // 1A, 1B, 2A, 2B, 3, 4
  phenotypeCategory: string; // Efficacy, Toxicity/ADR, Dosage, PK, Other
  drugs: string[];
  phenotypes: string[];
  summary: string;
}

export interface PharmGKBDrugLabel {
  gene: string;
  drug: string;
  source: string; // FDA, EMA, HCSC, PMDA
  testingLevel: string; // Required, Recommended, Actionable, Informative
}

export interface PharmGKBResult {
  gene: string;
  clinicalAnnotations: PharmGKBClinicalAnnotation[];
  drugLabels: PharmGKBDrugLabel[];
}

async function pharmgkbFetch(endpoint: string): Promise<any> {
  const res = await fetch(`${PHARMGKB_API}${endpoint}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`PharmGKB API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch clinical annotations for a gene.
 * Returns pharmacogenomic clinical annotations with evidence levels.
 */
async function fetchGeneAnnotations(gene: string): Promise<PharmGKBClinicalAnnotation[]> {
  try {
    const data = await pharmgkbFetch(
      `/data/clinicalAnnotation?location.genes.symbol=${encodeURIComponent(gene)}`
    );

    const annotations: PharmGKBClinicalAnnotation[] = [];
    const items = data?.data || [];

    for (const item of items) {
      const level = item.evidenceLevel || item.level || '';
      // Only include high-evidence annotations (1A, 1B, 2A, 2B)
      if (!['1A', '1B', '2A', '2B'].includes(level)) continue;

      const drugs = (item.relatedChemicals || []).map((c: any) => c.name).filter(Boolean);
      const phenotypes = (item.phenotypes || []).map((p: any) => p.name || p).filter(Boolean);
      const phenotypeCategory = item.phenotypeCategory || 'Other';

      annotations.push({
        gene,
        level,
        phenotypeCategory,
        drugs,
        phenotypes,
        summary: item.summary || `${gene}: ${phenotypeCategory} - ${drugs.join(', ')}`,
      });
    }

    return annotations;
  } catch (err) {
    console.warn(`[PharmGKB] Failed to fetch annotations for ${gene}: ${err}`);
    return [];
  }
}

/**
 * Fetch FDA/EMA drug labels for a gene.
 */
async function fetchDrugLabels(gene: string): Promise<PharmGKBDrugLabel[]> {
  try {
    const data = await pharmgkbFetch(
      `/data/drugLabel?relatedGenes.symbol=${encodeURIComponent(gene)}`
    );

    const labels: PharmGKBDrugLabel[] = [];
    const items = data?.data || [];

    for (const item of items) {
      const drugs = (item.relatedChemicals || []).map((c: any) => c.name).filter(Boolean);
      const source = item.source || 'Unknown';
      const testingLevel = item.testingLevel || 'Informative';

      for (const drug of drugs) {
        labels.push({
          gene,
          drug,
          source,
          testingLevel,
        });
      }
    }

    return labels;
  } catch (err) {
    console.warn(`[PharmGKB] Failed to fetch drug labels for ${gene}: ${err}`);
    return [];
  }
}

/**
 * Fetch PharmGKB annotations for a list of variants.
 * Queries by unique genes found in the variant list.
 */
export async function fetchPharmGKB(
  variants: Array<{ gene?: string }>
): Promise<PharmGKBResult[]> {
  const genes = [...new Set(variants.map((v) => v.gene).filter(Boolean))] as string[];

  if (genes.length === 0) return [];

  console.log(`[PharmGKB] Querying ${genes.length} unique genes`);

  const results: PharmGKBResult[] = [];

  for (let i = 0; i < genes.length; i++) {
    const gene = genes[i];

    // Fetch annotations and labels in parallel for each gene
    const [clinicalAnnotations, drugLabels] = await Promise.all([
      fetchGeneAnnotations(gene),
      fetchDrugLabels(gene),
    ]);

    if (clinicalAnnotations.length > 0 || drugLabels.length > 0) {
      results.push({ gene, clinicalAnnotations, drugLabels });
    }

    // Rate limit: ~2 req/s (we make 2 calls per gene, so wait 1s between genes)
    if (i < genes.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`[PharmGKB] Found results for ${results.length} genes`);
  return results;
}

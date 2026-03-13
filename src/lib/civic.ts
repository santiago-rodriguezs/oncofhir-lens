/**
 * CIViC (Clinical Interpretation of Variants in Cancer) GraphQL client
 * https://civicdb.org/api/graphql
 *
 * Free, no auth, CC0 license. Rate limit: 3 req/s.
 */

const CIVIC_API = 'https://civicdb.org/api/graphql';

export interface CIViCResult {
  gene: string;
  variantName: string;
  civicId: number;
  evidenceCount: number;
  diseases: string[];
  therapies: string[];
  evidenceItems: CIViCEvidence[];
}

export interface CIViCEvidence {
  evidenceLevel: string; // A, B, C, D, E
  evidenceType: string;  // PREDICTIVE, DIAGNOSTIC, PROGNOSTIC, ONCOGENIC
  significance: string;  // SENSITIVITYRESPONSE, RESISTANCE, etc.
  disease: string;
  therapies: string[];
  source: string;
}

const BROWSE_QUERY = `
query CIViCBrowse($gene: String!, $variant: String!) {
  browseVariants(featureName: $gene, variantName: $variant, first: 3) {
    edges {
      node {
        id
        name
        featureName
        evidenceItemCount
        diseases { name }
        therapies { name }
      }
    }
  }
}`;

const DETAIL_QUERY = `
query CIViCDetail($id: Int!) {
  variant(id: $id) {
    id
    name
    feature { name }
    singleVariantMolecularProfile {
      evidenceItems(first: 20, status: ACCEPTED) {
        edges {
          node {
            evidenceLevel
            evidenceType
            significance
            disease { name }
            therapies { name }
            source { citation citationId }
          }
        }
      }
    }
  }
}`;

/**
 * Extract variant name from HGVS protein notation.
 * e.g. "p.V600E" → "V600E", "p.L858R" → "L858R"
 */
function hgvsToVariantName(hgvs_p?: string): string | null {
  if (!hgvs_p) return null;
  // Remove "p." prefix and any parentheses
  const cleaned = hgvs_p.replace(/^p\./, '').replace(/[()]/g, '');
  if (!cleaned || cleaned.length < 3) return null;
  return cleaned;
}

async function civicGraphQL(query: string, variables: Record<string, any>): Promise<any> {
  const res = await fetch(CIVIC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`CIViC API error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`CIViC GraphQL error: ${json.errors[0]?.message}`);
  }
  return json.data;
}

/**
 * Query CIViC for a single gene + variant combination.
 * Returns null if no match found.
 */
async function queryCIViCVariant(gene: string, variantName: string): Promise<CIViCResult | null> {
  try {
    // Step 1: Browse to find variant ID
    const browseData = await civicGraphQL(BROWSE_QUERY, { gene, variant: variantName });
    const edges = browseData?.browseVariants?.edges || [];

    // Find exact match
    const match = edges.find(
      (e: any) => e.node.featureName === gene && e.node.name === variantName
    ) || edges[0];

    if (!match) return null;

    const node = match.node;
    const civicId = node.id;

    // Step 2: Get detailed evidence
    const detailData = await civicGraphQL(DETAIL_QUERY, { id: civicId });
    const evidenceEdges = detailData?.variant?.singleVariantMolecularProfile?.evidenceItems?.edges || [];

    const evidenceItems: CIViCEvidence[] = evidenceEdges.map((e: any) => ({
      evidenceLevel: e.node.evidenceLevel || '',
      evidenceType: e.node.evidenceType || '',
      significance: e.node.significance || '',
      disease: e.node.disease?.name || '',
      therapies: (e.node.therapies || []).map((t: any) => t.name),
      source: e.node.source?.citation || '',
    }));

    return {
      gene,
      variantName,
      civicId,
      evidenceCount: node.evidenceItemCount || evidenceItems.length,
      diseases: (node.diseases || []).map((d: any) => d.name),
      therapies: (node.therapies || []).map((t: any) => t.name),
      evidenceItems,
    };
  } catch (err) {
    console.warn(`[CIViC] Failed for ${gene} ${variantName}: ${err}`);
    return null;
  }
}

/**
 * Fetch CIViC annotations for a list of variants.
 * Extracts variant name from hgvs_p and queries CIViC.
 */
export async function fetchCIViC(
  variants: Array<{ gene?: string; hgvs_p?: string; hgvs_c?: string }>
): Promise<CIViCResult[]> {
  const results: CIViCResult[] = [];
  const seen = new Set<string>();

  // Build unique gene+variant pairs
  const queries: Array<{ gene: string; variantName: string }> = [];
  for (const v of variants) {
    if (!v.gene) continue;
    const variantName = hgvsToVariantName(v.hgvs_p);
    if (!variantName) continue;
    const key = `${v.gene}:${variantName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    queries.push({ gene: v.gene, variantName });
  }

  if (queries.length === 0) return [];

  console.log(`[CIViC] Querying ${queries.length} unique gene:variant pairs`);

  // Query in batches of 3 (rate limit: 3 req/s, but 2 calls per variant)
  for (let i = 0; i < queries.length; i++) {
    const { gene, variantName } = queries[i];
    const result = await queryCIViCVariant(gene, variantName);
    if (result) {
      results.push(result);
    }
    // Small delay to respect rate limit (2 graphql calls per variant → ~1.5 req/s)
    if (i < queries.length - 1) {
      await new Promise((r) => setTimeout(r, 700));
    }
  }

  console.log(`[CIViC] Found ${results.length} matches`);
  return results;
}

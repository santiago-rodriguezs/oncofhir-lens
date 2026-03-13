/**
 * gnomAD (Genome Aggregation Database) GraphQL client
 * https://gnomad.broadinstitute.org/api
 *
 * Free, no auth. Rate limit: ~10 req/min (strict).
 * Provides population allele frequencies to filter common polymorphisms.
 */

const GNOMAD_API = 'https://gnomad.broadinstitute.org/api';

export interface GnomADResult {
  gene?: string;
  variantId: string; // chrom-pos-ref-alt
  alleleFrequency: number | null; // global AF
  alleleFrequencyExome: number | null;
  alleleFrequencyGenome: number | null;
  populations: GnomADPopulation[];
  isCommonPolymorphism: boolean; // AF > 1%
}

export interface GnomADPopulation {
  id: string; // AFR, AMR, EAS, NFE, SAS, etc.
  af: number;
  ac: number;
  an: number;
}

const VARIANT_QUERY = `
query GnomADVariant($variantId: String!, $dataset: DatasetId!) {
  variant(variantId: $variantId, dataset: $dataset) {
    variant_id
    exome {
      af
      ac
      an
      populations {
        id
        ac
        an
      }
    }
    genome {
      af
      ac
      an
      populations {
        id
        ac
        an
      }
    }
  }
}`;

/**
 * Normalize chromosome name for gnomAD (strip "chr" prefix).
 */
function normalizeChrom(chrom: string): string {
  return chrom.replace(/^chr/i, '');
}

/**
 * Build gnomAD variant ID from genomic coordinates.
 * Format: "chrom-pos-ref-alt" (e.g., "7-140753336-A-T")
 */
function buildVariantId(chrom: string, pos: number, ref: string, alt: string): string {
  return `${normalizeChrom(chrom)}-${pos}-${ref}-${alt}`;
}

async function gnomadGraphQL(query: string, variables: Record<string, any>): Promise<any> {
  const res = await fetch(GNOMAD_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`gnomAD API error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    // gnomAD returns errors for variants not found — this is expected
    const msg = json.errors[0]?.message || '';
    if (msg.includes('not found') || msg.includes('Unable to find')) {
      return { variant: null };
    }
    throw new Error(`gnomAD GraphQL error: ${msg}`);
  }
  return json.data;
}

/**
 * Query gnomAD for a single variant.
 */
async function queryGnomADVariant(
  chrom: string,
  pos: number,
  ref: string,
  alt: string,
  gene?: string,
): Promise<GnomADResult | null> {
  const variantId = buildVariantId(chrom, pos, ref, alt);

  try {
    const data = await gnomadGraphQL(VARIANT_QUERY, {
      variantId,
      dataset: 'gnomad_r4',
    });

    const v = data?.variant;
    if (!v) return null;

    const exomeAf = v.exome?.af ?? null;
    const genomeAf = v.genome?.af ?? null;
    // Use whichever is available, prefer exome (larger sample)
    const globalAf = exomeAf ?? genomeAf;

    // Extract populations from exome (larger sample size)
    const rawPops = v.exome?.populations || v.genome?.populations || [];
    const populations: GnomADPopulation[] = rawPops
      .filter((p: any) => p.an > 0)
      .map((p: any) => ({
        id: p.id,
        af: p.an > 0 ? p.ac / p.an : 0,
        ac: p.ac,
        an: p.an,
      }));

    return {
      gene,
      variantId,
      alleleFrequency: globalAf,
      alleleFrequencyExome: exomeAf,
      alleleFrequencyGenome: genomeAf,
      populations,
      isCommonPolymorphism: globalAf != null && globalAf > 0.01,
    };
  } catch (err) {
    console.warn(`[gnomAD] Failed for ${variantId}: ${err}`);
    return null;
  }
}

/**
 * Fetch gnomAD annotations for a list of variants.
 * Runs sequentially with 6s delay between queries to respect rate limit (10 req/min).
 */
export async function fetchGnomAD(
  variants: Array<{ chrom?: string; pos?: number; ref?: string; alt?: string; gene?: string }>
): Promise<GnomADResult[]> {
  // Filter variants with complete genomic coordinates
  const queryable = variants.filter(
    (v) => v.chrom && v.pos && v.ref && v.alt
  );

  if (queryable.length === 0) return [];

  // Deduplicate by variant ID
  const seen = new Set<string>();
  const unique: typeof queryable = [];
  for (const v of queryable) {
    const id = buildVariantId(v.chrom!, v.pos!, v.ref!, v.alt!);
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(v);
    }
  }

  console.log(`[gnomAD] Querying ${unique.length} unique variants (rate limit: ~10 req/min)`);

  const results: GnomADResult[] = [];

  for (let i = 0; i < unique.length; i++) {
    const v = unique[i];
    const result = await queryGnomADVariant(v.chrom!, v.pos!, v.ref!, v.alt!, v.gene);
    if (result) {
      results.push(result);
    }

    // Rate limit: 10 req/min → 1 req every 6 seconds
    if (i < unique.length - 1) {
      await new Promise((r) => setTimeout(r, 6000));
    }
  }

  const polymorphisms = results.filter((r) => r.isCommonPolymorphism).length;
  console.log(`[gnomAD] Found ${results.length} results, ${polymorphisms} common polymorphisms`);
  return results;
}

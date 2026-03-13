/**
 * COSMIC data via MyVariant.info REST API
 * https://myvariant.info/v1/
 *
 * Free, no auth. Rate limit: 1000 req/hr.
 * Provides COSMIC mutation frequencies in cancer samples.
 */

const MYVARIANT_API = 'https://myvariant.info/v1';

export interface COSMICResult {
  gene?: string;
  variantId: string; // chrom:g.posRef>Alt (HGVS genomic)
  cosmicId: string | null;
  mutationCount: number | null; // times observed in COSMIC
  tumorSites: string[];
  mutationDescription: string | null;
}

/**
 * Build MyVariant.info HGVS genomic ID from coordinates.
 * Format: "chr7:g.140753336A>T"
 */
function buildHgvsG(chrom: string, pos: number, ref: string, alt: string): string {
  const chr = chrom.startsWith('chr') ? chrom : `chr${chrom}`;

  // SNV
  if (ref.length === 1 && alt.length === 1) {
    return `${chr}:g.${pos}${ref}>${alt}`;
  }
  // Deletion
  if (ref.length > alt.length && alt.length === 1) {
    const delStart = pos + 1;
    const delEnd = pos + ref.length - 1;
    if (delStart === delEnd) {
      return `${chr}:g.${delStart}del`;
    }
    return `${chr}:g.${delStart}_${delEnd}del`;
  }
  // Insertion
  if (alt.length > ref.length && ref.length === 1) {
    const insSeq = alt.slice(1);
    return `${chr}:g.${pos}_${pos + 1}ins${insSeq}`;
  }
  // Complex / MNV — fallback to SNV-like notation
  return `${chr}:g.${pos}${ref}>${alt}`;
}

/**
 * Query MyVariant.info for COSMIC data on a single variant.
 */
async function queryMyVariant(
  chrom: string,
  pos: number,
  ref: string,
  alt: string,
  gene?: string,
): Promise<COSMICResult | null> {
  const hgvsG = buildHgvsG(chrom, pos, ref, alt);

  try {
    const url = `${MYVARIANT_API}/variant/${encodeURIComponent(hgvsG)}?fields=cosmic`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`MyVariant.info API error: ${res.status}`);
    }

    const data = await res.json();
    if (!data.cosmic) return null;

    const cosmic = data.cosmic;

    // COSMIC can be an object or array
    const cosmicEntries = Array.isArray(cosmic) ? cosmic : [cosmic];

    // Aggregate data from all COSMIC entries
    let cosmicId: string | null = null;
    let mutationCount: number | null = null;
    const tumorSites = new Set<string>();
    let mutationDescription: string | null = null;

    for (const entry of cosmicEntries) {
      if (entry.cosmic_id && !cosmicId) {
        cosmicId = entry.cosmic_id;
      }
      if (entry.mut_freq != null) {
        mutationCount = (mutationCount || 0) + entry.mut_freq;
      }
      if (entry.tumor_site) {
        tumorSites.add(entry.tumor_site);
      }
      if (entry.mut_nt && !mutationDescription) {
        mutationDescription = entry.mut_nt;
      }
    }

    return {
      gene,
      variantId: hgvsG,
      cosmicId,
      mutationCount,
      tumorSites: [...tumorSites],
      mutationDescription,
    };
  } catch (err) {
    console.warn(`[COSMIC] Failed for ${hgvsG}: ${err}`);
    return null;
  }
}

/**
 * Fetch COSMIC annotations for a list of variants via MyVariant.info.
 */
export async function fetchCOSMIC(
  variants: Array<{ chrom?: string; pos?: number; ref?: string; alt?: string; gene?: string }>
): Promise<COSMICResult[]> {
  const queryable = variants.filter(
    (v) => v.chrom && v.pos && v.ref && v.alt
  );

  if (queryable.length === 0) return [];

  // Deduplicate
  const seen = new Set<string>();
  const unique: typeof queryable = [];
  for (const v of queryable) {
    const id = buildHgvsG(v.chrom!, v.pos!, v.ref!, v.alt!);
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(v);
    }
  }

  console.log(`[COSMIC] Querying ${unique.length} unique variants via MyVariant.info`);

  const results: COSMICResult[] = [];

  // Can be more aggressive with rate limit (1000/hr ≈ 16/min)
  for (let i = 0; i < unique.length; i++) {
    const v = unique[i];
    const result = await queryMyVariant(v.chrom!, v.pos!, v.ref!, v.alt!, v.gene);
    if (result) {
      results.push(result);
    }

    // Small delay to be respectful (~4 req/s)
    if (i < unique.length - 1) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  console.log(`[COSMIC] Found ${results.length} matches`);
  return results;
}

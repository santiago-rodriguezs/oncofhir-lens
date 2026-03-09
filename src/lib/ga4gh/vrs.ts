/**
 * GA4GH Variant Representation Specification (VRS) v1.3
 *
 * Implements canonical variant representation per:
 * https://vrs.ga4gh.org/en/stable/
 *
 * VRS provides:
 * - Unambiguous, computable variant identification
 * - Globally unique variant IDs via digest-based identifiers
 * - Interoperability across genomic databases
 */

import { Variant } from '@/core/models';
import { createHash } from 'crypto';

// ── VRS types (simplified for somatic variants) ──────────────────────────

export interface VrsAllele {
  type: 'Allele';
  _id?: string;
  location: VrsSequenceLocation;
  state: VrsLiteralSequenceExpression;
}

export interface VrsSequenceLocation {
  type: 'SequenceLocation';
  _id?: string;
  sequence_id: string; // GA4GH SQ digest or refseq accession
  interval: VrsSequenceInterval;
}

export interface VrsSequenceInterval {
  type: 'SequenceInterval';
  start: VrsNumber;
  end: VrsNumber;
}

export interface VrsNumber {
  type: 'Number';
  value: number;
}

export interface VrsLiteralSequenceExpression {
  type: 'LiteralSequenceExpression';
  sequence: string;
}

// ── Chromosome → RefSeq accession mapping (GRCh38) ──────────────────────

const CHROM_TO_REFSEQ: Record<string, string> = {
  '1': 'NC_000001.11', '2': 'NC_000002.12', '3': 'NC_000003.12',
  '4': 'NC_000004.12', '5': 'NC_000005.10', '6': 'NC_000006.12',
  '7': 'NC_000007.14', '8': 'NC_000008.11', '9': 'NC_000009.12',
  '10': 'NC_000010.11', '11': 'NC_000011.10', '12': 'NC_000012.12',
  '13': 'NC_000013.11', '14': 'NC_000014.9', '15': 'NC_000015.10',
  '16': 'NC_000016.10', '17': 'NC_000017.11', '18': 'NC_000018.10',
  '19': 'NC_000019.10', '20': 'NC_000020.11', '21': 'NC_000021.9',
  '22': 'NC_000022.11', 'X': 'NC_000023.11', 'Y': 'NC_000024.10',
  'M': 'NC_012920.1', 'MT': 'NC_012920.1',
};

/**
 * Normalize chromosome to bare form (strip "chr" prefix)
 */
function normalizeChrom(chrom: string): string {
  return chrom.replace(/^chr/i, '');
}

/**
 * Get RefSeq accession for a chromosome
 */
function chromToRefSeq(chrom: string): string {
  const bare = normalizeChrom(chrom);
  return CHROM_TO_REFSEQ[bare] || `unknown:${bare}`;
}

/**
 * Compute a GA4GH-style digest for a serialized object.
 * Uses SHA-512 truncated to 24 bytes, base64url encoded.
 */
function ga4ghDigest(serialized: string): string {
  const hash = createHash('sha512').update(serialized).digest();
  // Truncate to 24 bytes and encode as base64url
  const truncated = hash.subarray(0, 24);
  return truncated
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Build a VRS Allele from a Variant
 *
 * Converts genomic coordinates to VRS inter-residue (0-based) coordinates.
 * VCF uses 1-based, fully-closed coordinates.
 */
export function variantToVrsAllele(variant: Variant): VrsAllele | null {
  if (!variant.chrom || variant.pos === undefined || !variant.ref || !variant.alt) {
    return null;
  }

  const refseq = chromToRefSeq(variant.chrom);
  // Convert VCF 1-based to VRS 0-based inter-residue
  const start = variant.pos - 1;
  const end = start + variant.ref.length;

  const location: VrsSequenceLocation = {
    type: 'SequenceLocation',
    sequence_id: `refseq:${refseq}`,
    interval: {
      type: 'SequenceInterval',
      start: { type: 'Number', value: start },
      end: { type: 'Number', value: end },
    },
  };

  // Compute location digest
  const locationSerialized = JSON.stringify({
    interval: { end: end, start: start, type: 'SequenceInterval' },
    sequence_id: location.sequence_id,
    type: 'SequenceLocation',
  });
  location._id = `ga4gh:VSL.${ga4ghDigest(locationSerialized)}`;

  const state: VrsLiteralSequenceExpression = {
    type: 'LiteralSequenceExpression',
    sequence: variant.alt,
  };

  const allele: VrsAllele = {
    type: 'Allele',
    location,
    state,
  };

  // Compute allele digest
  const alleleSerialized = JSON.stringify({
    location: location._id,
    state: { sequence: variant.alt, type: 'LiteralSequenceExpression' },
    type: 'Allele',
  });
  allele._id = `ga4gh:VA.${ga4ghDigest(alleleSerialized)}`;

  return allele;
}

/**
 * Build VRS representations for an array of variants
 */
export function variantsToVrs(
  variants: Variant[]
): Array<{ variant: Variant; vrs: VrsAllele | null }> {
  return variants.map((variant) => ({
    variant,
    vrs: variantToVrsAllele(variant),
  }));
}

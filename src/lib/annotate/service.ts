import { Variant, Evidence, Therapy } from '@/core/models';
import { VariantInput } from '@/lib/schemas';
import { fetchOncoKB, OncoKBAnnotation } from '@/lib/oncokb';
import { fetchClinVar, ClinVarAnnotation } from '@/lib/clinvar';
import { fetchDGIdb, DGIdbAnnotation } from '@/lib/dgidb';
import { fetchCIViC, CIViCResult } from '@/lib/civic';
import { fetchPharmGKB, PharmGKBResult } from '@/lib/pharmgkb';
import { fetchGnomAD, GnomADResult } from '@/lib/gnomad';
import { fetchCOSMIC, COSMICResult } from '@/lib/cosmic';

/** Convert core Variant to VariantInput for API calls */
function toInput(v: Variant): VariantInput {
  return {
    chrom: v.chrom || '',
    pos: v.pos || 0,
    ref: v.ref || '',
    alt: v.alt || '',
    gene: v.gene,
    vaf: v.vaf,
    hgvs_c: v.hgvs_c,
    hgvs_p: v.hgvs_p,
  };
}

export interface AnnotationResult {
  variants: Variant[];
  evidence: Evidence[];
  therapies: Therapy[];
  errors: { source: string; message: string }[];
  pendingSources?: string[];
}

// ─── Mapping helpers (reusable across fast/slow) ────────────────────────────

function mapOncoKB(
  oncoKBAnnotations: OncoKBAnnotation[],
  variants: Variant[],
  evidence: Evidence[],
  therapies: Therapy[],
) {
  for (let i = 0; i < oncoKBAnnotations.length; i++) {
    const ann = oncoKBAnnotations[i];
    const gene = ann.gene || 'Unknown';

    if (ann.oncogenicity && ann.oncogenicity !== 'Unknown') {
      evidence.push({
        evidenceId: `oncokb-${gene}-${i}`,
        source: 'OncoKB',
        level: ann.evidenceLevel || 'N/A',
        description: ann.variantSummary || ann.geneSummary || `${gene}: ${ann.oncogenicity}`,
        tumorContext: undefined,
        drugAssociations: ann.therapies?.map(t => t.drug) || [],
        citations: [],
        timestamp: new Date().toISOString(),
      });
    }

    if (ann.therapies) {
      for (const therapy of ann.therapies) {
        therapies.push({
          drug: therapy.drug || 'Unknown',
          combination: undefined,
          level: therapy.level || 'N/A',
          biomarker: `${gene} ${variants[i]?.hgvs || variants[i]?.hgvs_p || variants[i]?.hgvs_c || ''}`.trim(),
          tumorType: 'All Solid Tumors',
          approvalStatus: undefined,
          evidenceId: `oncokb-${gene}-${i}`,
        });
      }
    }
  }
}

function mapClinVar(
  clinVarAnnotations: ClinVarAnnotation[],
  evidence: Evidence[],
) {
  for (let i = 0; i < clinVarAnnotations.length; i++) {
    const ann = clinVarAnnotations[i];
    const gene = ann.gene || 'Unknown';

    if (ann.clinicalSignificance && ann.clinicalSignificance !== 'Unknown') {
      evidence.push({
        evidenceId: `clinvar-${gene}-${i}`,
        source: 'ClinVar',
        level: ann.clinicalSignificance,
        description: `ClinVar: ${ann.clinicalSignificance}`,
        tumorContext: undefined,
        drugAssociations: [],
        citations: [],
        timestamp: new Date().toISOString(),
      });
    }
  }
}

function mapDGIdb(
  dgidbAnnotations: DGIdbAnnotation[],
  evidence: Evidence[],
  therapies: Therapy[],
) {
  for (const ann of dgidbAnnotations) {
    const gene = ann.gene || 'Unknown';

    therapies.push({
      drug: ann.drug || 'Unknown',
      combination: undefined,
      level: ann.evidence || 'N/A',
      biomarker: gene,
      tumorType: 'All Solid Tumors',
      approvalStatus: undefined,
      evidenceId: `dgidb-${gene}`,
    });

    evidence.push({
      evidenceId: `dgidb-${gene}-${ann.drug}`,
      source: 'DGIdb',
      level: ann.evidence || 'N/A',
      description: `Interacción droga-gen: ${ann.drug || 'Unknown'} → ${gene}`,
      tumorContext: undefined,
      drugAssociations: [ann.drug || 'Unknown'],
      citations: [],
      timestamp: new Date().toISOString(),
    });
  }
}

function mapCIViC(
  civicAnnotations: CIViCResult[],
  evidence: Evidence[],
  therapies: Therapy[],
) {
  for (const civic of civicAnnotations) {
    const gene = civic.gene;

    for (let j = 0; j < civic.evidenceItems.length; j++) {
      const item = civic.evidenceItems[j];

      evidence.push({
        evidenceId: `civic-${civic.civicId}-${j}`,
        source: 'CIViC',
        level: item.evidenceLevel || 'N/A',
        description: [
          `${item.evidenceType}: ${item.significance}`,
          item.disease ? `(${item.disease})` : '',
          item.therapies.length > 0 ? `→ ${item.therapies.join(' + ')}` : '',
        ].filter(Boolean).join(' '),
        tumorContext: item.disease || undefined,
        drugAssociations: item.therapies,
        citations: item.source ? [item.source] : [],
        timestamp: new Date().toISOString(),
      });

      for (const drug of item.therapies) {
        therapies.push({
          drug,
          combination: undefined,
          level: item.evidenceLevel || 'N/A',
          biomarker: `${gene} ${civic.variantName}`,
          tumorType: item.disease || 'All Solid Tumors',
          approvalStatus: undefined,
          evidenceId: `civic-${civic.civicId}-${j}`,
        });
      }
    }

    if (civic.evidenceItems.length === 0 && civic.therapies.length > 0) {
      evidence.push({
        evidenceId: `civic-${civic.civicId}`,
        source: 'CIViC',
        level: 'N/A',
        description: `CIViC: ${civic.evidenceCount} evidence items for ${gene} ${civic.variantName}`,
        tumorContext: civic.diseases[0] || undefined,
        drugAssociations: civic.therapies,
        citations: [],
        timestamp: new Date().toISOString(),
      });
    }
  }
}

function mapPharmGKB(
  pharmgkbResults: PharmGKBResult[],
  evidence: Evidence[],
  therapies: Therapy[],
) {
  for (const pgx of pharmgkbResults) {
    const gene = pgx.gene;

    for (let j = 0; j < pgx.clinicalAnnotations.length; j++) {
      const ann = pgx.clinicalAnnotations[j];

      evidence.push({
        evidenceId: `pharmgkb-${gene}-${j}`,
        source: 'PharmGKB',
        level: ann.level,
        description: ann.summary || `${ann.phenotypeCategory}: ${ann.drugs.join(', ')}`,
        tumorContext: undefined,
        drugAssociations: ann.drugs,
        citations: [],
        timestamp: new Date().toISOString(),
      });

      for (const drug of ann.drugs) {
        therapies.push({
          drug,
          combination: undefined,
          level: ann.level,
          biomarker: gene,
          tumorType: 'Pharmacogenomics',
          approvalStatus: undefined,
          evidenceId: `pharmgkb-${gene}-${j}`,
        });
      }
    }

    for (let j = 0; j < pgx.drugLabels.length; j++) {
      const label = pgx.drugLabels[j];

      evidence.push({
        evidenceId: `pharmgkb-label-${gene}-${j}`,
        source: 'PharmGKB',
        level: label.testingLevel,
        description: `${label.source} label: ${label.drug} — testing ${label.testingLevel.toLowerCase()} for ${gene}`,
        tumorContext: undefined,
        drugAssociations: [label.drug],
        citations: [],
        timestamp: new Date().toISOString(),
      });
    }
  }
}

function buildHgvsG(chrom: string, pos: number, ref: string, alt: string): string {
  const chr = chrom.startsWith('chr') ? chrom : `chr${chrom}`;
  if (ref.length === 1 && alt.length === 1) return `${chr}:g.${pos}${ref}>${alt}`;
  if (ref.length > alt.length && alt.length === 1) {
    const s = pos + 1, e = pos + ref.length - 1;
    return s === e ? `${chr}:g.${s}del` : `${chr}:g.${s}_${e}del`;
  }
  if (alt.length > ref.length && ref.length === 1) return `${chr}:g.${pos}_${pos + 1}ins${alt.slice(1)}`;
  return `${chr}:g.${pos}${ref}>${alt}`;
}

function enrichVariantsWithGnomadCosmic(
  variants: Variant[],
  gnomadAnnotations: GnomADResult[],
  cosmicAnnotations: COSMICResult[],
  evidence: Evidence[],
): Variant[] {
  const gnomadMap = new Map(gnomadAnnotations.map((r) => [r.variantId, r]));
  const cosmicMap = new Map(cosmicAnnotations.map((r) => [r.variantId, r]));

  const enriched = variants.map((v) => {
    const out = { ...v };
    if (v.chrom && v.pos && v.ref && v.alt) {
      const chrom = v.chrom.replace(/^chr/i, '');
      const gnomad = gnomadMap.get(`${chrom}-${v.pos}-${v.ref}-${v.alt}`);
      if (gnomad) {
        out.gnomadAF = gnomad.alleleFrequency ?? undefined;
        out.isCommonPolymorphism = gnomad.isCommonPolymorphism;
        if (gnomad.populations.length > 0) {
          out.gnomadPopulations = Object.fromEntries(gnomad.populations.map((p) => [p.id, p.af]));
        }
      }

      const cosmic = cosmicMap.get(buildHgvsG(v.chrom, v.pos, v.ref, v.alt));
      if (cosmic) {
        out.cosmicId = cosmic.cosmicId ?? undefined;
        out.cosmicCount = cosmic.mutationCount ?? undefined;
        out.cosmicTumorSites = cosmic.tumorSites.length > 0 ? cosmic.tumorSites : undefined;
      }
    }
    return out;
  });

  // gnomAD polymorphism flags
  for (const gnomad of gnomadAnnotations) {
    if (gnomad.isCommonPolymorphism && gnomad.alleleFrequency != null) {
      evidence.push({
        evidenceId: `gnomad-${gnomad.variantId}`,
        source: 'gnomAD',
        level: 'Population',
        description: `Polimorfismo común: AF global ${(gnomad.alleleFrequency * 100).toFixed(2)}%${
          gnomad.gene ? ` (${gnomad.gene})` : ''
        } — considerar filtrar como variante germinal`,
        tumorContext: undefined,
        drugAssociations: [],
        citations: [],
        timestamp: new Date().toISOString(),
      });
    }
  }

  // COSMIC evidence
  for (const cosmic of cosmicAnnotations) {
    if (cosmic.cosmicId || (cosmic.mutationCount != null && cosmic.mutationCount > 0)) {
      evidence.push({
        evidenceId: `cosmic-${cosmic.cosmicId || cosmic.variantId}`,
        source: 'COSMIC',
        level: cosmic.cosmicId || 'N/A',
        description: [
          cosmic.cosmicId ? `${cosmic.cosmicId}:` : '',
          cosmic.gene || '',
          cosmic.mutationCount != null ? `reportada ${cosmic.mutationCount}× en COSMIC` : 'presente en COSMIC',
          cosmic.tumorSites.length > 0 ? `(${cosmic.tumorSites.slice(0, 3).join(', ')})` : '',
        ].filter(Boolean).join(' '),
        tumorContext: cosmic.tumorSites[0] || undefined,
        drugAssociations: [],
        citations: [],
        timestamp: new Date().toISOString(),
      });
    }
  }

  return enriched;
}

// ─── FAST: OncoKB + ClinVar + DGIdb + COSMIC (~5-10s) ──────────────────────

const SLOW_SOURCES = ['CIViC', 'PharmGKB', 'gnomAD'];

export async function annotateVariantsFast(variants: Variant[]): Promise<AnnotationResult> {
  console.log(`[AnnotateService] FAST annotating ${variants.length} variants (OncoKB, ClinVar, DGIdb, COSMIC)`);

  const evidence: Evidence[] = [];
  const therapies: Therapy[] = [];
  const errors: { source: string; message: string }[] = [];
  const inputs = variants.map(toInput);

  const [oncoKBResult, clinVarResult, dgidbResult, cosmicResult] =
    await Promise.allSettled([
      fetchOncoKB(inputs),
      fetchClinVar(inputs),
      fetchDGIdb(inputs),
      fetchCOSMIC(variants),
    ]);

  // OncoKB
  if (oncoKBResult.status === 'fulfilled') {
    mapOncoKB(oncoKBResult.value, variants, evidence, therapies);
    console.log(`[AnnotateService] OncoKB: ${oncoKBResult.value.length} annotations`);
  } else {
    errors.push({ source: 'OncoKB', message: String(oncoKBResult.reason) });
  }

  // ClinVar
  if (clinVarResult.status === 'fulfilled') {
    mapClinVar(clinVarResult.value, evidence);
    console.log(`[AnnotateService] ClinVar: ${clinVarResult.value.length} annotations`);
  } else {
    errors.push({ source: 'ClinVar', message: String(clinVarResult.reason) });
  }

  // DGIdb
  if (dgidbResult.status === 'fulfilled') {
    mapDGIdb(dgidbResult.value, evidence, therapies);
    console.log(`[AnnotateService] DGIdb: ${dgidbResult.value.length} annotations`);
  } else {
    errors.push({ source: 'DGIdb', message: String(dgidbResult.reason) });
  }

  // COSMIC (fast — MyVariant.info has 1000 req/hr)
  let cosmicAnnotations: COSMICResult[] = [];
  if (cosmicResult.status === 'fulfilled') {
    cosmicAnnotations = cosmicResult.value;
    console.log(`[AnnotateService] COSMIC: ${cosmicAnnotations.length} results`);
  } else {
    errors.push({ source: 'COSMIC', message: String(cosmicResult.reason) });
  }

  // Enrich variants with COSMIC data (gnomAD comes later in slow phase)
  const enrichedVariants = enrichVariantsWithGnomadCosmic(variants, [], cosmicAnnotations, evidence);

  console.log(`[AnnotateService] FAST done: ${evidence.length} evidence, ${therapies.length} therapies`);
  return { variants: enrichedVariants, evidence, therapies, errors, pendingSources: SLOW_SOURCES };
}

// ─── SLOW: CIViC + PharmGKB + gnomAD (rate-limited, 30-90s) ────────────────

export async function annotateVariantsSlow(variants: Variant[]): Promise<AnnotationResult> {
  console.log(`[AnnotateService] SLOW annotating ${variants.length} variants (CIViC, PharmGKB, gnomAD)`);

  const evidence: Evidence[] = [];
  const therapies: Therapy[] = [];
  const errors: { source: string; message: string }[] = [];

  const [civicResult, pharmgkbResult, gnomadResult] =
    await Promise.allSettled([
      fetchCIViC(variants),
      fetchPharmGKB(variants),
      fetchGnomAD(variants),
    ]);

  // CIViC
  if (civicResult.status === 'fulfilled') {
    mapCIViC(civicResult.value, evidence, therapies);
    console.log(`[AnnotateService] CIViC: ${civicResult.value.length} annotations`);
  } else {
    errors.push({ source: 'CIViC', message: String(civicResult.reason) });
  }

  // PharmGKB
  if (pharmgkbResult.status === 'fulfilled') {
    mapPharmGKB(pharmgkbResult.value, evidence, therapies);
    console.log(`[AnnotateService] PharmGKB: ${pharmgkbResult.value.length} genes`);
  } else {
    errors.push({ source: 'PharmGKB', message: String(pharmgkbResult.reason) });
  }

  // gnomAD
  let gnomadAnnotations: GnomADResult[] = [];
  if (gnomadResult.status === 'fulfilled') {
    gnomadAnnotations = gnomadResult.value;
    console.log(`[AnnotateService] gnomAD: ${gnomadAnnotations.length} results`);
  } else {
    errors.push({ source: 'gnomAD', message: String(gnomadResult.reason) });
  }

  // Enrich variants with gnomAD data
  const enrichedVariants = enrichVariantsWithGnomadCosmic(variants, gnomadAnnotations, [], evidence);

  console.log(`[AnnotateService] SLOW done: ${evidence.length} evidence, ${therapies.length} therapies`);
  return { variants: enrichedVariants, evidence, therapies, errors };
}

// ─── LEGACY: all-at-once (kept for backward compat) ─────────────────────────

export async function annotateVariants(variants: Variant[]): Promise<AnnotationResult> {
  const fast = await annotateVariantsFast(variants);
  const slow = await annotateVariantsSlow(variants);

  // Merge slow data into fast variants
  const variantMap = new Map<string, Variant>();
  for (const v of fast.variants) {
    variantMap.set(`${v.chrom}-${v.pos}-${v.ref}-${v.alt}`, v);
  }
  for (const v of slow.variants) {
    const key = `${v.chrom}-${v.pos}-${v.ref}-${v.alt}`;
    const existing = variantMap.get(key);
    if (existing) {
      variantMap.set(key, { ...existing, ...v });
    }
  }

  return {
    variants: fast.variants.map((v) => {
      const key = `${v.chrom}-${v.pos}-${v.ref}-${v.alt}`;
      return variantMap.get(key) || v;
    }),
    evidence: [...fast.evidence, ...slow.evidence],
    therapies: [...fast.therapies, ...slow.therapies],
    errors: [...fast.errors, ...slow.errors],
  };
}

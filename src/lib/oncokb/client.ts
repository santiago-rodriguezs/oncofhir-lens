import { z } from 'zod';

// Environment variables
// Use NEXT_PUBLIC_ prefixed variables for client-side components
const ONCOKB_BASE_URL = typeof window === 'undefined' 
  ? (process.env.ONCOKB_BASE_URL || 'https://www.oncokb.org/api/v1')
  : (process.env.NEXT_PUBLIC_ONCOKB_BASE_URL || 'https://www.oncokb.org/api/v1');

const ONCOKB_AUTH_TOKEN = typeof window === 'undefined'
  ? process.env.ONCOKB_AUTH_TOKEN
  : process.env.NEXT_PUBLIC_ONCOKB_AUTH_TOKEN;

// Types
export interface OncoKbAnnotationQuery {
  geneSymbol?: string;
  variant?: string;
  hgvsg?: string;
  tumorType?: string;
  referenceGenome?: "GRCh37" | "GRCh38";
  alterationType?: "MUTATION" | "CNA" | "SV";
}

export interface OncoKbTherapy {
  drug: string;
  level: string | null; // e.g. 1, 2, R1, Dx, Px (según contexto)
  indication?: string;  // disease/tumor type
  resistance?: boolean;
  pmids?: string[];
}

export interface OncoKbAnnotation {
  query: OncoKbAnnotationQuery;
  oncogenic?: string;
  hotspot?: boolean | null;
  geneSummary?: string;
  variantSummary?: string;
  tumorTypeSummary?: string;
  mutationEffect?: { knownEffect?: string; description?: string; };
  highestSensitiveLevel?: string | null;
  highestResistanceLevel?: string | null;
  highestDiagnosticImplicationLevel?: string | null;
  highestPrognosticImplicationLevel?: string | null;
  diagnosticImplications?: any[];
  prognosticImplications?: any[];
  treatments?: OncoKbTherapy[]; // si el endpoint lo provee
  dataVersion?: string;
  lastUpdate?: string;
}

// Generate a unique fingerprint for caching
export function generateQueryFingerprint(query: any): string {
  const {
    type = 'mutation',
    gene,
    alteration,
    hgvsg,
    genomicLocation,
    tumorType,
    referenceGenome = 'GRCh37'
  } = query;
  
  return JSON.stringify({
    type,
    gene,
    alteration,
    hgvsg,
    genomicLocation,
    tumorType,
    referenceGenome
  });
}

// Helper function to handle rate limiting and retries with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // If rate limited, wait and retry
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '5';
        const waitTime = parseInt(retryAfter, 10) * 1000;
        console.log(`Rate limited. Waiting for ${waitTime}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }
      
      // If server error, wait and retry with exponential backoff
      if (response.status >= 500) {
        const waitTime = Math.min(1000 * Math.pow(2, retries), 30000); // Max 30 seconds
        console.log(`Server error (${response.status}). Waiting for ${waitTime}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      if (retries < maxRetries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, retries), 30000); // Max 30 seconds
        console.log(`Network error. Waiting for ${waitTime}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
      } else {
        throw error;
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} retries`);
}

// Base function for OncoKB API calls
async function callOncoKbApi(endpoint: string, body: any): Promise<any> {
  // In the browser, use the proxy API route
  if (typeof window !== 'undefined') {
    const response = await fetch('/api/oncokb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        queries: body,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OncoKB API error (${response.status}): ${errorData.error || 'Unknown error'}`);
    }
    
    return await response.json();
  }
  
  // Server-side, call the OncoKB API directly
  if (!ONCOKB_AUTH_TOKEN) {
    console.error('OncoKB API token not configured');
    throw new Error('OncoKB API token not configured');
  }
  
  const url = `${ONCOKB_BASE_URL}${endpoint}`;
  
  // Log auth info (without exposing full token)
  const tokenPreview = ONCOKB_AUTH_TOKEN.substring(0, 5) + '...' + ONCOKB_AUTH_TOKEN.substring(ONCOKB_AUTH_TOKEN.length - 5);
  console.log(`🔑 Using OncoKB token: ${tokenPreview}`);
  console.log(`🌐 Calling OncoKB API: ${url}`);
  
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ONCOKB_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
  
  console.log('📤 Request headers:', JSON.stringify(options.headers));
  
  const response = await fetchWithRetry(url, options);
  
  console.log(`📥 Response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ OncoKB API error: ${errorText}`);
    throw new Error(`OncoKB API error: ${errorText}`);
  }
  
  return await response.json();
}

// Annotate mutations by protein change
export async function annotateByProteinChange(
  queries: Array<{
    hugoSymbol: string;
    alteration: string;
    tumorType?: string;
    referenceGenome?: "GRCh37" | "GRCh38";
  }>
): Promise<any[]> {
  return callOncoKbApi('/annotate/mutations/byProteinChange', queries);
}

// Annotate mutations by HGVSg
export async function annotateByHGVSg(
  queries: Array<{
    hgvsg: string;
    tumorType?: string;
    referenceGenome?: "GRCh37" | "GRCh38";
  }>
): Promise<any[]> {
  return callOncoKbApi('/annotate/mutations/byHGVSg', queries);
}

// Annotate mutations by genomic change
export async function annotateByGenomicChange(
  queries: Array<{
    genomicLocation: string;
    tumorType?: string;
    referenceGenome?: "GRCh37" | "GRCh38";
  }>
): Promise<any[]> {
  return callOncoKbApi('/annotate/mutations/byGenomicChange', queries);
}

// Annotate copy number alterations
export async function annotateCNA(
  queries: Array<{
    hugoSymbol: string;
    copyNameAlterationType: string; // e.g., "Amplification" or "Deletion"
    tumorType?: string;
    referenceGenome?: "GRCh37" | "GRCh38";
  }>
): Promise<any[]> {
  return callOncoKbApi('/annotate/copyNumberAlterations', queries);
}

// Annotate structural variants
export async function annotateSV(
  queries: Array<{
    hugoSymbolA: string;
    hugoSymbolB: string;
    structuralVariantType?: string;
    isFunctionalFusion?: boolean;
    tumorType?: string;
    referenceGenome?: "GRCh37" | "GRCh38";
  }>
): Promise<any[]> {
  return callOncoKbApi('/annotate/structuralVariants', queries);
}

// Normalize OncoKB API response to our annotation format
function normalizeAnnotation(apiResponse: any, query: OncoKbAnnotationQuery): OncoKbAnnotation {
  const treatments: OncoKbTherapy[] = [];
  
  // Process treatments if available
  if (apiResponse.treatments && Array.isArray(apiResponse.treatments)) {
    for (const treatment of apiResponse.treatments) {
      if (treatment.drugs && Array.isArray(treatment.drugs)) {
        const drugNames = treatment.drugs.map((drug: any) => drug.drugName).join(' + ');
        
        treatments.push({
          drug: drugNames,
          level: treatment.level || null,
          indication: treatment.levelAssociatedCancerType?.name,
          resistance: treatment.level?.startsWith('R') || false,
          pmids: treatment.pmids || []
        });
      }
    }
  }
  
  // If no treatments but we have highest levels, infer minimal treatments
  if (treatments.length === 0) {
    if (apiResponse.highestSensitiveLevel) {
      treatments.push({
        drug: 'Inferred from highest sensitive level',
        level: apiResponse.highestSensitiveLevel,
        resistance: false
      });
    }
    
    if (apiResponse.highestResistanceLevel) {
      treatments.push({
        drug: 'Inferred from highest resistance level',
        level: apiResponse.highestResistanceLevel,
        resistance: true
      });
    }
  }
  
  return {
    query,
    oncogenic: apiResponse.oncogenic,
    hotspot: apiResponse.hotspot,
    geneSummary: apiResponse.geneSummary,
    variantSummary: apiResponse.variantSummary,
    tumorTypeSummary: apiResponse.tumorTypeSummary,
    mutationEffect: {
      knownEffect: apiResponse.mutationEffect?.knownEffect,
      description: apiResponse.mutationEffect?.description
    },
    highestSensitiveLevel: apiResponse.highestSensitiveLevel,
    highestResistanceLevel: apiResponse.highestResistanceLevel,
    highestDiagnosticImplicationLevel: apiResponse.highestDiagnosticImplicationLevel,
    highestPrognosticImplicationLevel: apiResponse.highestPrognosticImplicationLevel,
    diagnosticImplications: apiResponse.diagnosticImplications,
    prognosticImplications: apiResponse.prognosticImplications,
    treatments,
    dataVersion: apiResponse.dataVersion,
    lastUpdate: apiResponse.lastUpdate
  };
}

// Main function to get OncoKB annotations for a list of annotations
export async function getOncoKbAnnotations(
  annotations: Array<{ 
    geneSymbol: string; 
    variant?: string; 
    hgvs?: string; 
    tumorType?: string; 
    referenceGenome?: "GRCh37" | "GRCh38"; 
    alterationType?: "MUTATION" | "CNA" | "SV" 
  }>
): Promise<OncoKbAnnotation[]> {
  // Group annotations by type for batching
  const proteinChangeQueries: any[] = [];
  const hgvsgQueries: any[] = [];
  const genomicChangeQueries: any[] = [];
  const cnaQueries: any[] = [];
  const svQueries: any[] = [];
  
  // Map to track original queries
  const queryMap = new Map<string, OncoKbAnnotationQuery>();
  
  // Process each annotation
  for (const annotation of annotations) {
    const { geneSymbol, variant, hgvs, tumorType, referenceGenome = "GRCh37", alterationType = "MUTATION" } = annotation;
    
    // Create a query key for mapping
    const queryKey = JSON.stringify({ geneSymbol, variant, hgvs, tumorType, referenceGenome, alterationType });
    
    // Store the original query
    queryMap.set(queryKey, { 
      geneSymbol, 
      variant, 
      hgvsg: hgvs, 
      tumorType, 
      referenceGenome, 
      alterationType 
    });
    
    // Route to appropriate query type
    if (alterationType === "CNA") {
      cnaQueries.push({
        hugoSymbol: geneSymbol,
        copyNameAlterationType: variant || "Amplification", // Default to amplification if not specified
        tumorType,
        referenceGenome
      });
    } else if (alterationType === "SV") {
      // Parse fusion genes (e.g., "GENE1-GENE2")
      const genes = geneSymbol.split(/[-\/]/);
      svQueries.push({
        hugoSymbolA: genes[0] || geneSymbol,
        hugoSymbolB: genes[1] || geneSymbol,
        isFunctionalFusion: true,
        tumorType,
        referenceGenome
      });
    } else if (hgvs) {
      hgvsgQueries.push({
        hgvsg: hgvs,
        tumorType,
        referenceGenome
      });
    } else if (variant && geneSymbol) {
      // Check if the variant is a genomic variant (chr:pos format)
      const isGenomic = variant.match(/^chr[\w]+:\d+/);
      
      // If it's a genomic variant, try to extract genomic location
      if (isGenomic) {
        const match = variant.match(/^chr([\w]+):(\d+)([ACGT])>([ACGT])$/);
        if (match) {
          const [_, chromosome, position, ref, alt] = match;
          genomicChangeQueries.push({
            genomicLocation: `${chromosome},${position},${position},${ref},${alt}`,
            tumorType,
            referenceGenome
          });
        } else {
          // If we can't parse the genomic variant, fall back to protein change
          proteinChangeQueries.push({
            hugoSymbol: geneSymbol,
            alteration: variant,
            tumorType,
            referenceGenome
          });
        }
      } else {
        // Otherwise treat as protein change
        proteinChangeQueries.push({
          hugoSymbol: geneSymbol,
          alteration: variant,
          tumorType,
          referenceGenome
        });
      }
    }
  }
  
  // Results array
  const results: OncoKbAnnotation[] = [];
  
  // Batch API calls by type
  try {
    // Process protein change queries
    if (proteinChangeQueries.length > 0) {
      const responses = await annotateByProteinChange(proteinChangeQueries);
      
      for (let i = 0; i < responses.length; i++) {
        const query = proteinChangeQueries[i];
        const queryKey = JSON.stringify({ 
          geneSymbol: query.hugoSymbol, 
          variant: query.alteration, 
          tumorType: query.tumorType, 
          referenceGenome: query.referenceGenome,
          alterationType: "MUTATION"
        });
        
        const originalQuery = queryMap.get(queryKey);
        if (originalQuery) {
          results.push(normalizeAnnotation(responses[i], originalQuery));
        }
      }
    }
    
    // Process genomic change queries
    if (genomicChangeQueries.length > 0) {
      const responses = await annotateByGenomicChange(genomicChangeQueries);
      
      for (let i = 0; i < responses.length; i++) {
        const query = genomicChangeQueries[i];
        
        // Find matching original query by genomic location
        let originalQuery: OncoKbAnnotationQuery | undefined;
        for (const [key, value] of queryMap.entries()) {
          const parsedKey = JSON.parse(key);
          if (parsedKey.variant && parsedKey.variant.includes(query.genomicLocation.split(',')[1])) {
            originalQuery = value;
            break;
          }
        }
        
        if (originalQuery) {
          results.push(normalizeAnnotation(responses[i], originalQuery));
        }
      }
    }
    
    // Process HGVSg queries
    if (hgvsgQueries.length > 0) {
      const responses = await annotateByHGVSg(hgvsgQueries);
      
      for (let i = 0; i < responses.length; i++) {
        const query = hgvsgQueries[i];
        const queryKey = JSON.stringify({ 
          hgvsg: query.hgvsg, 
          tumorType: query.tumorType, 
          referenceGenome: query.referenceGenome,
          alterationType: "MUTATION"
        });
        
        // Find matching original query
        let originalQuery: OncoKbAnnotationQuery | undefined;
        for (const [key, value] of queryMap.entries()) {
          const parsedKey = JSON.parse(key);
          if (parsedKey.hgvs === query.hgvsg) {
            originalQuery = value;
            break;
          }
        }
        
        if (originalQuery) {
          results.push(normalizeAnnotation(responses[i], originalQuery));
        }
      }
    }
    
    // Process CNA queries
    if (cnaQueries.length > 0) {
      const responses = await annotateCNA(cnaQueries);
      
      for (let i = 0; i < responses.length; i++) {
        const query = cnaQueries[i];
        const queryKey = JSON.stringify({ 
          geneSymbol: query.hugoSymbol, 
          variant: query.copyNameAlterationType, 
          tumorType: query.tumorType, 
          referenceGenome: query.referenceGenome,
          alterationType: "CNA"
        });
        
        const originalQuery = queryMap.get(queryKey);
        if (originalQuery) {
          results.push(normalizeAnnotation(responses[i], originalQuery));
        }
      }
    }
    
    // Process SV queries
    if (svQueries.length > 0) {
      const responses = await annotateSV(svQueries);
      
      for (let i = 0; i < responses.length; i++) {
        const query = svQueries[i];
        const queryKey = JSON.stringify({ 
          geneSymbol: `${query.hugoSymbolA}/${query.hugoSymbolB}`, 
          tumorType: query.tumorType, 
          referenceGenome: query.referenceGenome,
          alterationType: "SV"
        });
        
        // Find matching original query
        let originalQuery: OncoKbAnnotationQuery | undefined;
        for (const [key, value] of queryMap.entries()) {
          const parsedKey = JSON.parse(key);
          if (parsedKey.alterationType === "SV" && 
              parsedKey.geneSymbol.includes(query.hugoSymbolA) && 
              parsedKey.geneSymbol.includes(query.hugoSymbolB)) {
            originalQuery = value;
            break;
          }
        }
        
        if (originalQuery) {
          results.push(normalizeAnnotation(responses[i], originalQuery));
        }
      }
    }
  } catch (error) {
    console.error('Error fetching OncoKB annotations:', error);
  }
  
  return results;
}

// Helper function to rank evidence levels for sorting
export function rankLevel(level: string | null): number {
  if (!level) return 0;
  
  const levelMap: Record<string, number> = {
    '1': 100,
    '2': 90,
    '3': 80,
    '4': 70,
    'R1': 60,
    'R2': 50,
    'Dx1': 40,
    'Dx2': 39,
    'Dx3': 38,
    'Px1': 30,
    'Px2': 29,
    'Px3': 28
  };
  
  return levelMap[level] || 0;
}

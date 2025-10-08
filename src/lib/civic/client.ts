import { z } from 'zod';

// Environment variables
const CIVIC_GRAPHQL_URL = process.env.CIVIC_GRAPHQL_URL || 'https://civicdb.org/api/graphql';
const CIVIC_REST_URL = process.env.CIVIC_REST_URL || 'https://civicdb.org/api';

// Types
export interface CivicAnnotation {
  geneSymbol: string;
  variant?: string;
  hgvs?: string;
  tumorType?: string;
}

export interface CivicVariantIdentifier {
  id: string;
  name: string;
  hgvs?: string;
  geneSymbol: string;
}

export interface CivicEvidence {
  id: string;
  evidenceLevel: string; // A-E
  evidenceRating: number; // 1-5
  evidenceDirection: string;
  clinicalSignificance: string;
  drugs: { name: string }[];
  disease: { name: string };
  source: {
    citationId: string;
    url: string;
  };
  gene: {
    symbol: string;
  };
  variant: {
    name: string;
    hgvs?: string;
    coordinates?: {
      chromosome?: string;
      start?: number;
      stop?: number;
      reference_bases?: string;
      variant_bases?: string;
    };
  };
  assertions?: {
    displayName: string;
    therapeuticContext?: string;
    approvals?: {
      regulatoryAgency: string;
      status: string;
    }[];
  }[];
}

export interface SuggestedDrug {
  name: string;
  bestEvidenceLevel: string;
  evidenceCount: number;
  variants: string[];
  diseases: string[];
  topPmids: string[];
  civicUrl: string;
}

export interface CivicResult {
  annotation: CivicAnnotation;
  matchedVariant?: CivicVariantIdentifier;
  evidences: CivicEvidence[];
  suggestedDrugs: SuggestedDrug[];
}

// GraphQL query to search for variants
const searchVariantsQuery = `
  query VariantSearch($q: String!) {
    variants(query: $q, first: 10) {
      nodes { 
        id 
        name 
        hgvs 
        gene { 
          symbol 
        } 
      }
    }
  }
`;

// GraphQL query to get evidence by variant ID
const evidenceByVariantQuery = `
  query EvidenceByVariant($variantId: ID!, $disease: String) {
    variant(id: $variantId) {
      name
      evidenceItems(evidenceType: PREDICTIVE, first: 50, disease: $disease) {
        nodes {
          id
          evidenceLevel
          evidenceRating
          evidenceDirection
          clinicalSignificance
          drugs { name }
          disease { name }
          source { citationId url }
          gene { symbol }
          variant { name hgvs }
          assertions { 
            displayName 
            therapeuticContext
            approvals { 
              regulatoryAgency 
              status 
            } 
          }
        }
      }
    }
  }
`;

/**
 * Query CIViC API to find variant IDs based on gene symbol and variant name or HGVS
 */
export async function queryVariantIds({ 
  geneSymbol, 
  variant, 
  hgvs 
}: { 
  geneSymbol: string; 
  variant?: string; 
  hgvs?: string;
}): Promise<CivicVariantIdentifier[]> {
  try {
    // Construct search query
    const searchTerm = variant 
      ? `${geneSymbol} ${variant}` 
      : hgvs 
        ? `${geneSymbol} ${hgvs}` 
        : geneSymbol;
    
    // Try GraphQL first
    try {
      const response = await fetch(CIVIC_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchVariantsQuery,
          variables: { q: searchTerm },
        }),
      });

      if (!response.ok) {
        throw new Error('GraphQL request failed');
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      return data.data.variants.nodes.map((node: any) => ({
        id: node.id,
        name: node.name,
        hgvs: node.hgvs,
        geneSymbol: node.gene.symbol,
      }));
    } catch (graphqlError) {
      console.error('GraphQL error, falling back to REST:', graphqlError);
      
      // Fallback to REST API
      const encodedQuery = encodeURIComponent(searchTerm);
      const response = await fetch(`${CIVIC_REST_URL}/variants?q=${encodedQuery}`);
      
      if (!response.ok) {
        throw new Error('REST API request failed');
      }
      
      const data = await response.json();
      
      return data.records.map((record: any) => ({
        id: record.id.toString(),
        name: record.name,
        hgvs: record.hgvs_expressions?.[0],
        geneSymbol: record.gene_name,
      }));
    }
  } catch (error) {
    console.error('Error querying variant IDs:', error);
    return [];
  }
}

/**
 * Query CIViC API for predictive evidence based on variant IDs
 */
export async function queryPredictiveEvidence({ 
  variantIds, 
  tumorType,
  page = 1
}: { 
  variantIds: string[]; 
  tumorType?: string;
  page?: number;
}): Promise<CivicEvidence[]> {
  if (!variantIds.length) return [];
  
  try {
    const allEvidence: CivicEvidence[] = [];
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < variantIds.length; i += batchSize) {
      const batch = variantIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (variantId) => {
        try {
          // Try GraphQL first
          const graphqlResponse = await fetch(CIVIC_GRAPHQL_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: evidenceByVariantQuery,
              variables: { 
                variantId, 
                disease: tumorType 
              },
            }),
          });

          if (!graphqlResponse.ok) {
            throw new Error('GraphQL request failed');
          }

          const data = await graphqlResponse.json();
          
          if (data.errors) {
            throw new Error(data.errors[0].message);
          }

          return data.data.variant?.evidenceItems?.nodes || [];
        } catch (graphqlError) {
          console.error('GraphQL error, falling back to REST:', graphqlError);
          
          // Fallback to REST API
          let url = `${CIVIC_REST_URL}/variants/${variantId}/evidence_items?evidence_type=Predictive&page=${page}`;
          if (tumorType) {
            url += `&disease=${encodeURIComponent(tumorType)}`;
          }
          
          const restResponse = await fetch(url);
          
          if (!restResponse.ok) {
            throw new Error('REST API request failed');
          }
          
          const data = await restResponse.json();
          return data.records || [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(items => {
        if (Array.isArray(items)) {
          allEvidence.push(...items);
        }
      });
      
      // Add a small delay between batches to be nice to the API
      if (i + batchSize < variantIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return allEvidence;
  } catch (error) {
    console.error('Error querying predictive evidence:', error);
    return [];
  }
}

/**
 * Normalize evidence data to a consistent format
 */
function normalizeEvidence(evidence: any): CivicEvidence {
  // Handle both GraphQL and REST API response formats
  return {
    id: evidence.id.toString(),
    evidenceLevel: evidence.evidence_level || evidence.evidenceLevel,
    evidenceRating: parseInt(evidence.evidence_rating || evidence.evidenceRating),
    evidenceDirection: evidence.evidence_direction || evidence.evidenceDirection,
    clinicalSignificance: evidence.clinical_significance || evidence.clinicalSignificance,
    drugs: evidence.drugs || (evidence.drug_interaction_type ? [{ name: evidence.drug_name }] : []),
    disease: evidence.disease || { name: evidence.disease_name },
    source: evidence.source || { 
      citationId: evidence.source_citation_id || evidence.citation_id, 
      url: evidence.source_url || evidence.citation_url 
    },
    gene: evidence.gene || { symbol: evidence.gene_name },
    variant: evidence.variant || { 
      name: evidence.variant_name,
      hgvs: evidence.variant_hgvs
    },
    assertions: evidence.assertions || []
  };
}

/**
 * Aggregate evidence by drug to create suggested drugs list
 */
function aggregateByDrug(evidences: CivicEvidence[]): SuggestedDrug[] {
  const drugMap = new Map<string, SuggestedDrug>();
  
  // Map evidence level to numeric value for sorting (A=5, B=4, etc.)
  const levelValue = (level: string): number => {
    const levels: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
    return levels[level.charAt(0)] || 0;
  };
  
  evidences.forEach(evidence => {
    evidence.drugs.forEach(drug => {
      const drugName = drug.name;
      
      if (!drugMap.has(drugName)) {
        drugMap.set(drugName, {
          name: drugName,
          bestEvidenceLevel: evidence.evidenceLevel,
          evidenceCount: 1,
          variants: [`${evidence.gene.symbol} ${evidence.variant.name}`],
          diseases: [evidence.disease.name],
          topPmids: [evidence.source.citationId],
          civicUrl: `https://civicdb.org/variants/${evidence.variant.name}/summary`
        });
      } else {
        const existingDrug = drugMap.get(drugName)!;
        
        // Update best evidence level
        if (levelValue(evidence.evidenceLevel) > levelValue(existingDrug.bestEvidenceLevel)) {
          existingDrug.bestEvidenceLevel = evidence.evidenceLevel;
        }
        
        // Increment evidence count
        existingDrug.evidenceCount++;
        
        // Add variant if not already in the list
        const variantKey = `${evidence.gene.symbol} ${evidence.variant.name}`;
        if (!existingDrug.variants.includes(variantKey)) {
          existingDrug.variants.push(variantKey);
        }
        
        // Add disease if not already in the list
        if (!existingDrug.diseases.includes(evidence.disease.name)) {
          existingDrug.diseases.push(evidence.disease.name);
        }
        
        // Add PMID if not already in the list and if we have fewer than 3
        if (evidence.source.citationId && 
            !existingDrug.topPmids.includes(evidence.source.citationId) && 
            existingDrug.topPmids.length < 3) {
          existingDrug.topPmids.push(evidence.source.citationId);
        }
      }
    });
  });
  
  // Convert map to array and sort
  return Array.from(drugMap.values()).sort((a, b) => {
    // Sort by best evidence level (A is better than E)
    const levelDiff = levelValue(b.bestEvidenceLevel) - levelValue(a.bestEvidenceLevel);
    if (levelDiff !== 0) return levelDiff;
    
    // Then by evidence count
    return b.evidenceCount - a.evidenceCount;
  });
}

/**
 * Main function to get CIViC evidence for a list of annotations
 */
export async function getCivicEvidenceForAnnotations(
  annotations: CivicAnnotation[]
): Promise<CivicResult[]> {
  if (!annotations.length) return [];
  
  const results: CivicResult[] = [];
  
  // Process annotations in batches
  const batchSize = 5;
  for (let i = 0; i < annotations.length; i += batchSize) {
    const batch = annotations.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (annotation) => {
      try {
        // Step 1: Find variant IDs
        const variantIds = await queryVariantIds({
          geneSymbol: annotation.geneSymbol,
          variant: annotation.variant,
          hgvs: annotation.hgvs
        });
        
        if (!variantIds.length) {
          return {
            annotation,
            matchedVariant: undefined,
            evidences: [],
            suggestedDrugs: []
          };
        }
        
        // Step 2: Get evidence for the variants
        const evidences = await queryPredictiveEvidence({
          variantIds: variantIds.map(v => v.id),
          tumorType: annotation.tumorType
        });
        
        // Step 3: Aggregate evidence by drug
        const suggestedDrugs = aggregateByDrug(evidences);
        
        return {
          annotation,
          matchedVariant: variantIds[0],
          evidences,
          suggestedDrugs
        };
      } catch (error) {
        console.error(`Error processing annotation ${annotation.geneSymbol}:`, error);
        return {
          annotation,
          matchedVariant: undefined,
          evidences: [],
          suggestedDrugs: []
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add a small delay between batches
    if (i + batchSize < annotations.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

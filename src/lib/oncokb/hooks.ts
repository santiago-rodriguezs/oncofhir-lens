import { useQuery } from '@tanstack/react-query';
import { getOncoKbAnnotations, OncoKbAnnotation, OncoKbTherapy, rankLevel, generateQueryFingerprint } from './client';
import { normalizeTumorType } from './oncotree';

/**
 * Custom hook to fetch and cache OncoKB evidence for annotations
 */
export function useOncoKbEvidence(
  annotations: Array<{ 
    geneSymbol: string; 
    variant?: string; 
    hgvs?: string; 
    tumorType?: string; 
    referenceGenome?: "GRCh37" | "GRCh38"; 
    alterationType?: "MUTATION" | "CNA" | "SV" 
  }>,
  enabled = true
) {
  // Debug information
  console.log('useOncoKbEvidence called with', annotations.length, 'annotations');
  console.log('Sample annotation in hook:', annotations.length > 0 ? annotations[0] : 'No annotations');
  console.log('Enabled:', enabled);
  console.log('Auth token exists:', typeof window !== 'undefined' ? !!process.env.NEXT_PUBLIC_ONCOKB_AUTH_TOKEN : 'Server-side');

  // Generate a cache key based on the fingerprint of each query
  const queryKey = annotations.map(annotation => {
    return generateQueryFingerprint({
      type: annotation.alterationType || 'MUTATION',
      gene: annotation.geneSymbol,
      alteration: annotation.variant,
      hgvsg: annotation.hgvs,
      tumorType: annotation.tumorType,
      referenceGenome: annotation.referenceGenome || 'GRCh37'
    });
  });
  
  return useQuery<OncoKbAnnotation[], Error>({
    queryKey: ['oncokb-evidence', queryKey],
    queryFn: async () => {
      console.log('Fetching OncoKB annotations for', annotations.length, 'variants');
      try {
        // In the browser, use the API route
        if (typeof window !== 'undefined') {
          const response = await fetch('/api/annotate/oncokb', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(annotations),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OncoKB API error: ${errorData.error || 'Unknown error'}`);
          }
          
          const results = await response.json();
          console.log('OncoKB results received:', results.length);
          return results;
        } else {
          // Server-side, use the client directly
          const results = await getOncoKbAnnotations(annotations);
          console.log('OncoKB results received:', results.length);
          return results;
        }
      } catch (error) {
        console.error('Error in OncoKB query function:', error);
        throw error;
      }
    },
    enabled: enabled && annotations.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes cache
    retry: (failureCount, error) => {
      console.log('OncoKB query failed, attempt:', failureCount, 'error:', error.message);
      // Implement exponential backoff for rate limiting
      if (error.message.includes('429') || error.message.includes('5')) {
        return failureCount < 3; // Retry up to 3 times for rate limiting or server errors
      }
      return failureCount < 1; // Only retry once for other errors
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

export interface OncoKbSuggestedDrug {
  name: string;
  bestLevel: string;
  evidenceCount: number;
  variants: string[];
  indications: string[];
  pmids: string[];
  oncokbUrl: string;
  hasResistance: boolean;
}

export interface OncoKbFilterOptions {
  tumorType?: string;
  evidenceType?: 'sensitive' | 'resistance' | 'all';
  levels?: string[];
}

/**
 * Custom hook to filter OncoKB evidence results
 */
export function useFilteredOncoKbResults(
  results: OncoKbAnnotation[] | undefined,
  filters: OncoKbFilterOptions
) {
  if (!results) return { filteredResults: [], suggestedDrugs: [] };

  // Normalize tumor type if provided
  const normalizedTumorType = filters.tumorType ? normalizeTumorType(filters.tumorType) : undefined;
  
  // Filter results based on criteria
  const filteredResults = results.map(result => {
    // Apply tumor type filter if specified
    let filteredTreatments = result.treatments || [];
    
    if (normalizedTumorType) {
      filteredTreatments = filteredTreatments.filter(treatment => {
        if (!treatment.indication) return true; // Keep treatments without indication
        return normalizeTumorType(treatment.indication) === normalizedTumorType;
      });
    }
    
    // Apply evidence type filter
    if (filters.evidenceType === 'sensitive') {
      filteredTreatments = filteredTreatments.filter(treatment => {
        const level = treatment.level || '';
        return !level.startsWith('R'); // Exclude resistance levels (R1, R2)
      });
    } else if (filters.evidenceType === 'resistance') {
      filteredTreatments = filteredTreatments.filter(treatment => {
        const level = treatment.level || '';
        return level.startsWith('R'); // Only include resistance levels (R1, R2)
      });
    }
    
    // Apply level filter
    if (filters.levels && filters.levels.length > 0) {
      filteredTreatments = filteredTreatments.filter(treatment => {
        return filters.levels?.includes(treatment.level || '');
      });
    }
    
    return {
      ...result,
      treatments: filteredTreatments
    };
  });
  
  // Aggregate all drugs across all results
  const allDrugs = filteredResults.flatMap(result => 
    (result.treatments || []).map(treatment => ({
      name: treatment.drug,
      level: treatment.level || '',
      indication: treatment.indication || '',
      variant: `${result.query.geneSymbol || ''} ${result.query.variant || result.query.hgvsg || ''}`.trim(),
      pmids: treatment.pmids || [],
      resistance: treatment.resistance || false
    }))
  );
  
  // Combine drugs with the same name
  const drugMap = new Map<string, OncoKbSuggestedDrug>();
  
  allDrugs.forEach(drug => {
    if (!drugMap.has(drug.name)) {
      drugMap.set(drug.name, {
        name: drug.name,
        bestLevel: drug.level,
        evidenceCount: 1,
        variants: [drug.variant],
        indications: drug.indication ? [drug.indication] : [],
        pmids: drug.pmids,
        oncokbUrl: `https://www.oncokb.org/drug/${encodeURIComponent(drug.name)}`,
        hasResistance: drug.resistance
      });
    } else {
      const existingDrug = drugMap.get(drug.name)!;
      
      // Update best level if this one is better
      if (rankLevel(drug.level) > rankLevel(existingDrug.bestLevel)) {
        existingDrug.bestLevel = drug.level;
      }
      
      // Update evidence count
      existingDrug.evidenceCount += 1;
      
      // Add variant if not already included
      if (!existingDrug.variants.includes(drug.variant)) {
        existingDrug.variants.push(drug.variant);
      }
      
      // Add indication if not already included
      if (drug.indication && !existingDrug.indications.includes(drug.indication)) {
        existingDrug.indications.push(drug.indication);
      }
      
      // Add PMIDs if not already included
      drug.pmids.forEach(pmid => {
        if (!existingDrug.pmids.includes(pmid)) {
          existingDrug.pmids.push(pmid);
        }
      });
      
      // Update resistance flag if any treatment has resistance
      if (drug.resistance) {
        existingDrug.hasResistance = true;
      }
    }
  });
  
  // Convert map back to array and sort
  const suggestedDrugs = Array.from(drugMap.values()).sort((a, b) => {
    // Sort by best level first
    const levelDiff = rankLevel(b.bestLevel) - rankLevel(a.bestLevel);
    if (levelDiff !== 0) return levelDiff;
    
    // Then by evidence count
    return b.evidenceCount - a.evidenceCount;
  });

  return { filteredResults, suggestedDrugs };
}

/**
 * Get all unique available evidence levels from results
 */
export function getAvailableLevels(results: OncoKbAnnotation[] | undefined): string[] {
  if (!results) return [];
  
  const levels = new Set<string>();
  
  results.forEach(result => {
    (result.treatments || []).forEach(treatment => {
      if (treatment.level) {
        levels.add(treatment.level);
      }
    });
  });
  
  return Array.from(levels).sort((a, b) => rankLevel(b) - rankLevel(a));
}

/**
 * Get summary statistics from OncoKB results
 */
export function getOncoKbSummaryStats(results: OncoKbAnnotation[] | undefined) {
  if (!results) {
    return {
      totalVariants: 0,
      annotatedVariants: 0,
      uniqueDrugs: 0,
      hotspotCount: 0,
      bestLevel: null
    };
  }
  
  // Count total variants
  const totalVariants = results.length;
  
  // Count annotated variants (with treatments or oncogenic info)
  const annotatedVariants = results.filter(result => 
    (result.treatments && result.treatments.length > 0) || 
    result.oncogenic || 
    result.hotspot
  ).length;
  
  // Count hotspots
  const hotspotCount = results.filter(result => result.hotspot === true).length;
  
  // Get unique drugs
  const uniqueDrugs = new Set<string>();
  results.forEach(result => {
    (result.treatments || []).forEach(treatment => {
      uniqueDrugs.add(treatment.drug);
    });
  });
  
  // Find best level
  let bestLevel: string | null = null;
  let bestRank = -1;
  
  results.forEach(result => {
    // Check highest sensitive level
    if (result.highestSensitiveLevel) {
      const rank = rankLevel(result.highestSensitiveLevel);
      if (rank > bestRank) {
        bestRank = rank;
        bestLevel = result.highestSensitiveLevel;
      }
    }
    
    // Check individual treatments
    (result.treatments || []).forEach(treatment => {
      if (treatment.level && !treatment.resistance) {
        const rank = rankLevel(treatment.level);
        if (rank > bestRank) {
          bestRank = rank;
          bestLevel = treatment.level;
        }
      }
    });
  });
  
  return {
    totalVariants,
    annotatedVariants,
    uniqueDrugs: uniqueDrugs.size,
    hotspotCount,
    bestLevel
  };
}

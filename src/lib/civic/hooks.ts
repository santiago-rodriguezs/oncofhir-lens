import { useQuery } from '@tanstack/react-query';
import { getCivicEvidenceForAnnotations, CivicAnnotation, CivicResult } from './client';

/**
 * Custom hook to fetch and cache CIViC evidence for annotations
 */
export function useCivicEvidence(
  annotations: CivicAnnotation[],
  enabled = true
) {
  return useQuery<CivicResult[], Error>({
    queryKey: ['civic-evidence', annotations.map(a => `${a.geneSymbol}-${a.variant || a.hgvs}-${a.tumorType || ''}`)],
    queryFn: () => getCivicEvidenceForAnnotations(annotations),
    enabled: enabled && annotations.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes cache
    retry: (failureCount, error) => {
      // Implement exponential backoff for rate limiting
      if (error.message.includes('429') || error.message.includes('5')) {
        return failureCount < 3; // Retry up to 3 times for rate limiting or server errors
      }
      return failureCount < 1; // Only retry once for other errors
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Custom hook to filter CIViC evidence results
 */
export function useFilteredCivicResults(
  results: CivicResult[] | undefined,
  filters: {
    tumorType?: string;
    evidenceLevel?: string[];
    onlyFdaApproved?: boolean;
    predictiveOnly?: boolean;
  }
) {
  if (!results) return { filteredResults: [], filteredDrugs: [] };

  // Filter results based on criteria
  const filteredResults = results.map(result => {
    // Filter evidences
    const filteredEvidences = result.evidences.filter(evidence => {
      // Filter by tumor type if specified
      if (filters.tumorType && 
          !evidence.disease.name.toLowerCase().includes(filters.tumorType.toLowerCase())) {
        return false;
      }

      // Filter by evidence level if specified
      if (filters.evidenceLevel?.length && 
          !filters.evidenceLevel.includes(evidence.evidenceLevel)) {
        return false;
      }

      // Filter by FDA approval if specified
      if (filters.onlyFdaApproved) {
        const hasApproval = evidence.assertions?.some(assertion => 
          assertion.approvals?.some(approval => 
            approval.regulatoryAgency === 'FDA' && 
            ['Approved', 'Guidelines'].includes(approval.status)
          )
        );
        if (!hasApproval) return false;
      }

      // Filter by predictive only (already filtered in API call, but double-check)
      if (filters.predictiveOnly && 
          !['Sensitivity', 'Resistance', 'Reduced Sensitivity'].includes(evidence.clinicalSignificance)) {
        return false;
      }

      return true;
    });

    // Recalculate suggested drugs based on filtered evidences
    const suggestedDrugs = result.suggestedDrugs.filter(drug => {
      // Check if any evidence for this drug passes the filters
      return filteredEvidences.some(evidence => 
        evidence.drugs.some(d => d.name === drug.name)
      );
    });

    return {
      ...result,
      evidences: filteredEvidences,
      suggestedDrugs
    };
  });

  // Aggregate all drugs across all results
  const allDrugs = filteredResults.flatMap(result => result.suggestedDrugs);
  
  // Combine drugs with the same name
  const drugMap = new Map();
  allDrugs.forEach(drug => {
    if (!drugMap.has(drug.name)) {
      drugMap.set(drug.name, { ...drug });
    } else {
      const existingDrug = drugMap.get(drug.name);
      
      // Update best evidence level if this one is better
      const levels: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
      if ((levels[drug.bestEvidenceLevel.charAt(0)] || 0) > (levels[existingDrug.bestEvidenceLevel.charAt(0)] || 0)) {
        existingDrug.bestEvidenceLevel = drug.bestEvidenceLevel;
      }
      
      // Update evidence count
      existingDrug.evidenceCount += drug.evidenceCount;
      
      // Merge variants
      drug.variants.forEach(variant => {
        if (!existingDrug.variants.includes(variant)) {
          existingDrug.variants.push(variant);
        }
      });
      
      // Merge diseases
      drug.diseases.forEach(disease => {
        if (!existingDrug.diseases.includes(disease)) {
          existingDrug.diseases.push(disease);
        }
      });
      
      // Merge PMIDs (keep top 3)
      drug.topPmids.forEach(pmid => {
        if (!existingDrug.topPmids.includes(pmid) && existingDrug.topPmids.length < 3) {
          existingDrug.topPmids.push(pmid);
        }
      });
    }
  });
  
  // Convert map back to array and sort
  const filteredDrugs = Array.from(drugMap.values()).sort((a, b) => {
    // Sort by best evidence level (A is better than E)
    const levels: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
    const levelDiff = (levels[b.bestEvidenceLevel.charAt(0)] || 0) - (levels[a.bestEvidenceLevel.charAt(0)] || 0);
    if (levelDiff !== 0) return levelDiff;
    
    // Then by evidence count
    return b.evidenceCount - a.evidenceCount;
  });

  return { filteredResults, filteredDrugs };
}

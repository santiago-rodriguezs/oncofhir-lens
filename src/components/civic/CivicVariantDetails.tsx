'use client';

import { useState } from 'react';
import { CivicResult, CivicEvidence } from '@/lib/civic/client';
import { ChevronDownIcon, ChevronUpIcon, LinkIcon } from '@heroicons/react/24/outline';

interface CivicVariantDetailsProps {
  results: CivicResult[];
}

export default function CivicVariantDetails({ results }: CivicVariantDetailsProps) {
  const [openVariants, setOpenVariants] = useState<Record<string, boolean>>({});
  
  // Toggle variant accordion
  const toggleVariant = (variantKey: string) => {
    setOpenVariants(prev => ({
      ...prev,
      [variantKey]: !prev[variantKey]
    }));
  };
  
  // Format evidence direction and clinical significance
  const formatSignificance = (evidence: CivicEvidence) => {
    const direction = evidence.evidenceDirection;
    const significance = evidence.clinicalSignificance;
    
    if (direction === 'Supports' && significance === 'Sensitivity') {
      return 'Sensibilidad';
    } else if (direction === 'Supports' && significance === 'Resistance') {
      return 'Resistencia';
    } else if (direction === 'Does Not Support' && significance === 'Sensitivity') {
      return 'No sensible';
    } else if (direction === 'Does Not Support' && significance === 'Resistance') {
      return 'No resistente';
    }
    
    return `${direction} ${significance}`;
  };
  
  // Format evidence level with rating
  const formatEvidenceLevel = (evidence: CivicEvidence) => {
    return `${evidence.evidenceLevel}${evidence.evidenceRating}`;
  };
  
  // Format citation link
  const formatCitation = (evidence: CivicEvidence) => {
    const { citationId, url } = evidence.source;
    
    if (citationId.startsWith('PMID:')) {
      const pmid = citationId.replace('PMID:', '');
      return (
        <a
          href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-800 flex items-center"
        >
          <LinkIcon className="h-4 w-4 mr-1" />
          {citationId}
        </a>
      );
    }
    
    if (citationId.startsWith('DOI:')) {
      const doi = citationId.replace('DOI:', '');
      return (
        <a
          href={`https://doi.org/${doi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-800 flex items-center"
        >
          <LinkIcon className="h-4 w-4 mr-1" />
          {citationId}
        </a>
      );
    }
    
    if (url) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-800 flex items-center"
        >
          <LinkIcon className="h-4 w-4 mr-1" />
          {citationId || 'Fuente'}
        </a>
      );
    }
    
    return citationId || 'N/A';
  };
  
  // Filter out results with no evidences
  const resultsWithEvidence = results.filter(result => result.evidences.length > 0);
  
  if (resultsWithEvidence.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron detalles de variantes con los filtros actuales.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {resultsWithEvidence.map((result) => {
        const variantKey = `${result.annotation.geneSymbol}-${result.annotation.variant || result.annotation.hgvs || 'unknown'}`;
        const isOpen = openVariants[variantKey] || false;
        
        return (
          <div key={variantKey} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Variant header */}
            <div
              className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
              onClick={() => toggleVariant(variantKey)}
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {result.annotation.geneSymbol} {result.matchedVariant?.name || result.annotation.variant || result.annotation.hgvs}
                </h3>
                <p className="text-sm text-gray-500">
                  {result.evidences.length} evidencias • {result.suggestedDrugs.length} drogas
                </p>
              </div>
              <div>
                {isOpen ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
            
            {/* Variant content */}
            {isOpen && (
              <div className="px-4 py-3">
                {result.evidences.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay evidencias disponibles para esta variante.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Droga(s)
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Enfermedad
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Significancia
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nivel
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fuente
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aprobaciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.evidences.map((evidence) => (
                          <tr key={evidence.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {evidence.drugs.map(drug => drug.name).join(', ')}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {evidence.disease.name}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatSignificance(evidence)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                evidence.evidenceLevel === 'A' ? 'bg-green-100 text-green-800' :
                                evidence.evidenceLevel === 'B' ? 'bg-blue-100 text-blue-800' :
                                evidence.evidenceLevel === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                evidence.evidenceLevel === 'D' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {formatEvidenceLevel(evidence)}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatCitation(evidence)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {evidence.assertions && evidence.assertions.length > 0 ? (
                                <div className="space-y-1">
                                  {evidence.assertions.map((assertion, index) => (
                                    <div key={index}>
                                      {assertion.displayName}
                                      {assertion.approvals && assertion.approvals.length > 0 && (
                                        <span className="ml-1 text-xs text-green-600">
                                          ({assertion.approvals.map(a => a.regulatoryAgency).join(', ')})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

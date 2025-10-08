'use client';

import { useState } from 'react';
import { OncoKbAnnotation } from '@/lib/oncokb/client';
import { ChevronDownIcon, ChevronUpIcon, LinkIcon } from '@heroicons/react/24/outline';

interface OncoKbVariantDetailsProps {
  results: OncoKbAnnotation[];
}

export default function OncoKbVariantDetails({ results }: OncoKbVariantDetailsProps) {
  const [openVariants, setOpenVariants] = useState<Record<string, boolean>>({});
  
  // Toggle variant accordion
  const toggleVariant = (variantKey: string) => {
    setOpenVariants(prev => ({
      ...prev,
      [variantKey]: !prev[variantKey]
    }));
  };
  
  // Format level badge
  const formatLevelBadge = (level: string | null) => {
    if (!level) return null;
    
    let bgColor = 'bg-gray-100 text-gray-800';
    
    if (level === '1') {
      bgColor = 'bg-green-100 text-green-800';
    } else if (level === '2') {
      bgColor = 'bg-blue-100 text-blue-800';
    } else if (level === '3') {
      bgColor = 'bg-yellow-100 text-yellow-800';
    } else if (level === '4') {
      bgColor = 'bg-orange-100 text-orange-800';
    } else if (level.startsWith('R')) {
      bgColor = 'bg-red-100 text-red-800';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {level}
      </span>
    );
  };
  
  // Format PMID links
  const formatPmidLink = (pmid: string) => {
    return (
      <a
        href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 hover:text-primary-800 flex items-center"
      >
        <LinkIcon className="h-4 w-4 mr-1" />
        {pmid}
      </a>
    );
  };
  
  // Generate OncoKB link for variant
  const getOncoKbVariantLink = (result: OncoKbAnnotation) => {
    const { geneSymbol, variant } = result.query;
    
    if (!geneSymbol) return null;
    
    return `https://www.oncokb.org/gene/${encodeURIComponent(geneSymbol)}${variant ? `/variant/${encodeURIComponent(variant)}` : ''}`;
  };
  
  // Filter out results with no treatments or oncogenic info
  const resultsWithInfo = results.filter(result => 
    (result.treatments && result.treatments.length > 0) || 
    result.oncogenic || 
    result.hotspot || 
    result.geneSummary || 
    result.variantSummary
  );
  
  if (resultsWithInfo.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron detalles de variantes con los filtros actuales.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {resultsWithInfo.map((result) => {
        const variantKey = `${result.query.geneSymbol || ''}-${result.query.variant || result.query.hgvsg || 'unknown'}`;
        const isOpen = openVariants[variantKey] || false;
        const hasDetails = result.geneSummary || result.variantSummary || result.tumorTypeSummary || result.mutationEffect?.description;
        const hasTreatments = result.treatments && result.treatments.length > 0;
        
        return (
          <div key={variantKey} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Variant header */}
            <div
              className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
              onClick={() => toggleVariant(variantKey)}
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {result.query.geneSymbol} {result.query.variant || result.query.hgvsg}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {result.oncogenic && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      result.oncogenic.includes('Oncogenic') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {result.oncogenic}
                    </span>
                  )}
                  {result.hotspot && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Hotspot
                    </span>
                  )}
                  {result.highestSensitiveLevel && formatLevelBadge(result.highestSensitiveLevel)}
                  {result.highestResistanceLevel && formatLevelBadge(result.highestResistanceLevel)}
                </div>
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
              <div className="px-4 py-3 space-y-4">
                {/* Summaries */}
                {hasDetails && (
                  <div className="space-y-3">
                    {result.geneSummary && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Resumen del Gen</h4>
                        <p className="text-sm text-gray-600">{result.geneSummary}</p>
                      </div>
                    )}
                    
                    {result.variantSummary && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Resumen de la Variante</h4>
                        <p className="text-sm text-gray-600">{result.variantSummary}</p>
                      </div>
                    )}
                    
                    {result.tumorTypeSummary && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Resumen del Tipo de Tumor</h4>
                        <p className="text-sm text-gray-600">{result.tumorTypeSummary}</p>
                      </div>
                    )}
                    
                    {result.mutationEffect?.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Efecto de la Mutación: {result.mutationEffect.knownEffect || 'Desconocido'}
                        </h4>
                        <p className="text-sm text-gray-600">{result.mutationEffect.description}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Highest levels */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {result.highestSensitiveLevel && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-xs text-gray-500">Nivel Sensibilidad:</span>
                      <div className="font-medium">{formatLevelBadge(result.highestSensitiveLevel)}</div>
                    </div>
                  )}
                  
                  {result.highestResistanceLevel && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-xs text-gray-500">Nivel Resistencia:</span>
                      <div className="font-medium">{formatLevelBadge(result.highestResistanceLevel)}</div>
                    </div>
                  )}
                  
                  {result.highestDiagnosticImplicationLevel && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-xs text-gray-500">Nivel Diagnóstico:</span>
                      <div className="font-medium">{formatLevelBadge(result.highestDiagnosticImplicationLevel)}</div>
                    </div>
                  )}
                  
                  {result.highestPrognosticImplicationLevel && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-xs text-gray-500">Nivel Pronóstico:</span>
                      <div className="font-medium">{formatLevelBadge(result.highestPrognosticImplicationLevel)}</div>
                    </div>
                  )}
                </div>
                
                {/* Treatments table */}
                {hasTreatments && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tratamientos</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Droga
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nivel
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Indicación
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              PMIDs
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Resistencia
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {result.treatments?.map((treatment, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {treatment.drug}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {formatLevelBadge(treatment.level)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {treatment.indication || '-'}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {treatment.pmids && treatment.pmids.length > 0 ? (
                                  <div className="space-y-1">
                                    {treatment.pmids.slice(0, 3).map((pmid, idx) => (
                                      <div key={idx}>{formatPmidLink(pmid)}</div>
                                    ))}
                                    {treatment.pmids.length > 3 && (
                                      <span className="text-gray-500 text-xs">+{treatment.pmids.length - 3} más</span>
                                    )}
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {treatment.resistance ? (
                                  <span className="text-red-600 font-bold">Sí</span>
                                ) : (
                                  <span className="text-green-600">No</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Link to OncoKB */}
                {result.query.geneSymbol && (
                  <div className="mt-4">
                    <a
                      href={getOncoKbVariantLink(result)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 flex items-center text-sm"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Ver en OncoKB
                    </a>
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

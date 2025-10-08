'use client';

import { CivicResult, SuggestedDrug } from '@/lib/civic/client';

interface CivicSummaryCardsProps {
  results: CivicResult[];
  drugs: SuggestedDrug[];
}

export default function CivicSummaryCards({ results, drugs }: CivicSummaryCardsProps) {
  // Calculate total evidence count
  const totalEvidenceCount = results.reduce(
    (sum, result) => sum + result.evidences.length, 
    0
  );
  
  // Count unique drugs
  const uniqueDrugsCount = drugs.length;
  
  // Get best evidence levels present
  const allLevels = results
    .flatMap(result => result.evidences)
    .map(evidence => evidence.evidenceLevel)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();
  
  // Get top 3 drugs
  const topDrugs = drugs.slice(0, 3).map(drug => drug.name);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total evidence card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700">Total Evidencias</h3>
        <p className="text-3xl font-bold text-primary-600 mt-2">{totalEvidenceCount}</p>
        <p className="text-sm text-gray-500 mt-1">
          De {results.filter(r => r.matchedVariant).length} variantes encontradas
        </p>
      </div>
      
      {/* Unique drugs card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700">Drogas Únicas</h3>
        <p className="text-3xl font-bold text-primary-600 mt-2">{uniqueDrugsCount}</p>
        <p className="text-sm text-gray-500 mt-1">
          Con evidencia terapéutica
        </p>
      </div>
      
      {/* Evidence levels card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700">Niveles de Evidencia</h3>
        <div className="flex gap-2 mt-2">
          {allLevels.length > 0 ? (
            allLevels.map(level => (
              <span 
                key={level} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {level}
              </span>
            ))
          ) : (
            <span className="text-gray-500">No disponible</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          A (mejor) → E (peor)
        </p>
      </div>
      
      {/* Top drugs card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700">Top Drogas</h3>
        <div className="mt-2">
          {topDrugs.length > 0 ? (
            <ul className="space-y-1">
              {topDrugs.map((drug, index) => (
                <li key={drug} className="text-sm font-medium">
                  {index + 1}. {drug}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No disponible</p>
          )}
        </div>
      </div>
    </div>
  );
}

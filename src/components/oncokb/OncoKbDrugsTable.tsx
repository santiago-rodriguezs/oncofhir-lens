'use client';

import { useState } from 'react';
import { OncoKbSuggestedDrug } from '@/lib/oncokb/hooks';
import { LinkIcon } from '@heroicons/react/24/outline';

interface OncoKbDrugsTableProps {
  drugs: OncoKbSuggestedDrug[];
}

export default function OncoKbDrugsTable({ drugs }: OncoKbDrugsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof OncoKbSuggestedDrug>('bestLevel');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const itemsPerPage = 10;
  
  // Handle sort
  const handleSort = (field: keyof OncoKbSuggestedDrug) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Sort drugs
  const sortedDrugs = [...drugs].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'bestLevel') {
      // Map evidence levels to numeric values for sorting
      const levelValue = (level: string): number => {
        if (level.startsWith('R')) return parseInt(level.substring(1), 10);
        return parseInt(level, 10) || 0;
      };
      
      comparison = levelValue(a.bestLevel) - levelValue(b.bestLevel);
    } else if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'evidenceCount') {
      comparison = a.evidenceCount - b.evidenceCount;
    } else if (sortField === 'variants') {
      comparison = a.variants.length - b.variants.length;
    } else if (sortField === 'indications') {
      comparison = a.indications.length - b.indications.length;
    } else if (sortField === 'pmids') {
      comparison = a.pmids.length - b.pmids.length;
    } else if (sortField === 'hasResistance') {
      comparison = a.hasResistance ? 1 : 0 - (b.hasResistance ? 1 : 0);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Paginate drugs
  const totalPages = Math.ceil(sortedDrugs.length / itemsPerPage);
  const paginatedDrugs = sortedDrugs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Format level badge
  const formatLevelBadge = (level: string) => {
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
  
  return (
    <div>
      {drugs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No se encontraron drogas con los filtros actuales.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Droga
                    {sortField === 'name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('bestLevel')}
                  >
                    Mejor Nivel
                    {sortField === 'bestLevel' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('evidenceCount')}
                  >
                    # Evidencias
                    {sortField === 'evidenceCount' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('indications')}
                  >
                    Indicaciones
                    {sortField === 'indications' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('pmids')}
                  >
                    PMIDs
                    {sortField === 'pmids' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link OncoKB
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('hasResistance')}
                  >
                    ⚠︎ R
                    {sortField === 'hasResistance' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedDrugs.map((drug) => (
                  <tr key={drug.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {drug.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLevelBadge(drug.bestLevel)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {drug.evidenceCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={drug.indications.join(', ')}>
                        {drug.indications.slice(0, 2).join(', ')}
                        {drug.indications.length > 2 && ` (+${drug.indications.length - 2} más)`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {drug.pmids.length > 0 ? (
                        <div className="space-x-1">
                          {drug.pmids.slice(0, 2).map((pmid, index) => (
                            <a
                              key={index}
                              href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800"
                            >
                              {pmid.length > 10 ? `${pmid.substring(0, 7)}...` : pmid}
                            </a>
                          ))}
                          {drug.pmids.length > 2 && (
                            <span className="text-gray-500">+{drug.pmids.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a
                        href={drug.oncokbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 flex items-center"
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        OncoKB
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {drug.hasResistance && (
                        <span className="text-red-600 font-bold" title="Tiene evidencia de resistencia">⚠︎</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border border-gray-300 ${
                      currentPage === page
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    } text-sm font-medium`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}

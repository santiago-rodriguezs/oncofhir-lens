'use client';

import { useState, useEffect } from 'react';
import { getAllOncoTreeCodes } from '@/lib/oncokb/oncotree';

interface OncoKbFilterBarProps {
  filters: {
    tumorType: string;
    evidenceType: 'sensitive' | 'resistance' | 'all';
    levels: string[];
  };
  availableLevels: string[];
  onFilterChange: (filters: OncoKbFilterBarProps['filters']) => void;
}

export default function OncoKbFilterBar({ filters, onFilterChange, availableLevels }: OncoKbFilterBarProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const oncoTreeCodes = getAllOncoTreeCodes();
  
  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setLocalFilters(prev => {
      return { ...prev, [name]: value };
    });
  };
  
  // Handle evidence type selection
  const handleEvidenceTypeChange = (type: 'sensitive' | 'resistance' | 'all') => {
    setLocalFilters(prev => ({
      ...prev,
      evidenceType: type
    }));
  };
  
  // Handle level selection
  const handleLevelChange = (level: string) => {
    setLocalFilters(prev => {
      const newLevels = prev.levels.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...prev.levels, level];
      
      return { ...prev, levels: newLevels };
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(localFilters);
  };
  
  // Reset filters
  const resetFilters = () => {
    const resetFilters = {
      tumorType: '',
      evidenceType: 'all' as const,
      levels: [],
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex flex-wrap gap-4">
        {/* Tumor type filter */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="tumorType" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Tumor (OncoTree)
          </label>
          <select
            id="tumorType"
            name="tumorType"
            value={localFilters.tumorType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="">Todos los tipos</option>
            {oncoTreeCodes.map(code => (
              <option key={code.code} value={code.code}>
                {code.name} ({code.mainType})
              </option>
            ))}
          </select>
        </div>
        
        {/* Evidence type filter */}
        <div className="flex-1 min-w-[200px]">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Evidencia
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleEvidenceTypeChange('all')}
              className={`px-3 py-1 text-sm rounded-full ${
                localFilters.evidenceType === 'all'
                  ? 'bg-primary-100 text-primary-800 border-primary-300'
                  : 'bg-gray-100 text-gray-800 border-gray-300'
              } border`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleEvidenceTypeChange('sensitive')}
              className={`px-3 py-1 text-sm rounded-full ${
                localFilters.evidenceType === 'sensitive'
                  ? 'bg-primary-100 text-primary-800 border-primary-300'
                  : 'bg-gray-100 text-gray-800 border-gray-300'
              } border`}
            >
              Sensibilidad
            </button>
            <button
              type="button"
              onClick={() => handleEvidenceTypeChange('resistance')}
              className={`px-3 py-1 text-sm rounded-full ${
                localFilters.evidenceType === 'resistance'
                  ? 'bg-primary-100 text-primary-800 border-primary-300'
                  : 'bg-gray-100 text-gray-800 border-gray-300'
              } border`}
            >
              Resistencia
            </button>
          </div>
        </div>
        
        {/* Level filter */}
        <div className="flex-1 min-w-[200px]">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Nivel de Evidencia
          </span>
          <div className="flex flex-wrap gap-2">
            {['1', '2', '3', '4', 'R1', 'R2'].filter(level => 
              availableLevels.length === 0 || availableLevels.includes(level)
            ).map(level => (
              <button
                key={level}
                type="button"
                onClick={() => handleLevelChange(level)}
                className={`px-3 py-1 text-sm rounded-full ${
                  localFilters.levels.includes(level)
                    ? 'bg-primary-100 text-primary-800 border-primary-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300'
                } border`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-end space-x-2">
          <button
            type="button"
            onClick={applyFilters}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Resetear
          </button>
        </div>
      </div>
    </div>
  );
}

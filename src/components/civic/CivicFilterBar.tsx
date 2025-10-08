'use client';

import { useState, useEffect } from 'react';

interface CivicFilterBarProps {
  filters: {
    tumorType: string;
    evidenceLevel: string[];
    onlyFdaApproved: boolean;
    predictiveOnly: boolean;
  };
  onFilterChange: (filters: CivicFilterBarProps['filters']) => void;
}

export default function CivicFilterBar({ filters, onFilterChange }: CivicFilterBarProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setLocalFilters(prev => {
      if (type === 'checkbox') {
        return { ...prev, [name]: checked };
      }
      return { ...prev, [name]: value };
    });
  };
  
  // Handle evidence level selection
  const handleEvidenceLevelChange = (level: string) => {
    setLocalFilters(prev => {
      const newLevels = prev.evidenceLevel.includes(level)
        ? prev.evidenceLevel.filter(l => l !== level)
        : [...prev.evidenceLevel, level];
      
      return { ...prev, evidenceLevel: newLevels };
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
      evidenceLevel: [],
      onlyFdaApproved: false,
      predictiveOnly: true,
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
            Tipo de Tumor
          </label>
          <input
            type="text"
            id="tumorType"
            name="tumorType"
            value={localFilters.tumorType}
            onChange={handleInputChange}
            placeholder="Ej: lung, breast, melanoma..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        
        {/* Evidence level filter */}
        <div className="flex-1 min-w-[200px]">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Nivel de Evidencia
          </span>
          <div className="flex flex-wrap gap-2">
            {['A', 'B', 'C', 'D', 'E'].map(level => (
              <button
                key={level}
                type="button"
                onClick={() => handleEvidenceLevelChange(level)}
                className={`px-3 py-1 text-sm rounded-full ${
                  localFilters.evidenceLevel.includes(level)
                    ? 'bg-primary-100 text-primary-800 border-primary-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300'
                } border`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        
        {/* Checkbox filters */}
        <div className="flex-1 min-w-[200px]">
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="onlyFdaApproved"
                name="onlyFdaApproved"
                checked={localFilters.onlyFdaApproved}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="onlyFdaApproved" className="ml-2 block text-sm text-gray-700">
                Solo FDA/Guidelines
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="predictiveOnly"
                name="predictiveOnly"
                checked={localFilters.predictiveOnly}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="predictiveOnly" className="ml-2 block text-sm text-gray-700">
                Solo Predictivo
              </label>
            </div>
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

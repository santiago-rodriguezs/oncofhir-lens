'use client';

import React, { useState, useMemo } from 'react';
import { Annotation } from '@/lib/schemas';

// Tipos de categorías para agrupar las anotaciones
type CategoryType = 'oncogenicity' | 'cancerType' | 'evidenceLevel' | 'gene' | 'all';

interface EnhancedAnnotationsViewProps {
  annotations: Annotation[];
}

const EnhancedAnnotationsView: React.FC<EnhancedAnnotationsViewProps> = ({ annotations }) => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Extraer todos los valores únicos para cada categoría
  const categories = useMemo(() => {
    const oncogenicitySet = new Set<string>();
    const cancerTypeSet = new Set<string>();
    const evidenceLevelSet = new Set<string>();
    const geneSet = new Set<string>();

    annotations.forEach(annotation => {
      if (annotation.oncogenicity) oncogenicitySet.add(annotation.oncogenicity);
      if (annotation.cancerTypes && annotation.cancerTypes.length > 0) {
        annotation.cancerTypes.forEach(ct => cancerTypeSet.add(ct));
      }
      if (annotation.evidenceLevel) evidenceLevelSet.add(annotation.evidenceLevel);
      if (annotation.gene) geneSet.add(annotation.gene);
    });

    return {
      oncogenicity: Array.from(oncogenicitySet).sort(),
      cancerType: Array.from(cancerTypeSet).sort(),
      evidenceLevel: Array.from(evidenceLevelSet).sort((a, b) => {
        // Ordenar niveles de evidencia (1 es mejor que 2, etc.)
        if (a === 'Unknown') return 1;
        if (b === 'Unknown') return -1;
        return a.localeCompare(b);
      }),
      gene: Array.from(geneSet).sort(),
    };
  }, [annotations]);

  // Filtrar anotaciones según la categoría activa y término de búsqueda
  const filteredAnnotations = useMemo(() => {
    return annotations.filter(annotation => {
      // Filtrar por término de búsqueda
      if (searchTerm && !annotation.gene?.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !annotation.variant?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Si no hay categoría activa o es "all", mostrar todo
      if (!activeCategory || activeCategory === 'all') {
        return true;
      }
      
      // Filtrar por categoría específica
      switch (activeCategory) {
        case 'oncogenicity':
          return !!annotation.oncogenicity;
        case 'cancerType':
          return annotation.cancerTypes && annotation.cancerTypes.length > 0;
        case 'evidenceLevel':
          return !!annotation.evidenceLevel;
        case 'gene':
          return !!annotation.gene;
        default:
          return true;
      }
    });
  }, [annotations, activeCategory, searchTerm]);

  // Función para obtener el color de fondo según la oncogenicidad
  const getOncogenicityColor = (oncogenicity: string | undefined) => {
    if (!oncogenicity) return 'bg-gray-100';
    
    switch (oncogenicity.toLowerCase()) {
      case 'oncogenic':
        return 'bg-red-100';
      case 'likely oncogenic':
        return 'bg-orange-100';
      case 'unknown':
        return 'bg-gray-100';
      default:
        return 'bg-gray-100';
    }
  };

  // Función para obtener el color de fondo según el nivel de evidencia
  const getEvidenceLevelColor = (level: string | undefined) => {
    if (!level) return 'bg-gray-100';
    
    if (level === '1') return 'bg-green-100';
    if (level === '2') return 'bg-lime-100';
    if (level === '3') return 'bg-yellow-100';
    if (level === '4') return 'bg-orange-100';
    return 'bg-gray-100';
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Anotaciones Enriquecidas ({filteredAnnotations.length})</h2>
        
        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Buscar por gen o variante..."
              className="w-full px-4 py-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded-md ${activeCategory === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveCategory('all')}
            >
              Todos
            </button>
            <button
              className={`px-3 py-1 rounded-md ${activeCategory === 'oncogenicity' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveCategory('oncogenicity')}
            >
              Oncogenicidad
            </button>
            <button
              className={`px-3 py-1 rounded-md ${activeCategory === 'cancerType' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveCategory('cancerType')}
            >
              Tipos de Cáncer
            </button>
            <button
              className={`px-3 py-1 rounded-md ${activeCategory === 'evidenceLevel' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveCategory('evidenceLevel')}
            >
              Nivel de Evidencia
            </button>
            <button
              className={`px-3 py-1 rounded-md ${activeCategory === 'gene' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveCategory('gene')}
            >
              Genes
            </button>
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700">Genes</h3>
            <p className="text-2xl font-bold">{categories.gene.length}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {categories.gene.slice(0, 5).map(gene => (
                <span key={gene} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {gene}
                </span>
              ))}
              {categories.gene.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                  +{categories.gene.length - 5} más
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700">Oncogenicidad</h3>
            <p className="text-2xl font-bold">{categories.oncogenicity.length}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {categories.oncogenicity.map(onc => (
                <span key={onc} className={`px-2 py-1 ${getOncogenicityColor(onc)} rounded text-xs`}>
                  {onc}
                </span>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700">Tipos de Cáncer</h3>
            <p className="text-2xl font-bold">{categories.cancerType.length}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {categories.cancerType.slice(0, 5).map(ct => (
                <span key={ct} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  {ct}
                </span>
              ))}
              {categories.cancerType.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                  +{categories.cancerType.length - 5} más
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700">Niveles de Evidencia</h3>
            <p className="text-2xl font-bold">{categories.evidenceLevel.length}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {categories.evidenceLevel.map(level => (
                <span key={level} className={`px-2 py-1 ${getEvidenceLevelColor(level)} rounded text-xs`}>
                  {level}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabla de anotaciones */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">Gen</th>
              <th className="py-2 px-4 border-b text-left">Variante</th>
              <th className="py-2 px-4 border-b text-left">Oncogenicidad</th>
              <th className="py-2 px-4 border-b text-left">Tipos de Cáncer</th>
              <th className="py-2 px-4 border-b text-left">Nivel de Evidencia</th>
              <th className="py-2 px-4 border-b text-left">Accionabilidad</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnnotations.map((annotation, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-2 px-4 border-b">
                  <span className="font-medium">{annotation.gene || 'N/A'}</span>
                </td>
                <td className="py-2 px-4 border-b">{annotation.variant || 'N/A'}</td>
                <td className="py-2 px-4 border-b">
                  <span className={`px-2 py-1 rounded ${getOncogenicityColor(annotation.oncogenicity)}`}>
                    {annotation.oncogenicity || 'Unknown'}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  <div className="flex flex-wrap gap-1">
                    {annotation.cancerTypes && annotation.cancerTypes.length > 0 ? 
                      annotation.cancerTypes.map((ct, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          {ct}
                        </span>
                      )) : 
                      <span className="text-gray-500">N/A</span>
                    }
                  </div>
                </td>
                <td className="py-2 px-4 border-b">
                  {annotation.evidenceLevel ? (
                    <span className={`px-2 py-1 rounded ${getEvidenceLevelColor(annotation.evidenceLevel)}`}>
                      {annotation.evidenceLevel}
                    </span>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  {annotation.actionability && annotation.actionability.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {annotation.actionability.map((action, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="font-medium">{action.drug}</span>
                          {action.level && (
                            <span className={`px-2 py-0.5 rounded text-xs ${getEvidenceLevelColor(action.level)}`}>
                              {action.level}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnhancedAnnotationsView;

'use client';

import React, { useState } from 'react';

// Tipos básicos para recursos FHIR
interface FhirResource {
  resourceType: string;
  id?: string;
}

interface FhirBundle {
  resourceType: 'Bundle';
  id?: string;
  type?: string;
  entry?: Array<{
    resource: FhirResource;
  }>;
}

interface FhirBundleViewerProps {
  bundle: FhirBundle;
}

const FhirBundleViewer: React.FC<FhirBundleViewerProps> = ({ bundle }) => {
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');

  // Extract resources from bundle
  const resources: FhirResource[] = (bundle.entry || []).map(entry => entry.resource);

  // Get unique resource types
  const resourceTypes = Array.from(
    new Set(resources.map(resource => resource.resourceType))
  ).sort();

  // Filter resources based on search and type filter
  const filteredResources = resources.filter((resource) => {
    // Filter by resource type
    if (resourceTypeFilter !== 'all' && resource.resourceType !== resourceTypeFilter) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const resourceString = JSON.stringify(resource).toLowerCase();
      return resourceString.includes(searchTerm.toLowerCase());
    }

    return true;
  });

  // Group resources by type
  const resourcesByType = filteredResources.reduce<Record<string, FhirResource[]>>((acc, resource) => {
    const type = resource.resourceType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(resource);
    return acc;
  }, {});

  // Interfaces para diferentes tipos de recursos FHIR
  interface PatientResource extends FhirResource {
    resourceType: 'Patient';
    name?: Array<{
      family?: string;
      given?: string[];
    }>;
  }

  interface ObservationResource extends FhirResource {
    resourceType: 'Observation';
    code?: {
      coding?: Array<{
        display?: string;
      }>;
      text?: string;
    };
    valueString?: string;
    valueQuantity?: {
      value?: number | string;
    };
  }

  interface ConditionResource extends FhirResource {
    resourceType: 'Condition';
    code?: {
      coding?: Array<{
        display?: string;
      }>;
      text?: string;
    };
  }

  interface SpecimenResource extends FhirResource {
    resourceType: 'Specimen';
    type?: {
      coding?: Array<{
        display?: string;
      }>;
    };
    collection?: {
      collectedDateTime?: string;
    };
  }

  interface DiagnosticReportResource extends FhirResource {
    resourceType: 'DiagnosticReport';
    code?: {
      coding?: Array<{
        display?: string;
      }>;
      text?: string;
    };
  }

  // Function to get a summary of a resource
  const getResourceSummary = (resource: FhirResource): string => {
    switch (resource.resourceType) {
      case 'Patient': {
        const patientResource = resource as PatientResource;
        return `${patientResource.name?.[0]?.family || ''}, ${patientResource.name?.[0]?.given?.join(' ') || ''}`;
      }
      case 'Observation': {
        const obsResource = resource as ObservationResource;
        return `${obsResource.code?.coding?.[0]?.display || obsResource.code?.text || 'Observation'}: ${obsResource.valueString || obsResource.valueQuantity?.value || ''}`;
      }
      case 'Condition': {
        const conditionResource = resource as ConditionResource;
        return conditionResource.code?.coding?.[0]?.display || conditionResource.code?.text || 'Condition';
      }
      case 'Specimen': {
        const specimenResource = resource as SpecimenResource;
        return `${specimenResource.type?.coding?.[0]?.display || 'Specimen'} (${specimenResource.collection?.collectedDateTime || ''})`;
      }
      case 'DiagnosticReport': {
        const reportResource = resource as DiagnosticReportResource;
        return reportResource.code?.coding?.[0]?.display || reportResource.code?.text || 'Report';
      }
      default:
        return `${resource.resourceType} ${resource.id || ''}`;
    }
  };

  // Function to copy a resource to clipboard
  const copyToClipboard = (resource: FhirResource) => {
    navigator.clipboard.writeText(JSON.stringify(resource, null, 2));
    alert(`${resource.resourceType} copiado al portapapeles`);
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Buscar en el bundle..."
            className="w-full px-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="px-4 py-2 border rounded-md w-full md:w-auto"
            value={resourceTypeFilter}
            onChange={(e) => setResourceTypeFilter(e.target.value)}
          >
            <option value="all">Todos los recursos</option>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md mb-4">
        <h3 className="text-lg font-semibold mb-2">Resumen del Bundle</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-sm text-gray-500">Total de recursos</p>
            <p className="text-xl font-bold">{resources.length}</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-sm text-gray-500">Tipos de recursos</p>
            <p className="text-xl font-bold">{resourceTypes.length}</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-sm text-gray-500">ID del Bundle</p>
            <p className="text-xl font-bold truncate">{bundle.id || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(resourcesByType).map(([type, typeResources]) => (
          <div key={type} className="border rounded-md overflow-hidden">
            <div className="bg-blue-50 px-4 py-2 flex justify-between items-center">
              <h3 className="font-semibold">
                {type} ({typeResources.length})
              </h3>
            </div>
            <div className="divide-y">
              {typeResources.map((resource: FhirResource, index: number) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{getResourceSummary(resource)}</p>
                      <p className="text-sm text-gray-500">ID: {resource.id}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        onClick={() => setExpandedResource(expandedResource === resource.id ? null : resource.id)}
                      >
                        {expandedResource === resource.id ? 'Cerrar' : 'Ver'}
                      </button>
                      <button
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        onClick={() => copyToClipboard(resource)}
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                  
                  {expandedResource === resource.id && (
                    <div className="mt-4 bg-gray-100 p-3 rounded overflow-auto max-h-96">
                      <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(resource, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron recursos que coincidan con los criterios de búsqueda.
        </div>
      )}
    </div>
  );
};

export default FhirBundleViewer;

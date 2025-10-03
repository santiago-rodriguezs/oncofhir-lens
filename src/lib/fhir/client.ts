import getConfig from 'next/config';

// Get server-side runtime config
const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };

// FHIR Client Configuration
export interface FhirClientConfig {
  projectId: string;
  location: string;
  datasetId: string;
  fhirStoreId: string;
}

// Default configuration from environment variables
const defaultConfig: FhirClientConfig = {
  projectId: serverRuntimeConfig.googleProjectId || process.env.GOOGLE_PROJECT_ID || '',
  location: serverRuntimeConfig.googleLocation || process.env.GOOGLE_LOCATION || '',
  datasetId: serverRuntimeConfig.healthcareDataset || process.env.HEALTHCARE_DATASET || '',
  fhirStoreId: serverRuntimeConfig.fhirStore || process.env.FHIR_STORE || '',
};

/**
 * Creates a FHIR client for Google Healthcare API
 * @param config - Optional configuration to override defaults
 * @returns FHIR client object with CRUD operations
 */
export function fhirClient(config: Partial<FhirClientConfig> = {}) {
  const fullConfig = { ...defaultConfig, ...config };
  
  // Validate configuration
  if (!fullConfig.projectId || !fullConfig.location || !fullConfig.datasetId || !fullConfig.fhirStoreId) {
    throw new Error('Missing FHIR client configuration. Check environment variables.');
  }
  
  const baseUrl = `https://healthcare.googleapis.com/v1/projects/${fullConfig.projectId}/locations/${fullConfig.location}/datasets/${fullConfig.datasetId}/fhirStores/${fullConfig.fhirStoreId}/fhir`;
  
  // Helper function to get auth token (using Application Default Credentials)
  async function getAuthToken() {
    try {
      // For demo purposes, we'll use a simple token
      // In production, you would use Google Auth Library properly
      
      // Demo implementation for local development
      if (process.env.NODE_ENV === 'development') {
        return 'DEMO_TOKEN';
      }
      
      // In production, you would use:
      // const {auth} = require('@googleapis/healthcare');
      // const authClient = await auth.getClient();
      // const token = await authClient.getAccessToken();
      // return token?.token || '';
      
      return 'DEMO_TOKEN';
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw new Error('Failed to authenticate with Google Healthcare API');
    }
  }
  
  // Generic FHIR API request function
  async function fhirRequest<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const token = await getAuthToken();
    const url = `${baseUrl}/${path}`;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/fhir+json',
    };
    
    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FHIR API error (${response.status}): ${errorText}`);
      }
      
      if (response.status === 204) {
        return {} as T; // No content
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error('FHIR request failed:', error);
      throw error;
    }
  }
  
  return {
    // CRUD operations
    create: <T>(resourceType: string, resource: any) => 
      fhirRequest<T>('POST', resourceType, resource),
    
    read: <T>(resourceType: string, id: string) => 
      fhirRequest<T>('GET', `${resourceType}/${id}`),
    
    update: <T>(resourceType: string, id: string, resource: any) => 
      fhirRequest<T>('PUT', `${resourceType}/${id}`, resource),
    
    delete: <T>(resourceType: string, id: string) => 
      fhirRequest<T>('DELETE', `${resourceType}/${id}`),
    
    // Search
    search: <T>(resourceType: string, params: Record<string, string>) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value);
      });
      
      return fhirRequest<T>('GET', `${resourceType}?${searchParams.toString()}`);
    },
  };
}

/**
 * Helper function to search for resources and extract them from bundle
 * @param resourceType - FHIR resource type to search for
 * @param params - Search parameters
 * @returns Array of resources from the bundle
 */
export async function searchBundle(resourceType: string, params: Record<string, string> = {}) {
  const client = fhirClient();
  
  try {
    const bundle = await client.search<any>(resourceType, params);
    
    if (!bundle || !bundle.entry) {
      return [];
    }
    
    return bundle.entry.map((entry: any) => entry.resource);
  } catch (error) {
    console.error(`Error searching ${resourceType}:`, error);
    throw error;
  }
}

/**
 * HAPI FHIR Server client
 * Connects to a local or remote HAPI FHIR R4 server
 */

const HAPI_BASE_URL = process.env.HAPI_FHIR_URL || 'http://localhost:8080/fhir';

export interface FhirSearchBundle {
  resourceType: 'Bundle';
  type: 'searchset';
  total?: number;
  entry?: Array<{
    fullUrl?: string;
    resource: Record<string, unknown>;
  }>;
}

/**
 * POST a FHIR Bundle (transaction/collection) to the HAPI server.
 * Converts collection bundles to transaction bundles for HAPI compatibility.
 */
export async function pushBundleToHapi(bundle: Record<string, unknown>): Promise<Record<string, unknown>> {
  // HAPI expects transaction bundles for batch processing
  const transactionBundle = {
    ...bundle,
    type: 'transaction',
    entry: ((bundle.entry as any[]) || []).map((entry: any) => ({
      ...entry,
      request: {
        method: 'POST',
        url: entry.resource?.resourceType || 'Resource',
      },
    })),
  };

  const res = await fetch(HAPI_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/fhir+json' },
    body: JSON.stringify(transactionBundle),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HAPI FHIR error (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * Search for resources on the HAPI server
 */
export async function searchHapi(
  resourceType: string,
  params?: Record<string, string>
): Promise<FhirSearchBundle> {
  const searchParams = new URLSearchParams(params);
  const url = `${HAPI_BASE_URL}/${resourceType}?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/fhir+json' },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HAPI FHIR search error (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * Read a single resource by ID
 */
export async function readHapiResource(
  resourceType: string,
  id: string
): Promise<Record<string, unknown>> {
  const url = `${HAPI_BASE_URL}/${resourceType}/${id}`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/fhir+json' },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HAPI FHIR read error (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * Get everything related to a Patient ($everything operation)
 */
export async function getPatientEverything(patientId: string): Promise<FhirSearchBundle> {
  const url = `${HAPI_BASE_URL}/Patient/${patientId}/$everything`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/fhir+json' },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HAPI FHIR $everything error (${res.status}): ${text}`);
  }

  return res.json();
}

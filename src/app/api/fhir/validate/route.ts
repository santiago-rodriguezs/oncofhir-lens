import { NextRequest, NextResponse } from 'next/server';
import { CaseService } from '@/lib/cases/service';
import { buildGenomicReportBundle } from '@/lib/fhir/genomics-reporting';

export const runtime = 'nodejs';

const HAPI_BASE_URL = process.env.HAPI_FHIR_URL || 'http://localhost:8080/fhir';

/**
 * POST /api/fhir/validate
 * Validate a FHIR bundle against the HAPI FHIR $validate operation
 */
export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
    }

    const caseData = await CaseService.get(caseId);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Build the bundle
    const bundle = buildGenomicReportBundle({
      caseId,
      patient: { id: caseData.metadata.patientId },
      specimen: { id: caseData.metadata.sampleId },
      variants: caseData.variants,
      evidence: caseData.evidence,
      therapies: caseData.therapies,
      tumorType: caseData.metadata.tumorType,
      reportSource: caseData.metadata.reportSource,
    });

    // Validate each resource individually against HAPI FHIR
    const entries = (bundle.entry || []) as Array<{ fullUrl: string; resource: Record<string, unknown> }>;
    const results: Array<{
      resourceType: string;
      id: string;
      valid: boolean;
      issues: Array<{ severity: string; diagnostics: string; location?: string }>;
    }> = [];

    for (const entry of entries) {
      const resource = entry.resource;
      const resourceType = resource.resourceType as string;

      try {
        const res = await fetch(`${HAPI_BASE_URL}/${resourceType}/$validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/fhir+json' },
          body: JSON.stringify(resource),
        });

        const outcome = await res.json();
        const issues = (outcome.issue || []).map((issue: any) => ({
          severity: issue.severity,
          diagnostics: issue.diagnostics || issue.details?.text || '',
          location: issue.expression?.join(', ') || issue.location?.join(', ') || '',
        }));

        const hasErrors = issues.some(
          (i: any) => i.severity === 'error' || i.severity === 'fatal'
        );

        results.push({
          resourceType,
          id: (resource.id as string) || 'unknown',
          valid: !hasErrors,
          issues,
        });
      } catch (err) {
        results.push({
          resourceType,
          id: (resource.id as string) || 'unknown',
          valid: false,
          issues: [
            {
              severity: 'error',
              diagnostics: `Validation request failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
            },
          ],
        });
      }
    }

    const totalResources = results.length;
    const validResources = results.filter((r) => r.valid).length;
    const invalidResources = totalResources - validResources;

    // Group issues by severity
    const allIssues = results.flatMap((r) => r.issues);
    const severityCounts = {
      error: allIssues.filter((i) => i.severity === 'error' || i.severity === 'fatal').length,
      warning: allIssues.filter((i) => i.severity === 'warning').length,
      information: allIssues.filter((i) => i.severity === 'information').length,
    };

    return NextResponse.json({
      valid: invalidResources === 0,
      summary: {
        totalResources,
        validResources,
        invalidResources,
        severityCounts,
      },
      results,
    });
  } catch (error) {
    console.error('Error validating FHIR bundle:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Validation failed' },
      { status: 500 }
    );
  }
}

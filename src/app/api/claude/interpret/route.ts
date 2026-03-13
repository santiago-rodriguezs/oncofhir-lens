import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Variant } from '@/core/models';
import { interpretVariants } from '@/lib/claude';
import { CaseService } from '@/lib/cases/service';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  caseId: z.string().optional(),
  variants: z.array(Variant),
  context: z
    .object({
      tumorType: z.string().optional(),
      stage: z.string().optional(),
      priorTherapies: z.array(z.string()).optional(),
    })
    .optional(),
});

function stripNulls(obj: any): any {
  if (obj === null) return undefined;
  if (Array.isArray(obj)) return obj.map(stripNulls);
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, stripNulls(v)])
    );
  }
  return obj;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, variants, context } = RequestSchema.parse(stripNulls(body));

    console.log(
      `[Claude Interpret] Interpreting ${variants.length} variants`
    );

    const model = request.headers.get('x-claude-model') || undefined;
    const interpretations = await interpretVariants(variants, context, model);

    console.log(
      `[Claude Interpret] Generated ${interpretations.length} interpretations`
    );

    // Cache interpretations in MongoDB (merge with existing)
    if (caseId && interpretations.length > 0) {
      const existing = await CaseService.get(caseId);
      const cached = existing?.cachedInterpretations || [];
      // For batch: replace all. For single: merge by gene+variant
      if (variants.length > 1) {
        await CaseService.update(caseId, { cachedInterpretations: interpretations });
      } else {
        const key = `${interpretations[0].gene}:${interpretations[0].variant}`;
        const filtered = cached.filter((c: any) => `${c.gene}:${c.variant}` !== key);
        filtered.push(interpretations[0]);
        await CaseService.update(caseId, { cachedInterpretations: filtered });
      }
      console.log(`[Claude Interpret] Interpretations cached for case ${caseId}`);
    }

    return NextResponse.json({ interpretations }, { status: 200 });
  } catch (error) {
    console.error('[Claude Interpret] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

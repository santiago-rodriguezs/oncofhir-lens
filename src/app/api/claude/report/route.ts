import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Variant, Evidence, Therapy } from '@/core/models';
import { generateGenomicReport } from '@/lib/claude';
import { ClinicalInterpretationSchema } from '@/lib/claude/schemas';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  variants: z.array(Variant),
  evidence: z.array(Evidence).optional(),
  therapies: z.array(Therapy).optional(),
  interpretations: z.array(ClinicalInterpretationSchema).optional(),
  context: z
    .object({
      tumorType: z.string().optional(),
      stage: z.string().optional(),
      sampleType: z.string().optional(),
      reportSource: z.string().optional(),
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
    const { variants, evidence, therapies, interpretations, context } =
      RequestSchema.parse(stripNulls(body));

    console.log(
      `[Claude Report] Generating report for ${variants.length} variants`
    );

    const model = request.headers.get('x-claude-model') || undefined;
    const report = await generateGenomicReport({
      variants,
      evidence,
      therapies,
      interpretations,
      context,
      model,
    });

    console.log('[Claude Report] Report generated successfully');

    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    console.error('[Claude Report] Error:', error);

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

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Variant } from '@/core/models';
import { interpretVariants } from '@/lib/claude';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  variants: z.array(Variant),
  context: z
    .object({
      tumorType: z.string().optional(),
      stage: z.string().optional(),
      priorTherapies: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variants, context } = RequestSchema.parse(body);

    console.log(
      `[Claude Interpret] Interpreting ${variants.length} variants`
    );

    const model = request.headers.get('x-claude-model') || undefined;
    const interpretations = await interpretVariants(variants, context, model);

    console.log(
      `[Claude Interpret] Generated ${interpretations.length} interpretations`
    );

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

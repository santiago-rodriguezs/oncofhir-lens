import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Variant, Evidence, Therapy } from '@/core/models';
import { askTumorBoard } from '@/lib/claude';
import { TumorBoardMessageSchema } from '@/lib/claude/schemas';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  question: z.string().min(1),
  history: z.array(TumorBoardMessageSchema).default([]),
  variants: z.array(Variant),
  evidence: z.array(Evidence).optional(),
  therapies: z.array(Therapy).optional(),
  tumorType: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, history, variants, evidence, therapies, tumorType } =
      RequestSchema.parse(body);

    console.log(`[Claude Chat] Question: "${question.slice(0, 80)}..."`);

    const model = request.headers.get('x-claude-model') || undefined;
    const response = await askTumorBoard({
      question,
      history,
      variants,
      evidence,
      therapies,
      tumorType,
      model,
    });

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error('[Claude Chat] Error:', error);

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

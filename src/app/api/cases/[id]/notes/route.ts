import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CaseService } from '@/lib/cases/service';

// Request body schema
const RequestSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get case data
    const caseData = await CaseService.get(id);
    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { content } = RequestSchema.parse(body);

    // Create note entry
    const note = {
      id: `note_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'note' as const,
      content,
      user: 'User', // TODO: Get from auth context
    };

    // Update case with new note
    const updatedCase = await CaseService.update(id, {
      auditEntries: [...(caseData.auditEntries || []), note],
    });

    if (!updatedCase) {
      return NextResponse.json(
        { error: 'Failed to update case' },
        { status: 500 }
      );
    }

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error adding note:', error);

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

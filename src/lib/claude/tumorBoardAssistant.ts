import { Variant, Evidence, Therapy } from '@/core/models';
import { getAnthropic } from '@/lib/sonnet';
import { TumorBoardMessage } from './schemas';

const MODEL = 'claude-sonnet-4-6-20250828';

const SYSTEM_PROMPT_TEMPLATE = `You are a molecular tumor board assistant for an oncology genomics platform.

You have access to the patient's genomic data shown below. Answer questions about:
- Variant interpretation and classification
- Drug-gene interactions and resistance mechanisms
- Clinical trial eligibility based on molecular profile
- Treatment sequencing and combination strategies
- Prognostic and diagnostic implications
- Comparison with published literature

Guidelines:
- Always cite evidence levels (e.g., FDA Level 1, NCCN Category 2A, Phase III data)
- Be precise about uncertainty — distinguish established evidence from expert opinion
- Use professional clinical language accessible to oncologists
- When discussing off-label use, clearly state it
- Never provide direct patient care recommendations — frame as "considerations for tumor board discussion"
- If asked about something outside your knowledge, say so clearly

PATIENT GENOMIC DATA:
`;

/**
 * Build system prompt with patient genomic context
 */
function buildSystemPrompt(params: {
  variants: Variant[];
  evidence?: Evidence[];
  therapies?: Therapy[];
  tumorType?: string;
}): string {
  const { variants, evidence, therapies, tumorType } = params;

  const variantSummary = variants
    .map(
      (v) =>
        `- ${v.gene || '?'} ${v.hgvs || v.hgvs_p || v.hgvs_c || `${v.ref}>${v.alt}`} (VAF: ${v.vaf !== undefined ? (v.vaf * 100).toFixed(1) + '%' : 'N/A'}, Effect: ${v.effect || 'N/A'}, OncoKB: ${v.oncokbLevel || 'N/A'}, ClinVar: ${v.clinvarSignificance || 'N/A'})`
    )
    .join('\n');

  const evidenceSummary =
    evidence && evidence.length > 0
      ? evidence
          .map(
            (e) =>
              `- [${e.source}] ${e.description} (Level: ${e.level}${e.drugAssociations.length > 0 ? `, Drugs: ${e.drugAssociations.join(', ')}` : ''})`
          )
          .join('\n')
      : 'No evidence items available.';

  const therapySummary =
    therapies && therapies.length > 0
      ? therapies
          .map(
            (t) =>
              `- ${t.drug} for ${t.biomarker} in ${t.tumorType} (Level: ${t.level})`
          )
          .join('\n')
      : 'No therapy suggestions available.';

  return `${SYSTEM_PROMPT_TEMPLATE}
Tumor type: ${tumorType || 'Not specified'}

Variants (${variants.length}):
${variantSummary}

Evidence:
${evidenceSummary}

Therapy suggestions:
${therapySummary}`;
}

/**
 * Send a message to the tumor board assistant and get a response
 */
export async function askTumorBoard(params: {
  question: string;
  history: TumorBoardMessage[];
  variants: Variant[];
  evidence?: Evidence[];
  therapies?: Therapy[];
  tumorType?: string;
}): Promise<string> {
  const { question, history, variants, evidence, therapies, tumorType } =
    params;

  const anthropic = getAnthropic();

  const messages = [
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: question },
  ];

  const response = await anthropic.messages.create({
    model: MODEL,
    system: buildSystemPrompt({ variants, evidence, therapies, tumorType }),
    messages,
    temperature: 0.3,
    max_tokens: 2048,
  });

  const firstBlock = response.content[0];
  return firstBlock.type === 'text' ? firstBlock.text : '';
}

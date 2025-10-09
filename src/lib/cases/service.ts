import { CaseMetadata, Variant, Evidence, Therapy, QualityControl } from '@/core/models';

export interface Case {
  id: string;
  metadata: CaseMetadata;
  variants: Variant[];
  evidence: Evidence[];
  therapies: Therapy[];
  qc: QualityControl;
  extractedText?: string[];
  highlights?: Array<{
    pageNumber: number;
    text: string;
    type: 'variant' | 'evidence' | 'therapy';
  }>;
  parsingDetails?: any;
  auditEntries?: any[];
}

// Por ahora, usaremos un almacenamiento en memoria
// Más adelante, esto se reemplazará con una base de datos real
// Use a global variable to persist across hot reloads in development
const globalForCases = global as typeof globalThis & {
  cases: Map<string, Case>;
};

const cases = globalForCases.cases || new Map<string, Case>();

if (process.env.NODE_ENV !== 'production') {
  globalForCases.cases = cases;
}

export const CaseService = {
  async create(caseData: Case): Promise<Case> {
    console.log(`[CaseService] Creating case with ID: ${caseData.id}`);
    cases.set(caseData.id, caseData);
    console.log(`[CaseService] Total cases in memory: ${cases.size}`);
    return caseData;
  },

  async get(id: string): Promise<Case | null> {
    console.log(`[CaseService] Getting case with ID: ${id}`);
    console.log(`[CaseService] Total cases in memory: ${cases.size}`);
    console.log(`[CaseService] Available case IDs: ${Array.from(cases.keys()).join(', ')}`);
    const caseData = cases.get(id) || null;
    console.log(`[CaseService] Case found: ${caseData ? 'Yes' : 'No'}`);
    return caseData;
  },

  async list(): Promise<Case[]> {
    return Array.from(cases.values());
  },

  async update(id: string, data: Partial<Case>): Promise<Case | null> {
    const existingCase = cases.get(id);
    if (!existingCase) return null;

    const updatedCase = {
      ...existingCase,
      ...data,
    };
    cases.set(id, updatedCase);
    return updatedCase;
  },

  async delete(id: string): Promise<boolean> {
    return cases.delete(id);
  },
};

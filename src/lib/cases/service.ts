import { CaseMetadata, Variant, Evidence, Therapy, QualityControl } from '@/core/models';
import { connectDB } from '@/lib/db/mongodb';
import { CaseModel } from '@/lib/db/models/Case';

export interface Case {
  id: string;
  metadata: CaseMetadata;
  variants: Variant[];
  evidence: Evidence[];
  therapies: Therapy[];
  qc: QualityControl;
  annotationErrors?: { source: string; message: string }[];
  extractedText?: string[];
  highlights?: Array<{
    pageNumber: number;
    text: string;
    type: 'variant' | 'evidence' | 'therapy';
  }>;
  parsingDetails?: any;
  auditEntries?: any[];
}

// ── In-memory fallback ─────────────────────────────────────────────────────

const globalForCases = global as typeof globalThis & { cases: Map<string, Case> };
const memCases = globalForCases.cases || new Map<string, Case>();
if (process.env.NODE_ENV !== 'production') {
  globalForCases.cases = memCases;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function docToCase(doc: any): Case {
  return {
    id: doc.caseId,
    metadata: doc.metadata,
    variants: doc.variants,
    evidence: doc.evidence,
    therapies: doc.therapies,
    qc: doc.qc,
    annotationErrors: doc.annotationErrors,
    extractedText: doc.extractedText,
    highlights: doc.highlights,
    parsingDetails: doc.parsingDetails,
    auditEntries: doc.auditEntries,
  };
}

async function canConnectMongo(): Promise<boolean> {
  try {
    const conn = await connectDB();
    return conn !== null;
  } catch {
    return false;
  }
}

// ── Service ────────────────────────────────────────────────────────────────

export const CaseService = {
  async create(caseData: Case): Promise<Case> {
    if (await canConnectMongo()) {
      const doc = await CaseModel.create({
        caseId: caseData.id,
        metadata: caseData.metadata,
        variants: caseData.variants,
        evidence: caseData.evidence,
        therapies: caseData.therapies,
        qc: caseData.qc,
        annotationErrors: caseData.annotationErrors,
        extractedText: caseData.extractedText,
        highlights: caseData.highlights,
        parsingDetails: caseData.parsingDetails,
        auditEntries: caseData.auditEntries,
      });
      console.log(`[CaseService] Case created in MongoDB: ${caseData.id}`);
      return docToCase(doc);
    }
    // Fallback: in-memory
    memCases.set(caseData.id, caseData);
    console.log(`[CaseService] Case created in memory: ${caseData.id} (total: ${memCases.size})`);
    return caseData;
  },

  async get(id: string): Promise<Case | null> {
    if (await canConnectMongo()) {
      const doc = await CaseModel.findOne({ caseId: id }).lean();
      return doc ? docToCase(doc) : null;
    }
    return memCases.get(id) || null;
  },

  async list(): Promise<Case[]> {
    if (await canConnectMongo()) {
      const docs = await CaseModel.find().sort({ createdAt: -1 }).lean();
      return docs.map(docToCase);
    }
    return Array.from(memCases.values());
  },

  async update(id: string, data: Partial<Case>): Promise<Case | null> {
    if (await canConnectMongo()) {
      const updateData: any = { ...data };
      delete updateData.id;
      const doc = await CaseModel.findOneAndUpdate(
        { caseId: id },
        { $set: updateData },
        { new: true }
      ).lean();
      return doc ? docToCase(doc) : null;
    }
    const existing = memCases.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data };
    memCases.set(id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    if (await canConnectMongo()) {
      const result = await CaseModel.deleteOne({ caseId: id });
      return result.deletedCount > 0;
    }
    return memCases.delete(id);
  },
};

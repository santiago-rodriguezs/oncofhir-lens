import mongoose, { Schema } from 'mongoose';

const CaseSchema = new Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    metadata: {
      patientId: String,
      sampleId: String,
      tumorType: String,
      reportSource: { type: String, enum: ['PDF', 'VCF'], required: true },
      parsingConfidence: { type: Number, required: true },
      timestamp: { type: String, required: true },
    },
    variants: { type: Schema.Types.Mixed, default: [] },
    evidence: { type: Schema.Types.Mixed, default: [] },
    therapies: { type: Schema.Types.Mixed, default: [] },
    qc: {
      source: { type: String, enum: ['PDF', 'VCF'], required: true },
      metrics: { type: Schema.Types.Mixed, default: {} },
      flags: { type: [String], default: [] },
      confidence: { type: Number, required: true },
    },
    annotationErrors: [{ source: String, message: String }],
    extractedText: [String],
    highlights: [{ pageNumber: Number, text: String, type: String }],
    parsingDetails: Schema.Types.Mixed,
    auditEntries: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true, strict: false }
);

export const CaseModel =
  mongoose.models.Case || mongoose.model('Case', CaseSchema);

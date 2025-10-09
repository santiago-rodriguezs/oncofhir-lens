import { Card } from "@/components/ui/card";
import { CaseMetadata, QualityControl } from "@/core/models";
import { Badge } from "@/components/ui/badge";

interface SummaryPanelProps {
  metadata: CaseMetadata;
  qc: QualityControl;
  variantCount: number;
  evidenceCount: number;
  therapyCount: number;
}

export function SummaryPanel({
  metadata,
  qc,
  variantCount,
  evidenceCount,
  therapyCount,
}: SummaryPanelProps) {
  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Variants</h3>
          <p className="text-2xl font-bold">{variantCount}</p>
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Evidence Items</h3>
          <p className="text-2xl font-bold">{evidenceCount}</p>
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Therapy Suggestions</h3>
          <p className="text-2xl font-bold">{therapyCount}</p>
        </Card>
      </div>

      {/* Case details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Case Details</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metadata.patientId && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Patient ID</dt>
              <dd className="text-base">{metadata.patientId}</dd>
            </div>
          )}
          {metadata.sampleId && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Sample ID</dt>
              <dd className="text-base">{metadata.sampleId}</dd>
            </div>
          )}
          {metadata.tumorType && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Tumor Type</dt>
              <dd className="text-base">{metadata.tumorType}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Report Source</dt>
            <dd>
              <Badge variant={metadata.reportSource === 'PDF' ? 'default' : 'secondary'}>
                {metadata.reportSource}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Analysis Date</dt>
            <dd className="text-base">
              {new Date(metadata.timestamp).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Parsing Confidence</dt>
            <dd>
              <Badge variant="outline" className={
                metadata.parsingConfidence > 0.8 ? 'text-green-600' :
                metadata.parsingConfidence > 0.6 ? 'text-yellow-600' :
                'text-red-600'
              }>
                {Math.round(metadata.parsingConfidence * 100)}%
              </Badge>
            </dd>
          </div>
        </dl>
      </Card>

      {/* QC Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quality Control</h3>
        {qc.flags.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Flags</h4>
            <div className="flex flex-wrap gap-2">
              {qc.flags.map((flag, index) => (
                <Badge key={index} variant="destructive">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Metrics</h4>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(qc.metrics).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm font-medium text-muted-foreground">{key}</dt>
                <dd className="text-base">{value.toString()}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>
    </div>
  );
}

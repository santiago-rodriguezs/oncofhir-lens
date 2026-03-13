import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CaseMetadata, QualityControl, Variant, Evidence, Therapy } from "@/core/models";
import {
  Dna,
  AlertTriangle,
  Pill,
  TrendingUp,
  Target,
  Shield,
  FlaskConical,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";

interface SummaryPanelProps {
  metadata: CaseMetadata;
  qc: QualityControl;
  variants: Variant[];
  evidence: Evidence[];
  therapies: Therapy[];
}

// ── Stat Card ──
function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };
  const iconColorMap: Record<string, string> = {
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
    purple: "text-purple-600",
    cyan: "text-cyan-600",
    slate: "text-slate-600",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${iconColorMap[color]}`} />
        <span className="text-xs font-medium uppercase tracking-wide opacity-80">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sublabel && <p className="text-xs mt-1 opacity-70">{sublabel}</p>}
    </div>
  );
}

// ── Compute clinical insights from raw data ──
function computeInsights(variants: Variant[], evidence: Evidence[], therapies: Therapy[]) {
  const uniqueGenes = [...new Set(variants.map((v) => v.gene).filter(Boolean))] as string[];

  // Actionable variants (OncoKB level 1-4 or R1/R2)
  const actionableVariants = variants.filter(
    (v) => v.oncokbLevel && !["Unknown", "N/A", ""].includes(v.oncokbLevel)
  );
  const actionableLevels = actionableVariants.reduce<Record<string, number>>((acc, v) => {
    const level = v.oncokbLevel || "Other";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  // Pathogenicity breakdown
  const pathogenic = variants.filter(
    (v) =>
      v.clinvarSignificance?.toLowerCase().includes("pathogenic") ||
      v.clinvarData?.clinicalSignificance?.toLowerCase().includes("pathogenic")
  );
  const benign = variants.filter(
    (v) =>
      v.clinvarSignificance?.toLowerCase().includes("benign") ||
      v.clinvarData?.clinicalSignificance?.toLowerCase().includes("benign")
  );
  const vus = variants.filter(
    (v) =>
      v.clinvarSignificance?.toLowerCase().includes("uncertain") ||
      v.clinvarData?.clinicalSignificance?.toLowerCase().includes("uncertain")
  );
  const unclassified = variants.length - pathogenic.length - benign.length - vus.length;

  // VAF stats
  const vafs = variants.filter((v) => v.vaf != null).map((v) => v.vaf!);
  const avgVaf = vafs.length > 0 ? vafs.reduce((a, b) => a + b, 0) / vafs.length : null;
  const maxVaf = vafs.length > 0 ? Math.max(...vafs) : null;
  const highVafCount = vafs.filter((v) => v >= 0.3).length;

  // Depth stats
  const depths = variants.filter((v) => v.depth != null).map((v) => v.depth!);
  const avgDepth = depths.length > 0 ? Math.round(depths.reduce((a, b) => a + b, 0) / depths.length) : null;
  const lowDepthCount = depths.filter((d) => d < 100).length;

  // Evidence sources breakdown
  const evidenceBySrc = evidence.reduce<Record<string, number>>((acc, e) => {
    acc[e.source] = (acc[e.source] || 0) + 1;
    return acc;
  }, {});

  // Unique drugs
  const uniqueDrugs = [...new Set(therapies.map((t) => t.drug))];

  // FDA-approved therapies (level 1)
  const fdaApproved = therapies.filter(
    (t) => t.level?.includes("1") || t.level?.includes("FDA")
  );

  // Known cancer driver genes
  const DRIVER_GENES = new Set([
    "TP53", "KRAS", "EGFR", "BRAF", "PIK3CA", "NRAS", "PTEN", "APC",
    "BRCA1", "BRCA2", "ALK", "ROS1", "MET", "HER2", "ERBB2", "RET",
    "FGFR1", "FGFR2", "FGFR3", "IDH1", "IDH2", "KIT", "PDGFRA",
    "ABL1", "JAK2", "MPL", "CALR", "NPM1", "FLT3", "DNMT3A", "TET2",
    "STK11", "SMARCB1", "ATM", "CHEK2", "PALB2", "CDH1", "RB1",
  ]);
  const driverGenes = uniqueGenes.filter((g) => DRIVER_GENES.has(g));

  return {
    uniqueGenes,
    driverGenes,
    actionableVariants,
    actionableLevels,
    pathogenic,
    benign,
    vus,
    unclassified,
    avgVaf,
    maxVaf,
    highVafCount,
    avgDepth,
    lowDepthCount,
    evidenceBySrc,
    uniqueDrugs,
    fdaApproved,
  };
}

export function SummaryPanel({
  metadata,
  qc,
  variants,
  evidence,
  therapies,
}: SummaryPanelProps) {
  const ins = computeInsights(variants, evidence, therapies);

  return (
    <div className="space-y-6">

      {/* ── Quick KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={Dna}
          label="Variantes"
          value={variants.length}
          sublabel={`${ins.uniqueGenes.length} gen${ins.uniqueGenes.length !== 1 ? "es" : ""} afectado${ins.uniqueGenes.length !== 1 ? "s" : ""}`}
          color="blue"
        />
        <StatCard
          icon={Target}
          label="Accionables"
          value={ins.actionableVariants.length}
          sublabel={
            ins.actionableVariants.length > 0
              ? Object.entries(ins.actionableLevels).map(([k, v]) => `${k}: ${v}`).join(", ")
              : "Sin variantes accionables"
          }
          color={ins.actionableVariants.length > 0 ? "emerald" : "slate"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Patogénicas"
          value={ins.pathogenic.length}
          sublabel={ins.pathogenic.length > 0 ? ins.pathogenic.map((v) => v.gene).join(", ") : "Sin hallazgos"}
          color={ins.pathogenic.length > 0 ? "red" : "emerald"}
        />
        <StatCard
          icon={Pill}
          label="Terapias"
          value={ins.uniqueDrugs.length}
          sublabel={
            ins.fdaApproved.length > 0
              ? `${ins.fdaApproved.length} con evidencia nivel 1`
              : `${therapies.length} asociaciones totales`
          }
          color={ins.uniqueDrugs.length > 0 ? "emerald" : "amber"}
        />
        <StatCard
          icon={TrendingUp}
          label="VAF prom."
          value={ins.avgVaf != null ? `${(ins.avgVaf * 100).toFixed(1)}%` : "N/A"}
          sublabel={
            ins.highVafCount > 0
              ? `${ins.highVafCount} clonal${ins.highVafCount > 1 ? "es" : ""} (>30%)`
              : "Sin VAF alto"
          }
          color={ins.highVafCount > 0 ? "amber" : "cyan"}
        />
        <StatCard
          icon={Shield}
          label="Drivers"
          value={ins.driverGenes.length}
          sublabel={
            ins.driverGenes.length > 0
              ? ins.driverGenes.slice(0, 5).join(", ")
              : "Sin drivers conocidos"
          }
          color={ins.driverGenes.length > 0 ? "purple" : "slate"}
        />
      </div>

      {/* ── Clinical Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Pathogenicity Breakdown */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            Clasificación de Variantes
          </h3>
          <div className="space-y-2">
            {[
              {
                label: "Patogénica / Prob. Patogénica",
                count: ins.pathogenic.length,
                icon: XCircle,
                color: "text-red-600",
                bg: "bg-red-100",
                genes: ins.pathogenic.map((v) => v.gene).filter(Boolean),
              },
              {
                label: "VUS (Significado Incierto)",
                count: ins.vus.length,
                icon: HelpCircle,
                color: "text-amber-600",
                bg: "bg-amber-100",
                genes: ins.vus.map((v) => v.gene).filter(Boolean),
              },
              {
                label: "Benigna / Prob. Benigna",
                count: ins.benign.length,
                icon: CheckCircle2,
                color: "text-emerald-600",
                bg: "bg-emerald-100",
                genes: ins.benign.map((v) => v.gene).filter(Boolean),
              },
              {
                label: "Sin clasificar",
                count: ins.unclassified,
                icon: HelpCircle,
                color: "text-slate-500",
                bg: "bg-slate-100",
                genes: [],
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <row.icon className={`h-4 w-4 ${row.color}`} />
                  <span className="text-sm">{row.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {row.genes.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {[...new Set(row.genes)].slice(0, 3).join(", ")}
                      {[...new Set(row.genes)].length > 3 ? "..." : ""}
                    </span>
                  )}
                  <Badge variant="outline" className={`${row.bg} ${row.color} border-0 font-bold`}>
                    {row.count}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {/* mini bar */}
          {variants.length > 0 && (
            <div className="flex h-2 rounded-full overflow-hidden mt-3 bg-slate-100">
              {ins.pathogenic.length > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${(ins.pathogenic.length / variants.length) * 100}%` }}
                />
              )}
              {ins.vus.length > 0 && (
                <div
                  className="bg-amber-400"
                  style={{ width: `${(ins.vus.length / variants.length) * 100}%` }}
                />
              )}
              {ins.benign.length > 0 && (
                <div
                  className="bg-emerald-500"
                  style={{ width: `${(ins.benign.length / variants.length) * 100}%` }}
                />
              )}
              {ins.unclassified > 0 && (
                <div
                  className="bg-slate-300"
                  style={{ width: `${(ins.unclassified / variants.length) * 100}%` }}
                />
              )}
            </div>
          )}
        </Card>

        {/* Top Therapeutic Options */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Pill className="h-4 w-4 text-emerald-600" />
            Opciones Terapéuticas
            {ins.uniqueDrugs.length > 0 && (
              <Badge variant="secondary" className="text-xs">{ins.uniqueDrugs.length} drogas</Badge>
            )}
          </h3>
          {therapies.length > 0 ? (
            <div className="space-y-2">
              {ins.uniqueDrugs.slice(0, 6).map((drug) => {
                const related = therapies.filter((t) => t.drug === drug);
                const bestLevel = related
                  .map((t) => t.level)
                  .sort()[0];
                const genes = [...new Set(related.map((t) => t.biomarker))];
                return (
                  <div key={drug} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{drug}</span>
                      <span className="text-xs text-muted-foreground">
                        {genes.join(", ")}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        bestLevel?.includes("1")
                          ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                          : bestLevel?.includes("2")
                          ? "border-blue-300 text-blue-700 bg-blue-50"
                          : ""
                      }`}
                    >
                      {bestLevel || "-"}
                    </Badge>
                  </div>
                );
              })}
              {ins.uniqueDrugs.length > 6 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{ins.uniqueDrugs.length - 6} drogas más
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No se identificaron opciones terapéuticas para las variantes detectadas.
            </p>
          )}
        </Card>
      </div>

      {/* ── Genes & Evidence Sources ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Genes Affected */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Dna className="h-4 w-4 text-purple-600" />
            Genes Afectados
          </h3>
          <div className="flex flex-wrap gap-2">
            {ins.uniqueGenes.map((gene) => {
              const isDriver = ins.driverGenes.includes(gene);
              const variantsForGene = variants.filter((v) => v.gene === gene);
              const isPathogenic = variantsForGene.some(
                (v) =>
                  v.clinvarSignificance?.toLowerCase().includes("pathogenic") ||
                  v.clinvarData?.clinicalSignificance?.toLowerCase().includes("pathogenic")
              );
              const isActionable = variantsForGene.some(
                (v) => v.oncokbLevel && !["Unknown", "N/A", ""].includes(v.oncokbLevel)
              );
              return (
                <Badge
                  key={gene}
                  variant="outline"
                  className={`text-xs gap-1 ${
                    isPathogenic
                      ? "border-red-300 text-red-700 bg-red-50"
                      : isActionable
                      ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                      : isDriver
                      ? "border-purple-300 text-purple-700 bg-purple-50"
                      : ""
                  }`}
                >
                  {gene}
                  <span className="opacity-60">({variantsForGene.length})</span>
                  {isDriver && <Shield className="h-3 w-3" />}
                </Badge>
              );
            })}
          </div>
          {ins.driverGenes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              <Shield className="h-3 w-3 inline mr-1" />
              = gen driver conocido (Cancer Gene Census)
            </p>
          )}
        </Card>

        {/* Evidence Sources */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-cyan-600" />
            Fuentes de Evidencia
          </h3>
          <div className="space-y-2">
            {Object.entries(ins.evidenceBySrc).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-sm">{source}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
            {Object.keys(ins.evidenceBySrc).length === 0 && (
              <p className="text-sm text-muted-foreground">Sin evidencia disponible</p>
            )}
          </div>
          {/* QC flags */}
          {qc.flags.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-amber-600 mb-1">Alertas de calidad:</p>
              <div className="flex flex-wrap gap-1">
                {qc.flags.map((flag, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-amber-300 text-amber-700">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Case Details (compact) ── */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-600" />
          Detalles del Caso
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
          {metadata.patientName && (
            <div>
              <p className="text-xs text-muted-foreground">Paciente</p>
              <p className="font-medium">{metadata.patientName}</p>
            </div>
          )}
          {metadata.patientId && (
            <div>
              <p className="text-xs text-muted-foreground">ID</p>
              <p className="font-mono text-xs">{metadata.patientId}</p>
            </div>
          )}
          {metadata.tumorType && (
            <div>
              <p className="text-xs text-muted-foreground">Tumor</p>
              <p className="font-medium">{metadata.tumorType}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Fuente</p>
            <Badge variant={metadata.reportSource === "PDF" ? "default" : "secondary"} className="text-xs">
              {metadata.reportSource}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fecha</p>
            <p>{new Date(metadata.timestamp).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Confianza</p>
            <Badge
              variant="outline"
              className={`text-xs ${
                metadata.parsingConfidence > 0.8
                  ? "text-emerald-600 border-emerald-300"
                  : metadata.parsingConfidence > 0.6
                  ? "text-amber-600 border-amber-300"
                  : "text-red-600 border-red-300"
              }`}
            >
              {Math.round(metadata.parsingConfidence * 100)}%
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

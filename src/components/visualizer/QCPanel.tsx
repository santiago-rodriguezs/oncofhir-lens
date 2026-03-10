import { Card } from "@/components/ui/card";
import { QualityControl } from "@/core/models";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface QCPanelProps {
  qc: QualityControl;
  parsingDetails?: {
    pagesProcessed?: number;
    totalPages?: number;
    ocrConfidence?: number;
    coverage?: {
      mean: number;
      median: number;
      regions: Array<{
        name: string;
        coverage: number;
      }>;
    };
    assayMeta?: {
      name: string;
      version: string;
      type: string;
      [key: string]: string;
    };
  };
}

export function QCPanel({ qc, parsingDetails }: QCPanelProps) {
  return (
    <div className="space-y-6">
      {/* QC Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resumen de Control de Calidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Fuente</h4>
            <Badge variant={qc.source === 'PDF' ? 'default' : 'secondary'}>
              {qc.source}
            </Badge>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Confianza General
            </h4>
            <Badge
              variant="outline"
              className={
                qc.confidence > 0.8
                  ? 'text-green-600'
                  : qc.confidence > 0.6
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }
            >
              {Math.round(qc.confidence * 100)}%
            </Badge>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Alertas de Calidad
            </h4>
            <div className="flex flex-wrap gap-2">
              {qc.flags.length === 0 ? (
                <Badge variant="outline" className="text-green-600">
                  Sin problemas detectados
                </Badge>
              ) : (
                qc.flags.map((flag, index) => (
                  <Badge key={index} variant="destructive">
                    {flag}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Metrics Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Métrica</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(qc.metrics).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="font-medium">{key}</TableCell>
                <TableCell>{value.toString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Source-specific Details */}
      <Accordion type="single" collapsible>
        {qc.source === 'PDF' && parsingDetails?.pagesProcessed && (
          <AccordionItem value="pdf">
            <AccordionTrigger>Detalles de Procesamiento PDF</AccordionTrigger>
            <AccordionContent>
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Páginas
                    </h4>
                    <p>
                      Procesadas {parsingDetails?.pagesProcessed} de{' '}
                      {parsingDetails?.totalPages} páginas
                    </p>
                  </div>
                  {parsingDetails?.ocrConfidence && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Confianza OCR
                      </h4>
                      <Badge variant="outline">
                        {Math.round((parsingDetails?.ocrConfidence ?? 0) * 100)}%
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            </AccordionContent>
          </AccordionItem>
        )}

        {qc.source === 'VCF' && parsingDetails?.coverage && (
          <AccordionItem value="vcf">
            <AccordionTrigger>Detalles de Cobertura de Secuenciación</AccordionTrigger>
            <AccordionContent>
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Cobertura Media
                      </h4>
                      <p>{parsingDetails?.coverage?.mean}x</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Cobertura Mediana
                      </h4>
                      <p>{parsingDetails?.coverage?.median}x</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Cobertura Regional
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Región</TableHead>
                          <TableHead>Cobertura</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsingDetails?.coverage?.regions?.map((region, index) => (
                          <TableRow key={index}>
                            <TableCell>{region.name}</TableCell>
                            <TableCell>{region.coverage}x</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            </AccordionContent>
          </AccordionItem>
        )}

        {parsingDetails?.assayMeta && (
          <AccordionItem value="assay">
            <AccordionTrigger>Información del Ensayo</AccordionTrigger>
            <AccordionContent>
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(parsingDetails?.assayMeta ?? {}).map(([key, value]) => (
                    <div key={key}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        {key}
                      </h4>
                      <p>{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

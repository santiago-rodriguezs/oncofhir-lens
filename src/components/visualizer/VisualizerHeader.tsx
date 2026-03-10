import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CaseMetadata } from "@/core/models";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface VisualizerHeaderProps {
  metadata: CaseMetadata;
  onSearch: (query: string) => void;
  onFilterChange: (filters: Record<string, any>) => void;
}

export function VisualizerHeader({ metadata, onSearch, onFilterChange }: VisualizerHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex flex-col gap-4 py-4">
        {/* Case metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              Caso: {metadata.patientId}
            </h1>
            <Badge variant={metadata.reportSource === 'PDF' ? 'default' : 'secondary'}>
              {metadata.reportSource}
            </Badge>
            <Badge variant="outline" className="text-yellow-600">
              {Math.round(metadata.parsingConfidence * 100)}% confianza
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {metadata.sampleId && (
              <Badge variant="outline">Muestra: {metadata.sampleId}</Badge>
            )}
            {metadata.tumorType && (
              <Badge variant="outline">Tumor: {metadata.tumorType}</Badge>
            )}
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar variantes, genes o evidencia..."
              className="pl-8"
              data-search-input="true"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => onFilterChange({})}>
            Limpiar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}

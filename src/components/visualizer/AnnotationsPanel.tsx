import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Evidence, Variant } from "@/core/models";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle } from "lucide-react";

interface AnnotationsPanelProps {
  selectedVariant?: Variant;
  evidence: Evidence[];
  annotationErrors?: { source: string; message: string }[];
  onEvidenceSelect: (evidence: Evidence) => void;
}

export function AnnotationsPanel({
  selectedVariant,
  evidence,
  annotationErrors,
  onEvidenceSelect,
}: AnnotationsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  const filteredEvidence = evidence.filter((item) => {
    const matchesSearch = searchQuery === '' || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = !sourceFilter || item.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const sources = Array.from(new Set(evidence.map(item => item.source)));

  return (
    <div className="space-y-4">
      {/* Annotation source errors */}
      {annotationErrors && annotationErrors.length > 0 && (
        <Card className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm">
                Error al anotar con fuentes externas
              </h4>
              {annotationErrors.map((err, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Badge variant="destructive" className="text-xs">{err.source}</Badge>
                  <span className="text-red-700 dark:text-red-400">{err.message}</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                Las anotaciones mostradas provienen únicamente de las fuentes que respondieron correctamente.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar evidencia..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setSearchQuery('');
            setSourceFilter(null);
          }}
        >
          Limpiar filtros
        </Button>
      </div>

      {/* Source tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setSourceFilter(null)}>
            Todas las fuentes
          </TabsTrigger>
          {sources.map((source) => (
            <TabsTrigger
              key={source}
              value={source}
              onClick={() => setSourceFilter(source)}
            >
              {source}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Evidence cards */}
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-4 pr-4">
            {filteredEvidence.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No se encontró evidencia con los filtros actuales.
              </Card>
            ) : (
              filteredEvidence.map((item, index) => (
                <Card
                  key={index}
                  className="p-6 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => onEvidenceSelect(item)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <Badge>{item.source}</Badge>
                      {item.level && item.level !== 'Unknown' && item.level !== 'N/A' && (
                        <Badge variant="outline" className="ml-2">
                          Nivel {item.level}
                        </Badge>
                      )}
                      {(item.level === 'Unknown' || item.level === 'N/A') && (
                        <Badge variant="outline" className="ml-2 text-muted-foreground">
                          Sin nivel terapéutico
                        </Badge>
                      )}
                    </div>
                    {item.tumorContext && (
                      <Badge variant="secondary">{item.tumorContext}</Badge>
                    )}
                  </div>
                  <p className="text-sm mb-4">{item.description}</p>
                  {item.drugAssociations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Fármacos asociados
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.drugAssociations.map((drug, drugIndex) => (
                          <Badge key={drugIndex} variant="outline">
                            {drug}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Citas
                      </h4>
                      <ul className="text-sm space-y-1">
                        {item.citations.map((citation, citationIndex) => (
                          <li key={citationIndex} className="text-muted-foreground">
                            {citation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Evidence, Variant } from "@/core/models";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface AnnotationsPanelProps {
  selectedVariant?: Variant;
  evidence: Evidence[];
  onEvidenceSelect: (evidence: Evidence) => void;
}

export function AnnotationsPanel({
  selectedVariant,
  evidence,
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
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search evidence..."
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
          Clear Filters
        </Button>
      </div>

      {/* Source tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setSourceFilter(null)}>
            All Sources
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
                No evidence found matching the current filters.
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
                      {item.level && (
                        <Badge variant="outline" className="ml-2">
                          Level {item.level}
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
                        Associated Drugs
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
                        Citations
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

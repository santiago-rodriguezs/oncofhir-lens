import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Variant } from "@/core/models";
import { Copy, ZoomIn, ZoomOut } from "lucide-react";

interface ReportViewerPanelProps {
  pdfUrl?: string;
  selectedVariant?: Variant;
  extractedText: string[];
  highlights: Array<{
    pageNumber: number;
    text: string;
    type: 'variant' | 'evidence' | 'therapy';
  }>;
  onHighlightClick: (highlight: { pageNumber: number; text: string }) => void;
}

export function ReportViewerPanel({
  pdfUrl,
  selectedVariant,
  extractedText,
  highlights,
  onHighlightClick,
}: ReportViewerPanelProps) {
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      {/* PDF Viewer */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Original Report</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-300px)]">
          {pdfUrl ? (
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                transition: 'transform 0.2s',
              }}
            >
              <iframe
                src={`${pdfUrl}#page=${currentPage}`}
                className="w-full h-full"
                title="PDF Report"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No PDF report available
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Extracted Content */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Extracted Content</h3>
          {selectedVariant && (
            <Badge variant="secondary">
              Showing highlights for {selectedVariant.gene} {selectedVariant.hgvs}
            </Badge>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-6 pr-4">
            {extractedText.map((text, pageIndex) => (
              <div key={pageIndex} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Page {pageIndex + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(text);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Card className="p-4 text-sm whitespace-pre-wrap">
                  {text}
                </Card>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

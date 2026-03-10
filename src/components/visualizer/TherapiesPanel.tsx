import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Therapy, Evidence } from "@/core/models";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TherapiesPanelProps {
  therapies: Therapy[];
  evidence: Evidence[];
  onTherapySelect: (therapy: Therapy) => void;
}

export function TherapiesPanel({
  therapies,
  evidence,
  onTherapySelect,
}: TherapiesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [biomarkerFilter, setBiomarkerFilter] = useState<string | null>(null);
  const [tumorTypeFilter, setTumorTypeFilter] = useState<string | null>(null);

  const filteredTherapies = therapies.filter((therapy) => {
    const matchesSearch = searchQuery === '' || 
      therapy.drug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBiomarker = !biomarkerFilter || therapy.biomarker === biomarkerFilter;
    const matchesTumorType = !tumorTypeFilter || therapy.tumorType === tumorTypeFilter;
    return matchesSearch && matchesBiomarker && matchesTumorType;
  });

  const biomarkers = Array.from(new Set(therapies.map(t => t.biomarker)));
  const tumorTypes = Array.from(new Set(therapies.map(t => t.tumorType)));

  // Group therapies by biomarker and tumor type
  const groupedTherapies = filteredTherapies.reduce((acc, therapy) => {
    const key = `${therapy.biomarker}-${therapy.tumorType}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(therapy);
    return acc;
  }, {} as Record<string, Therapy[]>);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar drogas..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={biomarkerFilter ?? 'all'}
            onValueChange={(value) => setBiomarkerFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por biomarcador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los biomarcadores</SelectItem>
              {biomarkers.map((biomarker) => (
                <SelectItem key={biomarker} value={biomarker}>
                  {biomarker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={tumorTypeFilter ?? 'all'}
            onValueChange={(value) => setTumorTypeFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo de tumor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos de tumor</SelectItem>
              {tumorTypes.map((tumorType) => (
                <SelectItem key={tumorType} value={tumorType}>
                  {tumorType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Therapy groups */}
      <div className="space-y-6">
        {Object.entries(groupedTherapies).map(([key, groupTherapies]) => {
          const [biomarker, tumorType] = key.split('-');
          return (
            <Card key={key} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-x-2">
                  <Badge variant="secondary">{biomarker}</Badge>
                  <Badge variant="outline">{tumorType}</Badge>
                </div>
                <Badge>
                  {groupTherapies.length} {groupTherapies.length === 1 ? 'terapia' : 'terapias'}
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Droga</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Estado de aprobación</TableHead>
                    <TableHead>Evidencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupTherapies.map((therapy, index) => {
                    const relatedEvidence = evidence.find(e => e.evidenceId === therapy.evidenceId);
                    return (
                      <TableRow
                        key={index}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => onTherapySelect(therapy)}
                      >
                        <TableCell>
                          <div>
                            <span className="font-medium">{therapy.drug}</span>
                            {therapy.combination && therapy.combination.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                + {therapy.combination.join(', ')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{therapy.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {therapy.approvalStatus?.US && (
                              <Badge variant="secondary">FDA</Badge>
                            )}
                            {therapy.approvalStatus?.EU && (
                              <Badge variant="secondary">EMA</Badge>
                            )}
                            {therapy.approvalStatus?.AR && (
                              <Badge variant="secondary">ANMAT</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {relatedEvidence && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {relatedEvidence.description}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

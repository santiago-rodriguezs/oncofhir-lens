'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Case {
  id: string;
  patientId: string;
  label: string;
  date: string;
  variantCount: number;
}

interface CaseListProps {
  cases: Case[];
}

export function CaseList({ cases }: CaseListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCases = cases.filter(
    (caseItem) =>
      caseItem.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.label?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar casos..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredCases.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No se encontraron casos.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCases.map((caseItem) => (
            <Card
              key={caseItem.id}
              className="p-4 cursor-pointer hover:border-primary transition-colors"
              onClick={() => router.push(`/visualizer/${caseItem.id}`)}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{caseItem.patientId}</h3>
                  <Badge variant="outline">
                    {caseItem.variantCount} variantes
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{caseItem.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(caseItem.date).toLocaleString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-8">
        <Button
          variant="outline"
          onClick={() => router.push('/')}
        >
          Subir Nuevo Caso
        </Button>
      </div>
    </div>
  );
}

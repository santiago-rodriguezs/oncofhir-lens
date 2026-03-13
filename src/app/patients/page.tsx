'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Search, RefreshCw, AlertTriangle, Server } from 'lucide-react';

interface PatientSummary {
  id: string;
  name: string;
  identifier: string;
  gender: string;
  birthDate: string;
  lastUpdated: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchPatients = async (nameFilter?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (nameFilter) params.set('name', nameFilter);
      const res = await fetch(`/api/fhir/patients?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPatients(data.patients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error conectando con el servidor FHIR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSearch = () => {
    fetchPatients(search || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-emerald-100 p-2">
            <Users className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Visor de Pacientes</h1>
            <p className="text-sm text-muted-foreground">
              Datos genómicos desde el servidor FHIR
            </p>
          </div>
          <Badge variant="outline" className="ml-2 gap-1">
            <Server className="h-3 w-3" />
            HAPI FHIR R4
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchPatients()}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por nombre o identificador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-1" />
            Buscar
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-medium">Error de conexión con el servidor FHIR</p>
              <p className="text-sm mt-1">{error}</p>
              <p className="text-xs mt-2 text-red-500">
                Verificá que HAPI FHIR esté corriendo en localhost:8080
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Patient list */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            Consultando servidor FHIR...
          </div>
        ) : patients.length === 0 && !error ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay pacientes en el servidor FHIR</p>
            <p className="text-xs mt-1">
              Procesá un caso desde Inicio para enviar datos al servidor
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Identificador</TableHead>
                <TableHead>Género</TableHead>
                <TableHead>Fecha de nacimiento</TableHead>
                <TableHead>Última actualización</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {p.identifier || p.id}
                    </code>
                  </TableCell>
                  <TableCell>{p.gender || '-'}</TableCell>
                  <TableCell>{p.birthDate || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.lastUpdated
                      ? new Date(p.lastUpdated).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/patients/${p.id}`}>
                      <Button variant="outline" size="sm">
                        Ver datos genómicos
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

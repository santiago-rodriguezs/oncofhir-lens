'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClockIcon } from '@heroicons/react/24/outline';

interface Case {
  id: string;
  patientId: string;
  label: string;
  date: string;
  variantCount: number;
}

export default function RecentCasesList() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCases = async () => {
      try {
        // Intentar obtener el token del entorno
        const token = process.env.NEXT_PUBLIC_DEMO_SECRET;
        
        // Si no hay token, no intentar la petición
        if (!token) {
          console.log('No hay token de autenticación disponible');
          setCases([]);
          setIsLoading(false);
          return;
        }
        
        const response = await fetch('/api/cases', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Error de autenticación, mostrar mensaje amigable
            console.log('No autorizado para ver casos');
            setCases([]);
          } else {
            throw new Error('Error al obtener casos');
          }
        } else {
          const data = await response.json();
          setCases(data || []);
        }
      } catch (err) {
        console.error('Error al cargar casos:', err);
        setError('Error al cargar casos recientes');
        setCases([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCases();
  }, []);
  
  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-pulse flex space-x-4 items-center justify-center">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-4 max-w-md">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-4 text-center text-red-500">
        {error}
      </div>
    );
  }
  
  if (cases.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p>No se encontraron casos. Sube un estudio genómico para comenzar.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="table-header">ID de Caso</th>
            <th scope="col" className="table-header">Paciente</th>
            <th scope="col" className="table-header">Etiqueta</th>
            <th scope="col" className="table-header">Fecha</th>
            <th scope="col" className="table-header">Variantes</th>
            <th scope="col" className="table-header">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cases.map((caseItem) => (
            <tr key={caseItem.id} className="hover:bg-gray-50">
              <td className="table-cell font-medium text-gray-900">{caseItem.id}</td>
              <td className="table-cell">{caseItem.patientId}</td>
              <td className="table-cell">{caseItem.label}</td>
              <td className="table-cell">
                {new Date(caseItem.date).toLocaleDateString()}
              </td>
              <td className="table-cell">{caseItem.variantCount}</td>
              <td className="table-cell">
                <Link 
                  href={`/cases/${caseItem.id}`}
                  className="text-primary-600 hover:text-primary-800"
                >
                  Ver Detalles
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import RecentCasesList from '@/components/RecentCasesList';

export default function Dashboard() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileUpload = async (file: File, patientId?: string, caseLabel?: string) => {
    try {
      setIsUploading(true);
      setError(null);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      if (patientId) formData.append('patientId', patientId);
      if (caseLabel) formData.append('caseLabel', caseLabel);
      
      // Simulate progress (in a real app, you might use an upload progress event)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      // Call the API
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEMO_SECRET}`,
        },
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir el archivo');
      }
      
      setUploadProgress(100);
      
      // Get the case ID from the response
      const data = await response.json();
      
      // Redirect to the case page
      setTimeout(() => {
        router.push(`/cases/${data.caseId}`);
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Subir Estudio Genómico</h1>
        
        <FileUpload 
          onUpload={handleFileUpload} 
          isUploading={isUploading}
          progress={uploadProgress}
          error={error}
        />
      </div>
      
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Casos Recientes</h2>
        <RecentCasesList />
      </div>
    </div>
  );
}

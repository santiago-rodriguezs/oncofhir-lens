'use client';

import { useState } from 'react';
import { Variant } from '@/lib/schemas';

interface ExperimentalPdfSectionProps {
  onVariantsExtracted: (_extractedVariants: Variant[]) => void;
  isProcessing: boolean;
  setIsProcessing: (_processing: boolean) => void;
  setProcessingType: (_processingType: string) => void;
  setError: (_errorMsg: string | null) => void;
}

export default function ExperimentalPdfSection({
  onVariantsExtracted,
  isProcessing,
  setIsProcessing,
  setProcessingType,
  setError
}: ExperimentalPdfSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  // Process PDF
  const handleProcessPdf = async () => {
    if (!selectedFile) {
      setError('Por favor, seleccione un archivo PDF');
      return;
    }

    setIsProcessing(true);
    setProcessingType('variants');
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call the API
      const response = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar el archivo PDF');
      }

      const data = await response.json();
      onVariantsExtracted(data.variants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <details className="mt-8 border border-gray-200 rounded-lg">
      <summary className="px-4 py-3 bg-gray-50 cursor-pointer font-semibold text-lg">
        Experimental: cargar PDF de informe genético (beta)
      </summary>
      
      <div className="p-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-sm text-yellow-700">
            Esta función intenta extraer variantes de un PDF clínico y puede fallar en informes escaneados o con tablas complejas.
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar archivo PDF
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            disabled={isProcessing}
          />
        </div>
        
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          onClick={handleProcessPdf}
          disabled={isProcessing || !selectedFile}
        >
          {isProcessing && 'Procesando...'}
          {!isProcessing && 'Procesar PDF (beta)'}
        </button>
      </div>
    </details>
  );
}

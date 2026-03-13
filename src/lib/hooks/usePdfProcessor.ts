import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface PatientInfo {
  patientName: string;
  patientId: string;
  tumorType: string;
}

export function usePdfProcessor() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const processPdf = async (patientInfo?: PatientInfo) => {
    if (!selectedFile) {
      setError('Por favor, seleccione un archivo PDF');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (patientInfo?.patientName) formData.append('patientName', patientInfo.patientName);
      if (patientInfo?.patientId) formData.append('patientId', patientInfo.patientId);
      if (patientInfo?.tumorType) formData.append('tumorType', patientInfo.tumorType);

      const response = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar el archivo PDF');
      }

      const data = await response.json();
      // Keep loader visible during navigation — don't setIsProcessing(false)
      router.push(`/visualizer/${data.caseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsProcessing(false);
    }
  };

  return {
    selectedFile,
    isProcessing,
    error,
    handleFileChange,
    processPdf,
  };
}

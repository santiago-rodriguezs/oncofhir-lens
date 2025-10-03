'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, DocumentTextIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onUpload: (file: File, patientId?: string, caseLabel?: string) => Promise<void>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export default function FileUpload({ onUpload, isUploading, progress, error }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState<string>('');
  const [caseLabel, setCaseLabel] = useState<string>('');
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.vcf', '.txt'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    disabled: isUploading,
    multiple: false,
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      await onUpload(selectedFile, patientId || undefined, caseLabel || undefined);
    }
  };
  
  const handleClearFile = () => {
    setSelectedFile(null);
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          {selectedFile ? (
            <div className="flex items-center justify-center space-x-2">
              <DocumentTextIcon className="h-8 w-8 text-primary-500" />
              <span className="text-gray-700">{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
              {!isUploading && (
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ) : (
            <div>
              <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700">Arrastra y suelta un archivo VCF o PDF aquí, o haz clic para seleccionar</p>
              <p className="text-sm text-gray-500 mt-2">Tamaño máximo de archivo: 20MB</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
              ID de Paciente (opcional)
            </label>
            <input
              type="text"
              id="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="input-field"
              placeholder="Ingresa ID de paciente"
              disabled={isUploading}
            />
          </div>
          
          <div>
            <label htmlFor="caseLabel" className="block text-sm font-medium text-gray-700 mb-1">
              Etiqueta del Caso (opcional)
            </label>
            <input
              type="text"
              id="caseLabel"
              value={caseLabel}
              onChange={(e) => setCaseLabel(e.target.value)}
              className="input-field"
              placeholder="Ingresa etiqueta del caso"
              disabled={isUploading}
            />
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        {isUploading && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-primary-500 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">Procesando... {progress}%</p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Subiendo...' : 'Subir y Procesar'}
          </button>
        </div>
      </form>
    </div>
  );
}

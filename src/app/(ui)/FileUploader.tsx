'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFileLoaded: (_text: string) => void;
  disabled?: boolean;
}

export default function FileUploader({ onFileLoaded, disabled = false }: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        onFileLoaded(reader.result as string);
      };
      
      reader.readAsText(file);
    },
    [onFileLoaded]
  );
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.vcf', '.txt'],
    },
    disabled,
    maxFiles: 1,
  });
  
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center">
        <svg
          className="w-12 h-12 text-gray-400 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-lg font-medium">
          {isDragActive ? 'Suelte el archivo aquí' : 'Arrastre y suelte un archivo VCF aquí'}
        </p>
        <p className="text-sm text-gray-500 mt-1">o haga clic para seleccionar un archivo</p>
      </div>
    </div>
  );
}

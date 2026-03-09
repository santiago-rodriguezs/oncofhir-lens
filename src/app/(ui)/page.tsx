'use client';

import { useState } from 'react';
import { useVcfProcessor } from '@/lib/hooks/useVcfProcessor';
import { usePdfProcessor } from '@/lib/hooks/usePdfProcessor';
import FileUploader from './FileUploader';
import { GeneticLoader } from '@/components/GeneticLoader';

export default function Home() {
  const [workflowMode, setWorkflowMode] = useState<'pdf' | 'vcf'>('pdf');

  const vcf = useVcfProcessor();
  const pdf = usePdfProcessor();

  const isProcessing = vcf.isProcessing || pdf.isProcessing;
  const error = vcf.error || pdf.error;

  const processingMessage = () => {
    if (vcf.isProcessing) return { message: 'Analyzing Variants', submessage: 'Parsing VCF file and querying OncoKB, ClinVar, and DGIdb...' };
    if (pdf.isProcessing) return { message: 'Extracting Genomic Data', submessage: 'Extracting text and identifying variants with AI...' };
    return { message: 'Processing', submessage: 'Please wait...' };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Genetic Loader Overlay */}
      {isProcessing && (
        <GeneticLoader
          message={processingMessage().message}
          submessage={processingMessage().submessage}
        />
      )}

      <h1 className="text-3xl font-bold mb-6">OncoFHIR Lens</h1>

      {/* Workflow Selector */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${workflowMode === 'pdf' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setWorkflowMode('pdf')}
          >
            Subir estudio genómico (PDF)
          </button>
          <button
            className={`py-2 px-4 font-medium ${workflowMode === 'vcf' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setWorkflowMode('vcf')}
          >
            Procesar VCF (opcional)
          </button>
        </div>
      </div>

      {/* PDF Input - Primary Workflow */}
      {workflowMode === 'pdf' && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Subir estudio genómico (PDF)</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar archivo PDF
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={pdf.handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              disabled={isProcessing}
            />
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-sm text-yellow-700">
              Esta función extrae variantes de un PDF clínico usando Claude Sonnet 4.6.
              Los mejores resultados se obtienen con informes de texto seleccionable (no escaneados).
            </p>
          </div>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            onClick={pdf.processPdf}
            disabled={isProcessing || !pdf.selectedFile}
          >
            {pdf.isProcessing ? 'Procesando...' : 'Extraer variantes'}
          </button>
        </div>
      )}

      {/* VCF Input - Secondary Workflow */}
      {workflowMode === 'vcf' && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Procesar VCF</h2>

          {/* Dropzone para subir archivos */}
          <FileUploader onFileLoaded={vcf.setVcfText} disabled={isProcessing} />

          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">O pegue el contenido VCF:</h3>
            <textarea
              className="w-full h-40 p-2 border border-gray-300 rounded"
              placeholder="Pegue el contenido del archivo VCF aquí..."
              value={vcf.vcfText}
              onChange={(e) => vcf.setVcfText(e.target.value)}
            />
          </div>

          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            onClick={vcf.processVcf}
            disabled={isProcessing || !vcf.vcfText.trim()}
          >
            {vcf.isProcessing ? 'Procesando...' : 'Procesar VCF'}
          </button>

          <button
            className="mt-4 ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
            onClick={vcf.loadSample}
            disabled={isProcessing}
          >
            Cargar ejemplo VCF
          </button>

          <button
            className="mt-4 ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            onClick={vcf.loadRichExample}
            disabled={isProcessing}
          >
            Cargar ejemplo enriquecido
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
        OncoFHIR Lens - Powered by Claude Sonnet 4.6
      </div>
    </div>
  );
}

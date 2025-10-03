'use client';

import { useState } from 'react';
import { Variant, Annotation } from '@/lib/schemas';
import FileUploader from './FileUploader';
import ExperimentalPdfSection from './ExperimentalPdfSection';

export default function Home() {
  const [vcfText, setVcfText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingType, setProcessingType] = useState<string>('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [fhirBundle, setFhirBundle] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('variants');

  // Process VCF
  const handleProcessVcf = async () => {
    if (!vcfText.trim()) {
      setError('Por favor, ingrese el contenido VCF');
      return;
    }

    setIsProcessing(true);
    setProcessingType('variants');
    setError(null);

    try {
      const response = await fetch('/api/study/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vcf: vcfText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar el archivo VCF');
      }

      const data = await response.json();
      setVariants(data.variants);
      setActiveTab('variants');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
    }
  };

  // Annotate variants
  const handleAnnotate = async () => {
    if (variants.length === 0) {
      setError('Primero debe procesar un archivo VCF');
      return;
    }

    setIsProcessing(true);
    setProcessingType('annotations');
    setError(null);

    try {
      const response = await fetch('/api/annotate/oncokb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variants }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al anotar las variantes');
      }

      const data = await response.json();
      setAnnotations(data.annotations);
      setActiveTab('annotations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate FHIR Bundle
  const handleGenerateFhir = async () => {
    if (annotations.length === 0) {
      setError('Primero debe anotar las variantes');
      return;
    }

    setIsProcessing(true);
    setProcessingType('fhir');
    setError(null);

    try {
      const response = await fetch('/api/fhir/compose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          annotations,
          patient: {
            id: 'example-patient',
            name: 'Patient Example',
          },
          specimen: {
            id: 'example-specimen',
            type: 'Blood',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el Bundle FHIR');
      }

      const data = await response.json();
      setFhirBundle(data.bundle);
      setActiveTab('fhir');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    if (!fhirBundle) return;
    
    navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2))
      .then(() => {
        alert('JSON copiado al portapapeles');
      })
      .catch((err) => {
        console.error('Error al copiar:', err);
        setError('Error al copiar al portapapeles');
      });
  };
  
  // Load sample VCF
  const handleLoadSample = async () => {
    try {
      const response = await fetch('/sample.vcf');
      if (!response.ok) {
        throw new Error('Error al cargar el archivo de ejemplo');
      }
      const text = await response.text();
      setVcfText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">OncoFHIR Lens</h1>
      
      {/* VCF Input */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Subir VCF</h2>
        
        {/* Dropzone para subir archivos */}
        <FileUploader onFileLoaded={setVcfText} disabled={isProcessing} />
        
        <div className="mt-4">
          <h3 className="text-md font-medium mb-2">O pegue el contenido VCF:</h3>
          <textarea
            className="w-full h-40 p-2 border border-gray-300 rounded"
            placeholder="Pegue el contenido del archivo VCF aquí..."
            value={vcfText}
            onChange={(e) => setVcfText(e.target.value)}
          />
        </div>
        
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          onClick={handleProcessVcf}
          disabled={isProcessing || !vcfText.trim()}
        >
          {isProcessing && processingType === 'variants' ? 'Procesando...' : 'Procesar VCF'}
        </button>
        
        <button 
          className="mt-4 ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
          onClick={handleLoadSample}
        >
          Cargar ejemplo VCF
        </button>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Results Tabs */}
      {variants.length > 0 && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`mr-2 py-2 px-4 font-medium ${
                  activeTab === 'variants'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('variants')}
              >
                Variantes
              </button>
              <button
                className={`mr-2 py-2 px-4 font-medium ${
                  activeTab === 'annotations'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('annotations')}
                disabled={annotations.length === 0}
              >
                Anotaciones
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'fhir'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('fhir')}
                disabled={!fhirBundle}
              >
                FHIR Bundle
              </button>
            </nav>
          </div>
          
          {/* Variants Table */}
          {activeTab === 'variants' && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Variantes ({variants.length})</h3>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                  onClick={handleAnnotate}
                  disabled={isProcessing || variants.length === 0}
                >
                  {isProcessing && processingType === 'annotations' ? 'Anotando...' : 'Anotar con OncoKB/Sonnet'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b">Gen</th>
                      <th className="py-2 px-4 border-b">Cromosoma</th>
                      <th className="py-2 px-4 border-b">Posición</th>
                      <th className="py-2 px-4 border-b">Ref</th>
                      <th className="py-2 px-4 border-b">Alt</th>
                      <th className="py-2 px-4 border-b">VAF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-4 border-b">{variant.gene || 'N/A'}</td>
                        <td className="py-2 px-4 border-b">{variant.chrom}</td>
                        <td className="py-2 px-4 border-b">{variant.pos}</td>
                        <td className="py-2 px-4 border-b">{variant.ref}</td>
                        <td className="py-2 px-4 border-b">{variant.alt}</td>
                        <td className="py-2 px-4 border-b">
                          {variant.vaf !== undefined ? `${(variant.vaf * 100).toFixed(2)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Annotations */}
          {activeTab === 'annotations' && annotations.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Anotaciones ({annotations.length})</h3>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                  onClick={handleGenerateFhir}
                  disabled={isProcessing || annotations.length === 0}
                >
                  {isProcessing && processingType === 'fhir' ? 'Generando...' : 'Generar FHIR Bundle'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b">Gen</th>
                      <th className="py-2 px-4 border-b">Variante</th>
                      <th className="py-2 px-4 border-b">Oncogenicidad</th>
                      <th className="py-2 px-4 border-b">Tipos de Cáncer</th>
                      <th className="py-2 px-4 border-b">Accionabilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annotations.map((annotation, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-4 border-b">{annotation.gene}</td>
                        <td className="py-2 px-4 border-b">{annotation.variant}</td>
                        <td className="py-2 px-4 border-b">{annotation.oncogenicity || 'Unknown'}</td>
                        <td className="py-2 px-4 border-b">
                          {annotation.cancerTypes?.join(', ') || 'N/A'}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {annotation.actionability?.map(a => `${a.drug} (${a.level})`).join(', ') || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* FHIR Bundle */}
          {activeTab === 'fhir' && fhirBundle && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">FHIR Bundle</h3>
                <button
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  onClick={handleCopyJson}
                >
                  Copiar JSON
                </button>
              </div>
              <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                <pre className="text-sm">{JSON.stringify(fhirBundle, null, 2)}</pre>
              </div>
            </div>
          )}
          
        </div>
      )}
      
      {/* Experimental PDF Section - Siempre visible */}
      <ExperimentalPdfSection 
        onVariantsExtracted={setVariants}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        setProcessingType={setProcessingType}
        setError={setError}
      />
    </div>
  );
}

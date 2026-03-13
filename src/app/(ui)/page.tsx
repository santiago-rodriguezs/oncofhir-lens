'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useVcfProcessor } from '@/lib/hooks/useVcfProcessor';
import { usePdfProcessor } from '@/lib/hooks/usePdfProcessor';
import { GeneticLoader } from '@/components/GeneticLoader';

export default function Home() {
  const [workflowMode, setWorkflowMode] = useState<'pdf' | 'vcf'>('pdf');
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [patientFirstName, setPatientFirstName] = useState('');
  const [patientLastName, setPatientLastName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [tumorType, setTumorType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patientName = [patientFirstName, patientLastName].filter(Boolean).join(' ');
  const patientInfo = (patientName || patientId || tumorType)
    ? { patientName, patientId, tumorType }
    : undefined;

  const vcf = useVcfProcessor();
  const pdf = usePdfProcessor();

  const isProcessing = vcf.isProcessing || pdf.isProcessing;
  const error = vcf.error || pdf.error;

  const processingMessage = () => {
    if (vcf.isProcessing) return { message: 'Analizando Variantes', submessage: 'Parseando VCF y consultando OncoKB, ClinVar y DGIdb...' };
    if (pdf.isProcessing) return { message: 'Extrayendo Datos Genómicos', submessage: 'Extrayendo texto e identificando variantes con IA...' };
    return { message: 'Procesando', submessage: 'Por favor espere...' };
  };

  const onDropPdf = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(acceptedFiles[0]);
      pdf.handleFileChange({ target: { files: dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [pdf]);

  const pdfDropzone = useDropzone({
    onDrop: onDropPdf,
    accept: { 'application/pdf': ['.pdf'] },
    disabled: isProcessing,
    maxFiles: 1,
    noClick: false,
  });

  return (
    <div className="min-h-[calc(100vh-180px)] flex flex-col">
      {isProcessing && (
        <GeneticLoader
          message={processingMessage().message}
          submessage={processingMessage().submessage}
        />
      )}

      {/* Hero */}
      <div className="text-center py-10 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
          Powered by Claude Sonnet / Opus 4.6
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
          Genómica de Precisión
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-base">
          Subí un estudio genómico y obtené variantes anotadas, interpretación clínica
          y datos interoperables en FHIR y GA4GH en segundos.
        </p>

        <div className="flex flex-wrap justify-center gap-1.5 mt-5">
          {BADGES.map((b) => (
            <span key={b} className="text-xs px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500">
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Workflow Selector */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setWorkflowMode('pdf')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all border ${
              workflowMode === 'pdf'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="block text-base">Reporte PDF</span>
            <span className={`text-xs font-normal ${workflowMode === 'pdf' ? 'text-slate-400' : 'text-slate-400'}`}>
              Foundation, Guardant, etc.
            </span>
          </button>
          <button
            onClick={() => setWorkflowMode('vcf')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all border ${
              workflowMode === 'vcf'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="block text-base">Archivo VCF</span>
            <span className={`text-xs font-normal ${workflowMode === 'vcf' ? 'text-slate-400' : 'text-slate-400'}`}>
              NGS / WES / WGS
            </span>
          </button>
        </div>

        {/* Patient info (optional) */}
        <div className="mb-4">
          <button
            onClick={() => setShowPatientForm(!showPatientForm)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${showPatientForm ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Datos del paciente
            <span className="text-xs text-slate-400">(opcional)</span>
          </button>
          {showPatientForm && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
                <input
                  type="text"
                  placeholder="Juan"
                  value={patientFirstName}
                  onChange={(e) => setPatientFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Apellido</label>
                <input
                  type="text"
                  placeholder="Pérez"
                  value={patientLastName}
                  onChange={(e) => setPatientLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">DNI / ID</label>
                <input
                  type="text"
                  placeholder="12345678"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de tumor</label>
                <input
                  type="text"
                  placeholder="NSCLC, Breast, etc."
                  value={tumorType}
                  onChange={(e) => setTumorType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* PDF Upload */}
        {workflowMode === 'pdf' && (
          <div className="space-y-4">
            <div
              {...pdfDropzone.getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                pdfDropzone.isDragActive
                  ? 'border-slate-400 bg-slate-50'
                  : pdf.selectedFile
                  ? 'border-slate-300 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input {...pdfDropzone.getInputProps()} />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={pdf.handleFileChange}
                className="hidden"
              />

              {pdf.selectedFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-800">{pdf.selectedFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {(pdf.selectedFile.size / 1024).toFixed(0)} KB — Listo para procesar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">
                      {pdfDropzone.isDragActive ? 'Soltar archivo aquí' : 'Arrastrá un PDF o hacé click para seleccionar'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Reportes de secuenciación en formato PDF
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
              onClick={() => pdf.processPdf(patientInfo)}
              disabled={isProcessing || !pdf.selectedFile}
            >
              {pdf.isProcessing ? 'Procesando...' : 'Extraer variantes y analizar'}
            </button>
          </div>
        )}

        {/* VCF Upload */}
        {workflowMode === 'vcf' && (
          <div className="space-y-4">
            <VcfDropzone onFileLoaded={vcf.setVcfText} disabled={isProcessing} />

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                O pegá el contenido VCF directamente:
              </label>
              <textarea
                className="w-full h-32 p-3 border border-slate-200 rounded-lg text-sm font-mono bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none transition-all resize-none"
                placeholder="##fileformat=VCFv4.2&#10;#CHROM  POS  ID  REF  ALT  QUAL  FILTER  INFO&#10;..."
                value={vcf.vcfText}
                onChange={(e) => vcf.setVcfText(e.target.value)}
              />
            </div>

            <button
              className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
              onClick={() => vcf.processVcf(patientInfo)}
              disabled={isProcessing || !vcf.vcfText.trim()}
            >
              {vcf.isProcessing ? 'Procesando...' : 'Procesar VCF'}
            </button>

            <div className="relative group">
              <button
                className="w-full py-2.5 px-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-all"
                onClick={vcf.loadRichExample}
                disabled={isProcessing}
              >
                Cargar ejemplo oncológico
                <span className="block text-xs text-slate-400 font-normal">20 variantes somáticas con datos clínicos</span>
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                <p className="font-semibold mb-1">VCF de ejemplo oncológico</p>
                <ul className="space-y-0.5 text-slate-300">
                  <li>20 variantes somáticas en genes accionables</li>
                  <li>Genes: EGFR, TP53, PIK3CA, KRAS, BRCA1/2, ALK, PTEN, etc.</li>
                  <li>Incluye: VAF, profundidad (DP), cambio proteico (HGVS.p), oncogenicidad y tipo de cáncer</li>
                  <li>Coordenadas GRCh38, formato VCF 4.2</li>
                </ul>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Pipeline mini */}
      <div className="max-w-2xl mx-auto w-full mt-10 mb-4">
        <div className="grid grid-cols-4 gap-3 text-center">
          {STEPS.map((step, idx) => (
            <div key={step.label} className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 text-sm font-bold border border-slate-200">
                {idx + 1}
              </div>
              <p className="text-xs font-medium text-slate-600 mt-1.5">{step.label}</p>
              <p className="text-[10px] text-slate-400">{step.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VcfDropzone({ onFileLoaded, disabled }: { onFileLoaded: (text: string) => void; disabled: boolean }) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const reader = new FileReader();
      reader.onload = () => onFileLoaded(reader.result as string);
      reader.readAsText(acceptedFiles[0]);
    },
    [onFileLoaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.vcf', '.txt'] },
    disabled,
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        isDragActive
          ? 'border-slate-400 bg-slate-50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <p className="font-medium text-slate-700">
        {isDragActive ? 'Soltar archivo aquí' : 'Arrastrá un archivo VCF o hacé click'}
      </p>
      <p className="text-xs text-slate-400 mt-1">Formato VCFv4.x</p>
    </div>
  );
}

const BADGES = [
  'OncoKB', 'ClinVar', 'DGIdb', 'FHIR Genomics IG', 'GA4GH VRS', 'Phenopackets v2', 'AMP/ASCO/CAP',
];

const STEPS = [
  { label: 'Subir', sub: 'PDF o VCF' },
  { label: 'Anotar', sub: '3 fuentes' },
  { label: 'Interpretar', sub: 'AMP Tiers' },
  { label: 'Exportar', sub: 'FHIR + GA4GH' },
];

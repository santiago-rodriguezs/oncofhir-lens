import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useVcfProcessor() {
  const router = useRouter();
  const [vcfText, setVcfText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processVcf = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/vcf/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vcf: vcfText }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      router.push(`/visualizer/${data.caseId}`);
    } catch (err) {
      setError(`Error processing VCF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadRichExample = async () => {
    setError(null);
    try {
      const response = await fetch('/examples/cancer_variants_rich.vcf');
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const vcfContent = await response.text();
      setVcfText(vcfContent);
    } catch (err) {
      setError(`Error al cargar ejemplo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const loadSample = async () => {
    try {
      const response = await fetch('/sample.vcf');
      if (!response.ok) throw new Error('Error al cargar el archivo de ejemplo');
      const text = await response.text();
      setVcfText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return {
    vcfText,
    setVcfText,
    isProcessing,
    error,
    processVcf,
    loadRichExample,
    loadSample,
  };
}
